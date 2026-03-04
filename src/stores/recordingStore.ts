/**
 * DEVORA DEVS — Recording Store (Zustand)
 * http://devoradevs.xyz/
 */

import { create } from "zustand";
import type { TranscriptSegment } from "../lib/types";

type RecordingStatus = "idle" | "recording" | "paused" | "processing";

interface RecordingState {
    status: RecordingStatus;
    elapsed_ms: number;
    liveSegments: TranscriptSegment[];
    audioLevel: number; // 0–1 for waveform

    startRecording: () => void;
    pauseRecording: () => void;
    resumeRecording: () => void;
    stopRecording: () => void;
    setProcessing: () => void;
    resetRecording: () => void;
    tick: (ms: number) => void;
    appendSegment: (seg: TranscriptSegment) => void;
    setAudioLevel: (level: number) => void;
}

export const useRecordingStore = create<RecordingState>()((set) => ({
    status: "idle",
    elapsed_ms: 0,
    liveSegments: [],
    audioLevel: 0,

    startRecording: () => set({ status: "recording", elapsed_ms: 0, liveSegments: [] }),
    pauseRecording: () => set({ status: "paused" }),
    resumeRecording: () => set({ status: "recording" }),
    stopRecording: () => set({ status: "idle" }),
    setProcessing: () => set({ status: "processing" }),
    resetRecording: () => set({ status: "idle", elapsed_ms: 0, liveSegments: [], audioLevel: 0 }),

    tick: (ms) => set((s) => ({ elapsed_ms: s.elapsed_ms + ms })),

    appendSegment: (seg) =>
        set((s) => ({ liveSegments: [...s.liveSegments, seg] })),

    setAudioLevel: (level) => set({ audioLevel: level }),
}));
