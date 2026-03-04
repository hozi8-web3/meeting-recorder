/**
 * DEVORA DEVS — Meeting Recorder Enterprise Edition
 * http://devoradevs.xyz/
 *
 * Typed configuration loader from VITE_* env vars.
 * All configurable values live here — never hardcode elsewhere.
 */


function optional(key: string, fallback = ""): string {
    return import.meta.env[key] ?? fallback;
}

function bool(key: string, fallback = false): boolean {
    const val = import.meta.env[key];
    if (val === undefined) return fallback;
    return val === "true" || val === "1";
}

export const config = {
    app: {
        version: optional("VITE_APP_VERSION", "1.0.0-enterprise"),
        enableAnalytics: bool("VITE_ENABLE_ANALYTICS", false),
    },

    groq: {
        apiKey: optional("VITE_GROQ_API_KEY"),
        baseUrl: optional("VITE_GROQ_BASE_URL", "https://api.groq.com/openai/v1"),
    },

    models: {
        summary: optional("VITE_MODEL_SUMMARY", "llama-3.3-70b-versatile"),
        diarization: optional("VITE_MODEL_DIARIZATION", "llama-3.1-8b-instant"),
        email: optional("VITE_MODEL_EMAIL", "llama-3.3-70b-versatile"),
        prioritizer: optional("VITE_MODEL_PRIORITIZER", "llama-3.1-8b-instant"),
        health: optional("VITE_MODEL_HEALTH", "llama-3.1-8b-instant"),
    },

    ollama: {
        baseUrl: optional("VITE_OLLAMA_BASE_URL", "http://localhost:11434"),
        model: optional("VITE_OLLAMA_MODEL", "llama3.1:8b"),
        useFallback: bool("VITE_USE_OLLAMA_FALLBACK", false),
    },

    whisper: {
        model: optional("VITE_WHISPER_MODEL", "base.en"),
        language: optional("VITE_WHISPER_LANGUAGE", "en"),
    },

    integrations: {
        notionApiKey: optional("VITE_NOTION_API_KEY"),
        slackBotToken: optional("VITE_SLACK_BOT_TOKEN"),
        slackChannelId: optional("VITE_SLACK_CHANNEL_ID"),
        supabaseUrl: optional("VITE_SUPABASE_URL"),
        supabaseAnonKey: optional("VITE_SUPABASE_ANON_KEY"),
    },

    enterprise: {
        e2eEncryption: bool("VITE_ENABLE_E2E_ENCRYPTION", false),
        encryptionKey: optional("VITE_ENCRYPTION_KEY"),
        auditLogs: bool("VITE_ENABLE_AUDIT_LOGS", true),
        ssoProvider: optional("VITE_SSO_PROVIDER", "none") as "none" | "saml" | "oidc",
        ssoTenantId: optional("VITE_SSO_TENANT_ID"),
        ssoClientId: optional("VITE_SSO_CLIENT_ID"),
        teamsEnabled: bool("VITE_ENABLE_TEAMS", false),
    },

    branding: {
        name: optional("VITE_BRAND_NAME", "Devora Devs"),
        url: optional("VITE_BRAND_URL", "http://devoradevs.xyz/"),
        watermarkVisible: bool("VITE_WATERMARK_VISIBLE", true),
    },
} as const;

export type Config = typeof config;
