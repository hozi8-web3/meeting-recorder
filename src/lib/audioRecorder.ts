/**
 * DEVORA DEVS — Real Audio Recorder
 * http://devoradevs.xyz/
 *
 * Uses MediaRecorder API to capture microphone audio in chunks.
 * Each chunk is sent to Groq's Whisper API for transcription.
 * Fully real — no simulation.
 */

import { useUserConfig } from "../stores/userConfigStore";

export interface TranscriptionChunk {
    text: string;
    start_ms: number;
    end_ms: number;
}

// ── Whisper transcription via Groq API ────────────────────────────────────────

export async function transcribeAudioBlob(
    blob: Blob,
    startMs: number
): Promise<TranscriptionChunk[]> {
    const apiKey = useUserConfig.getState().groqApiKey;
    if (!apiKey) {
        throw new Error("No API key. Enter it in Settings.");
    }

    // Convert to WAV-compatible MIME for Groq Whisper
    const audioFile = new File([blob], "chunk.webm", { type: blob.type || "audio/webm" });

    const formData = new FormData();
    formData.append("file", audioFile, "chunk.webm");
    formData.append("model", "whisper-large-v3-turbo");
    formData.append("response_format", "verbose_json");
    formData.append("language", "en");
    formData.append("temperature", "0");

    const response = await fetch("https://api.groq.com/openai/v1/audio/transcriptions", {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}` },
        body: formData,
    });

    if (!response.ok) {
        const err = await response.json().catch(() => ({})) as { error?: { message?: string } };
        throw new Error(`Whisper API error: ${err?.error?.message ?? response.statusText}`);
    }

    const data = await response.json() as {
        text: string;
        segments?: Array<{
            start: number;
            end: number;
            text: string;
        }>;
    };

    // If Whisper returns fine-grained segments, use them
    if (data.segments && data.segments.length > 0) {
        return data.segments.map(seg => ({
            text: seg.text.trim(),
            start_ms: startMs + Math.round(seg.start * 1000),
            end_ms: startMs + Math.round(seg.end * 1000),
        })).filter(s => s.text.length > 0);
    }

    // Fallback: single chunk for the whole clip
    if (data.text.trim()) {
        return [{ text: data.text.trim(), start_ms: startMs, end_ms: startMs + blob.size }];
    }

    return [];
}

// ── Recorder class ─────────────────────────────────────────────────────────────

export type RecorderEvent =
    | { type: "chunk"; text: string; start_ms: number; end_ms: number; speaker: string }
    | { type: "level"; value: number }
    | { type: "error"; message: string }
    | { type: "stopped" };

export class MeetingRecorder {
    private mediaRecorder: MediaRecorder | null = null;
    private stream: MediaStream | null = null;
    private audioCtx: AudioContext | null = null;
    private analyser: AnalyserNode | null = null;
    private levelTimer: ReturnType<typeof setInterval> | null = null;
    private chunkQueue: Array<{ blob: Blob; startMs: number }> = [];
    private processing = false;
    private startTime = 0;
    private totalPausedMs = 0;
    private pauseStart = 0;
    private onEvent: (evt: RecorderEvent) => void;
    private speakerIndex = 0;
    private readonly SPEAKERS = ["SPEAKER_00", "SPEAKER_01", "SPEAKER_02", "SPEAKER_03"];

    constructor(onEvent: (evt: RecorderEvent) => void) {
        this.onEvent = onEvent;
    }

    async start(): Promise<void> {
        this.stream = await navigator.mediaDevices.getUserMedia({
            audio: {
                echoCancellation: true,
                noiseSuppression: true,
                sampleRate: 16000,
            },
        });

        // Audio level analyser
        this.audioCtx = new AudioContext();
        const source = this.audioCtx.createMediaStreamSource(this.stream);
        this.analyser = this.audioCtx.createAnalyser();
        this.analyser.fftSize = 256;
        source.connect(this.analyser);

        this.levelTimer = setInterval(() => {
            if (!this.analyser) return;
            const data = new Uint8Array(this.analyser.frequencyBinCount);
            this.analyser.getByteFrequencyData(data);
            const avg = data.reduce((a, b) => a + b, 0) / data.length;
            this.onEvent({ type: "level", value: Math.min(1, avg / 80) });
        }, 80);

        // Best codec for Groq Whisper upload
        const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
            ? "audio/webm;codecs=opus"
            : MediaRecorder.isTypeSupported("audio/webm")
                ? "audio/webm"
                : "audio/ogg";

        this.mediaRecorder = new MediaRecorder(this.stream, { mimeType, audioBitsPerSecond: 64000 });
        this.startTime = Date.now();
        this.totalPausedMs = 0;
        this.speakerIndex = 0;

        this.mediaRecorder.ondataavailable = async (e) => {
            if (e.data.size < 500) return; // skip empty/tiny chunks
            const sliceStartMs = (Date.now() - this.startTime) - this.totalPausedMs - 30000;
            this.chunkQueue.push({ blob: e.data, startMs: Math.max(0, sliceStartMs) });
            this.processQueue();
        };

        // Record in 30s slices, start new chunk every 30s while recording
        this.mediaRecorder.start(30_000);
    }

    private async processQueue() {
        if (this.processing || this.chunkQueue.length === 0) return;
        this.processing = true;

        while (this.chunkQueue.length > 0) {
            const item = this.chunkQueue.shift()!;
            try {
                const chunks = await transcribeAudioBlob(item.blob, item.startMs);
                for (const chunk of chunks) {
                    if (chunk.text.trim()) {
                        // Simple round-robin speaker assignment (real diarization happens in MR-002)
                        const speaker = this.SPEAKERS[this.speakerIndex % this.SPEAKERS.length];
                        this.speakerIndex++;
                        this.onEvent({
                            type: "chunk",
                            text: chunk.text,
                            start_ms: chunk.start_ms,
                            end_ms: chunk.end_ms,
                            speaker,
                        });
                    }
                }
            } catch (err) {
                this.onEvent({ type: "error", message: err instanceof Error ? err.message : "Transcription failed" });
            }
        }

        this.processing = false;
    }

    pause() {
        if (this.mediaRecorder?.state === "recording") {
            this.mediaRecorder.pause();
            this.pauseStart = Date.now();
        }
    }

    resume() {
        if (this.mediaRecorder?.state === "paused") {
            this.mediaRecorder.resume();
            this.totalPausedMs += Date.now() - this.pauseStart;
        }
    }

    /** Stop recording, flush final chunk, return elapsed ms */
    async stop(): Promise<number> {
        const elapsed = Date.now() - this.startTime - this.totalPausedMs;

        await new Promise<void>(resolve => {
            if (!this.mediaRecorder || this.mediaRecorder.state === "inactive") {
                resolve();
                return;
            }
            this.mediaRecorder.onstop = () => resolve();
            this.mediaRecorder.stop();
        });

        // Process any remaining chunks
        await this.processQueue();

        this.cleanup();
        this.onEvent({ type: "stopped" });
        return elapsed;
    }

    private cleanup() {
        if (this.levelTimer) clearInterval(this.levelTimer);
        this.stream?.getTracks().forEach(t => t.stop());
        this.audioCtx?.close();
        this.stream = null;
        this.audioCtx = null;
        this.analyser = null;
        this.levelTimer = null;
        this.mediaRecorder = null;
    }

    get elapsed(): number {
        if (!this.startTime) return 0;
        return Date.now() - this.startTime - this.totalPausedMs;
    }
}
