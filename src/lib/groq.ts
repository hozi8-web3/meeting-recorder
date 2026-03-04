/**
 * DEVORA DEVS — Groq API Client
 * http://devoradevs.xyz/
 *
 * Reads API key + model settings from userConfigStore at call-time.
 * Users configure everything from the Settings UI.
 */

import { useUserConfig } from "../stores/userConfigStore";

const GROQ_BASE = "https://api.groq.com/openai/v1";
const OLLAMA_BASE = "http://localhost:11434";

function getApiKey(): string {
    return useUserConfig.getState().groqApiKey;
}

function useOllama(): boolean {
    return useUserConfig.getState().useOllamaFallback;
}

function ollamaModel(): string {
    return useUserConfig.getState().ollamaModel;
}

export interface ChatMessage {
    role: "system" | "user" | "assistant";
    content: string;
}

export interface GroqChatOptions {
    model: string;
    messages: ChatMessage[];
    temperature?: number;
    maxTokens?: number;
    jsonMode?: boolean;
}

export interface GroqResponse {
    content: string;
    model: string;
    usage: {
        prompt_tokens: number;
        completion_tokens: number;
        total_tokens: number;
    };
}

class GroqAPIError extends Error {
    constructor(
        message: string,
        public status?: number,
        public code?: string
    ) {
        super(message);
        this.name = "GroqAPIError";
    }
}

async function callGroq(options: GroqChatOptions, retries = 2): Promise<GroqResponse> {
    const { model, messages, temperature = 0.1, maxTokens = 4096, jsonMode = true } = options;

    const body: Record<string, unknown> = {
        model,
        messages,
        temperature,
        max_tokens: maxTokens,
    };

    if (jsonMode) {
        body.response_format = { type: "json_object" };
    }

    const response = await fetch(`${GROQ_BASE}/chat/completions`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${getApiKey()}`,
        },
        body: JSON.stringify(body),
    });

    if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        const message = (err as { error?: { message?: string } })?.error?.message ?? response.statusText;
        if (retries > 0 && response.status >= 500) {
            await new Promise((r) => setTimeout(r, 1000));
            return callGroq(options, retries - 1);
        }
        throw new GroqAPIError(`Groq API error: ${message}`, response.status);
    }

    const data = await response.json() as {
        choices: { message: { content: string } }[];
        model: string;
        usage: { prompt_tokens: number; completion_tokens: number; total_tokens: number };
    };

    return {
        content: data.choices[0].message.content,
        model: data.model,
        usage: data.usage,
    };
}

async function callOllama(options: GroqChatOptions): Promise<GroqResponse> {
    const { model, messages, temperature = 0.1 } = options;

    const response = await fetch(`${OLLAMA_BASE}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            model: model || ollamaModel(),
            messages,
            options: { temperature },
            format: "json",
            stream: false,
        }),
    });

    if (!response.ok) {
        throw new GroqAPIError(`Ollama error: ${response.statusText}`, response.status);
    }

    const data = await response.json() as { message: { content: string }; model: string };

    return {
        content: data.message.content,
        model: data.model,
        usage: { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 },
    };
}

/**
 * Main chat function. Uses Groq by default, falls back to Ollama if configured.
 */
export async function groqChat(options: GroqChatOptions): Promise<GroqResponse> {
    const key = getApiKey();
    if (!key) {
        throw new GroqAPIError(
            "No Groq API key configured. Go to Settings and enter your key from console.groq.com"
        );
    }
    if (useOllama()) {
        return callOllama(options);
    }
    return callGroq(options);
}

/**
 * Convenience: chat with system + user messages, parse JSON response.
 */
export async function groqJSON<T>(
    model: string,
    systemPrompt: string,
    userMessage: string,
    retries = 2
): Promise<T> {
    let lastError: Error | undefined;

    for (let i = 0; i <= retries; i++) {
        try {
            const res = await groqChat({
                model,
                messages: [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: userMessage },
                ],
                jsonMode: true,
                temperature: 0.1,
            });

            return JSON.parse(res.content) as T;
        } catch (err) {
            lastError = err as Error;
            if (i < retries) {
                await new Promise((r) => setTimeout(r, 500 * (i + 1)));
            }
        }
    }

    throw new GroqAPIError(
        `Failed after ${retries + 1} attempts: ${lastError?.message}`
    );
}

export { GroqAPIError };
