/**
 * DEVORA DEVS — User Config Store
 * Stores user preferences in localStorage — no .env required.
 * Users can configure everything from the Settings UI.
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface UserConfig {
    // Groq API
    groqApiKey: string;

    // Models (per AI pipeline)
    modelSummary: string;
    modelDiarization: string;
    modelEmail: string;
    modelPrioritizer: string;
    modelHealth: string;

    // Whisper
    whisperModel: string;

    // Ollama
    useOllamaFallback: boolean;
    ollamaModel: string;

    // Exports
    notionApiKey: string;
    slackBotToken: string;
    slackChannelId: string;

    // Enterprise
    encryptionEnabled: boolean;
    auditLogsEnabled: boolean;
}

interface UserConfigState extends UserConfig {
    setGroqApiKey: (key: string) => void;
    setModel: (pipeline: keyof Pick<UserConfig,
        "modelSummary" | "modelDiarization" | "modelEmail" | "modelPrioritizer" | "modelHealth"
    >, model: string) => void;
    setWhisperModel: (model: string) => void;
    setOllamaFallback: (enabled: boolean) => void;
    setOllamaModel: (model: string) => void;
    setNotionApiKey: (key: string) => void;
    setSlackBotToken: (token: string) => void;
    setSlackChannelId: (id: string) => void;
    setEncryption: (enabled: boolean) => void;
    setAuditLogs: (enabled: boolean) => void;
    isConfigured: () => boolean;
}

const GROQ_MODELS = [
    "llama-3.3-70b-versatile",
    "llama-3.1-8b-instant",
    "mixtral-8x7b-32768",
    "gemma2-9b-it",
];

export { GROQ_MODELS };

export const useUserConfig = create<UserConfigState>()(
    persist(
        (set, get) => ({
            // Defaults — read from .env if provided, else blank
            groqApiKey: import.meta.env.VITE_GROQ_API_KEY ?? "",

            modelSummary: import.meta.env.VITE_MODEL_SUMMARY ?? "llama-3.3-70b-versatile",
            modelDiarization: import.meta.env.VITE_MODEL_DIARIZATION ?? "llama-3.1-8b-instant",
            modelEmail: import.meta.env.VITE_MODEL_EMAIL ?? "llama-3.3-70b-versatile",
            modelPrioritizer: import.meta.env.VITE_MODEL_PRIORITIZER ?? "llama-3.1-8b-instant",
            modelHealth: import.meta.env.VITE_MODEL_HEALTH ?? "llama-3.1-8b-instant",

            whisperModel: import.meta.env.VITE_WHISPER_MODEL ?? "base.en",
            useOllamaFallback: false,
            ollamaModel: "llama3.1:8b",

            notionApiKey: "",
            slackBotToken: "",
            slackChannelId: "",

            encryptionEnabled: false,
            auditLogsEnabled: true,

            // Setters
            setGroqApiKey: (key) => set({ groqApiKey: key }),
            setModel: (p, m) => set({ [p]: m }),
            setWhisperModel: (model) => set({ whisperModel: model }),
            setOllamaFallback: (enabled) => set({ useOllamaFallback: enabled }),
            setOllamaModel: (model) => set({ ollamaModel: model }),
            setNotionApiKey: (key) => set({ notionApiKey: key }),
            setSlackBotToken: (token) => set({ slackBotToken: token }),
            setSlackChannelId: (id) => set({ slackChannelId: id }),
            setEncryption: (enabled) => set({ encryptionEnabled: enabled }),
            setAuditLogs: (enabled) => set({ auditLogsEnabled: enabled }),

            isConfigured: () => !!get().groqApiKey.trim(),
        }),
        { name: "dd-user-config-v1" }
    )
);
