/**
 * DEVORA DEVS — Real Recorder View
 * http://devoradevs.xyz/
 *
 * Full real pipeline:
 *  1. MediaRecorder captures mic audio in 30s chunks
 *  2. Each chunk → Groq Whisper API → real transcript segments
 *  3. Stop → MR-002 diarization + MR-001 analysis + MR-005 health score
 *  4. Results stored in Zustand (persisted)
 */

import { useState, useRef, useEffect, useCallback } from "react";
import { Mic, Square, Pause, Play, Loader2, AlertTriangle, ExternalLink } from "lucide-react";
import { useRecordingStore } from "../../stores/recordingStore";
import { useMeetingStore } from "../../stores/meetingStore";
import { useUserConfig } from "../../stores/userConfigStore";
import { MeetingRecorder } from "../../lib/audioRecorder";
import { analyzeMeeting, cleanDiarization, scoreMeetingHealth } from "../../lib/analysis";
import { auditLog } from "../../lib/auditLog";
import type { TranscriptSegment, Decision } from "../../lib/types";
import { WebviewWindow } from "@tauri-apps/api/webviewWindow";

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatTime(ms: number) {
    const s = Math.floor(ms / 1000);
    const m = Math.floor(s / 60);
    const h = Math.floor(m / 60);
    return h > 0
        ? `${String(h).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`
        : `${String(m).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
}

// ── Waveform visualizer ──────────────────────────────────────────────────────

function Waveform({ level, active }: { level: number; active: boolean }) {
    const bars = 48;
    return (
        <div
            style={{
                display: "flex", alignItems: "flex-end", gap: 2,
                height: 64, padding: "0 4px",
            }}
        >
            {Array.from({ length: bars }).map((_, i) => {
                const phase = Math.sin((i / bars) * Math.PI * 2 + Date.now() / 300) * 0.5 + 0.5;
                const h = active
                    ? Math.max(3, phase * level * 60 + Math.random() * 4)
                    : 3;
                return (
                    <div
                        key={i}
                        style={{
                            flex: 1, borderRadius: 2,
                            height: h,
                            background: active
                                ? `rgba(0,212,255,${0.3 + phase * 0.7})`
                                : "rgba(255,255,255,0.07)",
                            transition: active ? "height 0.08s ease" : "height 0.5s ease",
                            boxShadow: active && h > 20 ? "0 0 6px rgba(0,212,255,0.4)" : "none",
                        }}
                    />
                );
            })}
        </div>
    );
}

// ── Main component ───────────────────────────────────────────────────────────

export function Recorder() {
    const {
        status, elapsed_ms, liveSegments,
        startRecording, stopRecording, pauseRecording, resumeRecording,
        tick, appendSegment, setAudioLevel, resetRecording,
    } = useRecordingStore();

    const { addMeeting, addActionItems, addDecisions, addSegments } = useMeetingStore();
    const { groqApiKey } = useUserConfig();

    const [attendees, setAttendees] = useState("");
    const [analysisStep, setAnalysisStep] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [level, setLevel] = useState(0);
    const [elapsedDisplay, setElapsedDisplay] = useState(0);
    const [showingOverlay, setShowingOverlay] = useState(false);

    // Toggle Overlay Window
    const handleToggleOverlay = async () => {
        try {
            const overlay = await WebviewWindow.getByLabel("overlay");
            if (overlay) {
                const isVisible = await overlay.isVisible();
                if (isVisible) {
                    await overlay.hide();
                    setShowingOverlay(false);
                } else {
                    await overlay.show();
                    await overlay.setFocus();
                    setShowingOverlay(true);
                }
            }
        } catch (err) {
            console.error("Overlay toggle failed:", err);
        }
    };

    const recorderRef = useRef<MeetingRecorder | null>(null);
    const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const transcriptRef = useRef<HTMLDivElement>(null);

    // Clock display
    useEffect(() => {
        if (status === "recording") {
            tickRef.current = setInterval(() => {
                tick(500);
                setElapsedDisplay(recorderRef.current?.elapsed ?? 0);
            }, 500);
        } else {
            if (tickRef.current) clearInterval(tickRef.current);
        }
        return () => { if (tickRef.current) clearInterval(tickRef.current); };
    }, [status]);

    // Auto-scroll transcript
    useEffect(() => {
        if (transcriptRef.current) {
            transcriptRef.current.scrollTop = transcriptRef.current.scrollHeight;
        }
    }, [liveSegments.length]);

    // ── Start ──
    const handleStart = useCallback(async () => {
        setError(null);

        if (!groqApiKey) {
            setError("No Groq API key — go to Settings and add yours (free at console.groq.com).");
            return;
        }

        try {
            const recorder = new MeetingRecorder((evt) => {
                if (evt.type === "level") {
                    setLevel(evt.value);
                    setAudioLevel(evt.value);
                } else if (evt.type === "chunk") {
                    appendSegment({
                        id: crypto.randomUUID(),
                        meeting_id: "live",
                        speaker: evt.speaker,
                        start_ms: evt.start_ms,
                        end_ms: evt.end_ms,
                        text: evt.text,
                        confidence: 1,
                    });
                } else if (evt.type === "error") {
                    setError(evt.message);
                }
            });

            await recorder.start();
            recorderRef.current = recorder;
            startRecording();
            auditLog("start_recording", "recording", "live");
        } catch (err) {
            const msg = err instanceof Error ? err.message : "Could not start recording";
            setError(
                msg.includes("Permission")
                    ? "Microphone permission denied. Please allow mic access and try again."
                    : msg
            );
        }
    }, [groqApiKey, startRecording, appendSegment, setAudioLevel]);

    // ── Pause / Resume ──
    const handlePause = useCallback(() => {
        recorderRef.current?.pause();
        pauseRecording();
    }, [pauseRecording]);

    const handleResume = useCallback(() => {
        recorderRef.current?.resume();
        resumeRecording();
    }, [resumeRecording]);

    // ── Stop & Analyze ──
    const handleStop = useCallback(async () => {
        if (!recorderRef.current) return;

        try {
            setAnalysisStep("⏹ Stopping recording & flushing audio...");
            const elapsed = await recorderRef.current.stop();
            stopRecording();
            recorderRef.current = null;

            const segments = useRecordingStore.getState().liveSegments;

            if (segments.length === 0) {
                setAnalysisStep("");
                setError("No speech detected. Make sure your microphone is working.");
                resetRecording();
                return;
            }

            auditLog("stop_recording", "recording", "live", { segments: segments.length });

            // MR-002 — Diarization cleanup
            setAnalysisStep("🧹 Cleaning speaker labels...");
            const attendeeList = attendees.split(",").map(a => a.trim()).filter(Boolean);
            const cleaned = await cleanDiarization(segments as TranscriptSegment[], attendeeList);

            // MR-001 — Full meeting analysis
            setAnalysisStep("🤖 Analyzing meeting with AI (MR-001)...");
            const analysis = await analyzeMeeting(
                cleaned.segments as TranscriptSegment[],
                new Date().toISOString(),
                attendeeList
            );

            // MR-005 — Health score
            setAnalysisStep("📊 Scoring meeting health (MR-005)...");
            const health = await scoreMeetingHealth(analysis, {
                scheduled_duration_minutes: 60,
                actual_duration_minutes: analysis.duration_minutes,
                attendee_count: analysis.attendees.length,
                meeting_type: "general",
            });

            // Persist everything
            setAnalysisStep("💾 Saving...");
            const meetingId = crypto.randomUUID();
            const now = new Date().toISOString();

            addMeeting({
                id: meetingId,
                title: analysis.title,
                date: now,
                duration_ms: elapsed,
                attendees: analysis.attendees,
                audio_path: "",
                transcript_path: "",
                status: "ready",
                sentiment: analysis.sentiment,
                effectiveness_score: health.health_score / 10,
                created_at: now,
                updated_at: now,
            });

            addActionItems(
                analysis.action_items.map(a => ({
                    ...a,
                    meeting_id: meetingId,
                    status: "open" as const,
                    dependencies: a.dependencies ?? [],
                    estimated_minutes: a.estimated_minutes ?? null,
                    created_at: now,
                }))
            );

            addDecisions(
                analysis.key_decisions.map((d): Decision => ({
                    id: crypto.randomUUID(),
                    meeting_id: meetingId,
                    decision: d.decision,
                    context: d.rationale,
                    decided_by: d.decided_by,
                    timestamp_ms: d.timestamp_ms,
                }))
            );

            addSegments(
                (cleaned.segments as TranscriptSegment[]).map(s => ({
                    ...s,
                    id: crypto.randomUUID(),
                    meeting_id: meetingId,
                }))
            );

            auditLog("analysis_complete", "meeting", meetingId, {
                title: analysis.title,
                actions: analysis.action_items.length,
                score: health.health_score,
            });

            setAnalysisStep("✅ Done! Meeting saved.");
            resetRecording();
            setTimeout(() => setAnalysisStep(""), 3000);
        } catch (err) {
            resetRecording();
            recorderRef.current = null;
            setAnalysisStep("");
            setError(err instanceof Error ? err.message : "Analysis failed. Check your API key in Settings.");
        }
    }, [attendees, stopRecording, resetRecording, addMeeting, addActionItems, addDecisions, addSegments]);

    const isLive = status === "recording";
    const isPaused = status === "paused";
    const isAnalyzing = !!analysisStep;
    const noBrowserMic = typeof navigator === "undefined" || !navigator.mediaDevices;

    const speakerColors = ["#00d4ff", "#f0c040", "#a78bfa", "#3ddc84", "#fb923c"];

    return (
        <div className="fade-in" style={{ display: "flex", flexDirection: "column", height: "100%", padding: "32px 36px" }}>

            {/* Header */}
            <div style={{ marginBottom: 28, display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                    <h1 style={{
                        fontFamily: "var(--font-display)", fontSize: 28, fontWeight: 800,
                        color: "var(--text-primary)", letterSpacing: "-0.03em",
                    }}>Record Meeting</h1>
                    <p style={{ color: "var(--text-muted)", fontSize: 12.5, marginTop: 4 }}>
                        Mic audio → Groq Whisper → Live transcript → AI analysis
                    </p>
                </div>

                {/* Overlay Toggle */}
                <button
                    className="btn btn-ghost"
                    onClick={handleToggleOverlay}
                    style={{ padding: "6px 14px", fontSize: 11, borderRadius: 20 }}
                >
                    {showingOverlay ? "Hide" : "Show"} Floating Overlay
                </button>
            </div>

            {/* No key warning */}
            {!groqApiKey && !error && (
                <div style={{
                    marginBottom: 20, padding: "14px 18px",
                    background: "rgba(240,192,64,0.06)",
                    border: "1px solid rgba(240,192,64,0.25)",
                    borderRadius: 12,
                    display: "flex", alignItems: "center", gap: 12,
                }}>
                    <AlertTriangle size={16} style={{ color: "#f0c040", flexShrink: 0 }} />
                    <span style={{ fontSize: 13, color: "#f0c040" }}>
                        Add your Groq API key in{" "}
                        <strong>Settings</strong> to enable real transcription &amp; AI analysis.
                    </span>
                    <a href="https://console.groq.com" target="_blank" rel="noopener noreferrer"
                        className="btn btn-ghost" style={{ marginLeft: "auto", padding: "5px 12px", fontSize: 11, textDecoration: "none" }}>
                        <ExternalLink size={11} /> Get Free Key
                    </a>
                </div>
            )}

            {/* Attendees */}
            <div className="card-static" style={{ marginBottom: 20, padding: "16px 20px", borderRadius: 12 }}>
                <label style={{
                    fontSize: 10, fontWeight: 700, letterSpacing: "0.08em",
                    textTransform: "uppercase", color: "var(--text-muted)", display: "block", marginBottom: 8
                }}>
                    Attendees (comma-separated, optional)
                </label>
                <input
                    className="input"
                    placeholder="Sarah Chen, John Smith, Alex Johnson …"
                    value={attendees}
                    onChange={e => setAttendees(e.target.value)}
                    disabled={isLive || isPaused || isAnalyzing}
                />
            </div>

            {/* Recorder card */}
            <div
                className="card-static"
                style={{
                    flex: 1, display: "flex", flexDirection: "column",
                    alignItems: "center", justifyContent: "center", gap: 24,
                    borderRadius: 20, padding: "40px 32px",
                    borderColor: isLive ? "rgba(255,79,79,0.35)" : "var(--border)",
                    boxShadow: isLive
                        ? "0 0 60px rgba(255,79,79,0.08), 0 8px 32px rgba(0,0,0,0.6)"
                        : "0 8px 32px rgba(0,0,0,0.6)",
                    transition: "border-color 0.4s, box-shadow 0.4s",
                    minHeight: 320,
                }}
            >
                {/* Waveform */}
                <div style={{ width: "100%", maxWidth: 600 }}>
                    <Waveform level={level} active={isLive} />
                </div>

                {/* Timer */}
                <div style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: 56, fontWeight: 900, letterSpacing: 3, lineHeight: 1,
                    color: isLive ? "#ff4f4f" : isPaused ? "#f0c040" : "rgba(255,255,255,0.15)",
                    transition: "color 0.4s",
                    textShadow: isLive ? "0 0 40px rgba(255,79,79,0.3)" : "none",
                }}>
                    {formatTime(isLive ? elapsedDisplay : elapsed_ms)}
                </div>

                {/* Status */}
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    {isLive && (
                        <div className="live-badge">
                            <div className="recording-dot" />
                            LIVE · Transcribing
                        </div>
                    )}
                    {isPaused && (
                        <span className="badge badge-gold" style={{ fontSize: 12, padding: "5px 14px" }}>⏸ PAUSED</span>
                    )}
                    {isAnalyzing && (
                        <div style={{
                            display: "flex", alignItems: "center", gap: 8,
                            color: "var(--teal-glow)", fontSize: 13, fontWeight: 600
                        }}>
                            <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} />
                            {analysisStep}
                        </div>
                    )}
                    {!isLive && !isPaused && !isAnalyzing && (
                        <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
                            Ready to record
                        </span>
                    )}
                </div>

                {/* Controls */}
                <div style={{ display: "flex", gap: 12 }}>
                    {!isLive && !isPaused && !isAnalyzing && (
                        <button
                            className="btn btn-danger"
                            style={{ padding: "13px 36px", fontSize: 15, borderRadius: 12 }}
                            onClick={handleStart}
                            disabled={noBrowserMic}
                        >
                            <Mic size={18} />
                            Start Recording
                        </button>
                    )}
                    {isLive && (
                        <>
                            <button className="btn btn-ghost" onClick={handlePause}
                                style={{ padding: "12px 24px" }}>
                                <Pause size={16} /> Pause
                            </button>
                            <button className="btn btn-danger" onClick={handleStop}
                                style={{ padding: "12px 24px" }}>
                                <Square size={14} /> Stop &amp; Analyze
                            </button>
                        </>
                    )}
                    {isPaused && (
                        <>
                            <button className="btn btn-primary" onClick={handleResume}
                                style={{ padding: "12px 24px" }}>
                                <Play size={16} /> Resume
                            </button>
                            <button className="btn btn-danger" onClick={handleStop}
                                style={{ padding: "12px 24px" }}>
                                <Square size={14} /> Stop &amp; Analyze
                            </button>
                        </>
                    )}
                </div>

                {/* Live chunk count */}
                {(isLive || isPaused) && liveSegments.length > 0 && (
                    <div style={{ fontSize: 11, color: "var(--text-muted)" }}>
                        {liveSegments.length} segment{liveSegments.length !== 1 ? "s" : ""} transcribed
                        {" · "}
                        ~{liveSegments.reduce((s, seg) => s + seg.text.split(" ").length, 0)} words
                    </div>
                )}
            </div>

            {/* Error */}
            {error && (
                <div className="fade-up" style={{
                    marginTop: 16, padding: "14px 18px",
                    background: "rgba(255,79,79,0.06)",
                    border: "1px solid rgba(255,79,79,0.25)",
                    borderRadius: 12,
                    display: "flex", alignItems: "flex-start", gap: 10,
                }}>
                    <AlertTriangle size={15} style={{ color: "#ff4f4f", flexShrink: 0, marginTop: 1 }} />
                    <div>
                        <div style={{ fontSize: 13, color: "#ff6b6b", fontWeight: 600 }}>Error</div>
                        <div style={{ fontSize: 12, color: "#cc4444", marginTop: 2 }}>{error}</div>
                    </div>
                    <button
                        className="btn-icon"
                        style={{ marginLeft: "auto" }}
                        onClick={() => setError(null)}
                    >✕</button>
                </div>
            )}

            {/* Live transcript panel */}
            {liveSegments.length > 0 && (
                <div className="card-static fade-up" style={{
                    marginTop: 16, borderRadius: 14, padding: "16px 20px",
                    maxHeight: 260, overflow: "hidden", display: "flex", flexDirection: "column",
                }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                        <span style={{
                            fontSize: 10, fontWeight: 700, letterSpacing: "0.08em",
                            textTransform: "uppercase", color: "var(--text-muted)"
                        }}>
                            Live Transcript
                        </span>
                        {isLive && <div className="recording-dot" />}
                    </div>
                    <div
                        ref={transcriptRef}
                        style={{
                            flex: 1, overflowY: "auto",
                            display: "flex", flexDirection: "column", gap: 6,
                            fontFamily: "var(--font-mono)", fontSize: 12,
                        }}
                    >
                        {liveSegments.map((seg, _i) => {
                            const speakerIdx = parseInt(seg.speaker.replace("SPEAKER_", ""), 10) || 0;
                            const color = speakerColors[speakerIdx % speakerColors.length];
                            return (
                                <div key={seg.id} className="fade-in" style={{ display: "flex", gap: 10 }}>
                                    <span style={{ color, fontWeight: 700, minWidth: 88, flexShrink: 0, fontSize: 10.5 }}>
                                        {seg.speaker}
                                    </span>
                                    <span style={{ color: "rgba(255,255,255,0.7)", lineHeight: 1.5 }}>{seg.text}</span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Spinner keyframe */}
            <style>{`@keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }`}</style>
        </div>
    );
}
