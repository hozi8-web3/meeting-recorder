/**
 * DEVORA DEVS — Settings (User-Facing)
 * http://devoradevs.xyz/
 *
 * All settings saved to localStorage via userConfigStore.
 * No .env required — users configure everything here.
 */

import { useState } from "react";
import {
    Eye, EyeOff, Download, Save, CheckCircle2,
    Key, Cpu, Mic2, Shield, Zap, ExternalLink,
} from "lucide-react";
import { useUserConfig, GROQ_MODELS } from "../../stores/userConfigStore";
import { getAuditLog, exportAuditLogCSV } from "../../lib/auditLog";

const WHISPER_MODELS = ["tiny", "base.en", "small", "medium"];

// ── Reusable sub-components ────────────────────────────────────────────────

function SectionCard({
    icon,
    title,
    subtitle,
    children,
    accent = "teal",
}: {
    icon: React.ReactNode;
    title: string;
    subtitle?: string;
    children: React.ReactNode;
    accent?: "teal" | "gold" | "purple" | "red" | "green";
}) {
    const colors = {
        teal: { bg: "rgba(0,212,255,0.08)", border: "rgba(0,212,255,0.2)", text: "#00d4ff" },
        gold: { bg: "rgba(240,192,64,0.08)", border: "rgba(240,192,64,0.2)", text: "#f0c040" },
        purple: { bg: "rgba(167,139,250,0.08)", border: "rgba(167,139,250,0.2)", text: "#a78bfa" },
        red: { bg: "rgba(255,79,79,0.08)", border: "rgba(255,79,79,0.2)", text: "#ff4f4f" },
        green: { bg: "rgba(61,220,132,0.08)", border: "rgba(61,220,132,0.2)", text: "#3ddc84" },
    }[accent];

    return (
        <div className="card-static" style={{ borderRadius: 16, padding: 0, overflow: "hidden" }}>
            {/* Header */}
            <div style={{
                padding: "18px 24px 14px",
                borderBottom: "1px solid var(--border)",
                background: "rgba(255,255,255,0.015)",
                display: "flex", alignItems: "center", gap: 12,
            }}>
                <div style={{
                    width: 34, height: 34, borderRadius: 10, flexShrink: 0,
                    background: colors.bg,
                    border: `1px solid ${colors.border}`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    color: colors.text,
                }}>
                    {icon}
                </div>
                <div>
                    <div style={{ fontWeight: 700, fontSize: 14, color: "var(--text-primary)" }}>{title}</div>
                    {subtitle && <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 1 }}>{subtitle}</div>}
                </div>
            </div>
            {/* Body */}
            <div style={{ padding: "8px 24px 20px" }}>{children}</div>
        </div>
    );
}

function SettingRow({
    label, description, children,
}: {
    label: string; description?: string; children: React.ReactNode;
}) {
    return (
        <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "12px 0",
            borderBottom: "1px solid rgba(255,255,255,0.04)",
            gap: 16,
        }}>
            <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, color: "var(--text-secondary)", fontWeight: 500 }}>{label}</div>
                {description && (
                    <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2, lineHeight: 1.5 }}>{description}</div>
                )}
            </div>
            <div style={{ flexShrink: 0 }}>{children}</div>
        </div>
    );
}

function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
    return (
        <button
            onClick={() => onChange(!value)}
            style={{
                width: 44, height: 24, borderRadius: 12, border: "none",
                background: value
                    ? "linear-gradient(135deg, #00c4ee, #0090bb)"
                    : "rgba(255,255,255,0.1)",
                position: "relative", cursor: "pointer",
                transition: "background 0.25s",
                boxShadow: value ? "0 0 12px rgba(0,196,238,0.4)" : "none",
            }}
        >
            <div style={{
                position: "absolute", top: 3, left: value ? 23 : 3,
                width: 18, height: 18, borderRadius: 9,
                background: "#fff",
                transition: "left 0.25s cubic-bezier(0.23,1,0.32,1)",
                boxShadow: "0 1px 4px rgba(0,0,0,0.3)",
            }} />
        </button>
    );
}

// ── Main Settings ──────────────────────────────────────────────────────────

export function Settings() {
    const cfg = useUserConfig();
    const [showKey, setShowKey] = useState(false);
    const [showNotion, setShowNotion] = useState(false);
    const [showSlack, setShowSlack] = useState(false);
    const [saved, setSaved] = useState(false);

    const auditCount = getAuditLog().length;

    function handleSave() {
        setSaved(true);
        setTimeout(() => setSaved(false), 2500);
    }

    function downloadAuditLog() {
        const csv = exportAuditLogCSV();
        const blob = new Blob([csv], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `audit-log-${new Date().toISOString().split("T")[0]}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    }

    const isConfigured = cfg.isConfigured();

    return (
        <div className="fade-in" style={{ height: "100%", overflowY: "auto", padding: "32px 36px" }}>

            {/* Header */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 32 }}>
                <div>
                    <h1 style={{
                        fontFamily: "var(--font-display)", fontSize: 28, fontWeight: 800,
                        color: "var(--text-primary)", letterSpacing: "-0.03em",
                    }}>Settings</h1>
                    <p style={{ color: "var(--text-muted)", fontSize: 12.5, marginTop: 4 }}>
                        All settings saved locally — your data never leaves your device.
                    </p>
                </div>
                <button
                    className={`btn ${saved ? "btn-ghost" : "btn-primary"}`}
                    style={{ borderRadius: 10 }}
                    onClick={handleSave}
                >
                    {saved ? (
                        <><CheckCircle2 size={15} style={{ color: "#3ddc84" }} /> Saved!</>
                    ) : (
                        <><Save size={15} /> Save Changes</>
                    )}
                </button>
            </div>

            {/* API Key banner if not configured */}
            {!isConfigured && (
                <div className="fade-up" style={{
                    marginBottom: 24, padding: "16px 20px",
                    background: "rgba(240,192,64,0.06)",
                    border: "1px solid rgba(240,192,64,0.25)",
                    borderRadius: 12,
                    display: "flex", alignItems: "center", gap: 14,
                }}>
                    <Key size={20} style={{ color: "#f0c040", flexShrink: 0 }} />
                    <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600, fontSize: 13, color: "#f0c040" }}>Groq API Key Required</div>
                        <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>
                            Enter your free key below to enable AI analysis. Get one at{" "}
                            <a href="https://console.groq.com" target="_blank" rel="noopener noreferrer"
                                style={{ color: "#00d4ff", textDecoration: "none" }}>
                                console.groq.com
                            </a>
                        </div>
                    </div>
                </div>
            )}

            <div style={{ maxWidth: 700, display: "flex", flexDirection: "column", gap: 20 }}>

                {/* ── Groq API ── */}
                <SectionCard icon={<Key size={16} />} title="Groq API" subtitle="Get a free key at console.groq.com" accent="teal">
                    <SettingRow label="API Key" description="Stored locally in your browser — never sent to any server except Groq.">
                        <div style={{ display: "flex", gap: 8, width: 300 }}>
                            <input
                                className="input"
                                type={showKey ? "text" : "password"}
                                value={cfg.groqApiKey}
                                onChange={e => cfg.setGroqApiKey(e.target.value)}
                                placeholder="gsk_••••••••••••••••••••••"
                                style={{ fontFamily: "var(--font-mono)", fontSize: 12.5, flex: 1 }}
                            />
                            <button className="btn-icon" onClick={() => setShowKey(!showKey)} title={showKey ? "Hide key" : "Show key"}>
                                {showKey ? <EyeOff size={14} /> : <Eye size={14} />}
                            </button>
                        </div>
                    </SettingRow>
                    <SettingRow label="Get Free Key">
                        <a href="https://console.groq.com" target="_blank" rel="noopener noreferrer"
                            className="btn btn-ghost"
                            style={{ padding: "7px 14px", fontSize: 12, textDecoration: "none" }}>
                            <ExternalLink size={12} /> console.groq.com
                        </a>
                    </SettingRow>
                </SectionCard>

                {/* ── AI Models ── */}
                <SectionCard icon={<Cpu size={16} />} title="AI Models" subtitle="Each task uses a separate model — swap freely, no restart needed" accent="purple">
                    {[
                        { key: "modelSummary" as const, label: "MR-001 — Summary & Actions", desc: "Quality-sensitive — use largest model" },
                        { key: "modelDiarization" as const, label: "MR-002 — Speaker Diarization", desc: "Speed-sensitive — fast model recommended" },
                        { key: "modelEmail" as const, label: "MR-003 — Follow-up Email", desc: "Quality-sensitive — use largest model" },
                        { key: "modelPrioritizer" as const, label: "MR-004 — Action Prioritizer", desc: "Fast model works great here" },
                        { key: "modelHealth" as const, label: "MR-005 — Health Scorer", desc: "Fast model works great here" },
                    ].map(({ key, label, desc }) => (
                        <SettingRow key={key} label={label} description={desc}>
                            <select
                                className="input"
                                style={{ width: 230, fontSize: 12.5 }}
                                value={cfg[key]}
                                onChange={e => cfg.setModel(key, e.target.value)}
                            >
                                {GROQ_MODELS.map(m => <option key={m} value={m}>{m}</option>)}
                            </select>
                        </SettingRow>
                    ))}
                </SectionCard>

                {/* ── Whisper ── */}
                <SectionCard icon={<Mic2 size={16} />} title="Whisper Transcription" subtitle="100% local — audio never leaves your device" accent="green">
                    <SettingRow label="Whisper Model" description="Larger = better accuracy, slower. 'base.en' is the best balance for English.">
                        <select
                            className="input"
                            style={{ width: 200 }}
                            value={cfg.whisperModel}
                            onChange={e => cfg.setWhisperModel(e.target.value)}
                        >
                            {WHISPER_MODELS.map(m => (
                                <option key={m} value={m}>{m}{m === "base.en" ? " (recommended)" : ""}</option>
                            ))}
                        </select>
                    </SettingRow>
                    <SettingRow label="Ollama Fallback" description="Use local Ollama models if Groq is unavailable">
                        <Toggle value={cfg.useOllamaFallback} onChange={cfg.setOllamaFallback} />
                    </SettingRow>
                    {cfg.useOllamaFallback && (
                        <SettingRow label="Ollama Model" description="Must be running locally at localhost:11434">
                            <input
                                className="input"
                                style={{ width: 200 }}
                                value={cfg.ollamaModel}
                                onChange={e => cfg.setOllamaModel(e.target.value)}
                                placeholder="llama3.1:8b"
                            />
                        </SettingRow>
                    )}
                </SectionCard>

                {/* ── Exports ── */}
                <SectionCard icon={<Zap size={16} />} title="Export Integrations" subtitle="Optional — connect Notion and Slack for one-click export" accent="gold">
                    <SettingRow label="Notion API Key" description="Create an integration at notion.so/my-integrations">
                        <div style={{ display: "flex", gap: 8, width: 290 }}>
                            <input
                                className="input"
                                type={showNotion ? "text" : "password"}
                                value={cfg.notionApiKey}
                                onChange={e => cfg.setNotionApiKey(e.target.value)}
                                placeholder="secret_••••"
                                style={{ fontFamily: "var(--font-mono)", fontSize: 12, flex: 1 }}
                            />
                            <button className="btn-icon" onClick={() => setShowNotion(!showNotion)}>
                                {showNotion ? <EyeOff size={14} /> : <Eye size={14} />}
                            </button>
                        </div>
                    </SettingRow>
                    <SettingRow label="Slack Bot Token" description="Add to workspace at api.slack.com/apps">
                        <div style={{ display: "flex", gap: 8, width: 290 }}>
                            <input
                                className="input"
                                type={showSlack ? "text" : "password"}
                                value={cfg.slackBotToken}
                                onChange={e => cfg.setSlackBotToken(e.target.value)}
                                placeholder="xoxb-••••"
                                style={{ fontFamily: "var(--font-mono)", fontSize: 12, flex: 1 }}
                            />
                            <button className="btn-icon" onClick={() => setShowSlack(!showSlack)}>
                                {showSlack ? <EyeOff size={14} /> : <Eye size={14} />}
                            </button>
                        </div>
                    </SettingRow>
                    <SettingRow label="Slack Channel ID" description="e.g. C01AB2CD3EF">
                        <input
                            className="input"
                            style={{ width: 160 }}
                            value={cfg.slackChannelId}
                            onChange={e => cfg.setSlackChannelId(e.target.value)}
                            placeholder="C01AB2CD3EF"
                        />
                    </SettingRow>
                </SectionCard>

                {/* ── Enterprise Security ── */}
                <SectionCard icon={<Shield size={16} />} title="Enterprise Security" accent="red"
                    subtitle="Compliance features for enterprise deployments">
                    <SettingRow label="AES-256 Encryption" description="Encrypt audio files and transcripts at rest">
                        <Toggle value={cfg.encryptionEnabled} onChange={cfg.setEncryption} />
                    </SettingRow>
                    <SettingRow label="Audit Logs" description={`${auditCount} entries — append-only compliance trail (SOC2/GDPR)`}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            <Toggle value={cfg.auditLogsEnabled} onChange={cfg.setAuditLogs} />
                            <button
                                className="btn btn-ghost"
                                style={{ padding: "6px 12px", fontSize: 12 }}
                                onClick={downloadAuditLog}
                            >
                                <Download size={12} /> Export CSV
                            </button>
                        </div>
                    </SettingRow>
                </SectionCard>

                {/* Footer */}
                <div style={{ textAlign: "center", fontSize: 11, color: "var(--text-muted)", paddingBottom: 8, lineHeight: 1.7 }}>
                    MeetingAI Enterprise · Built by{" "}
                    <a href="http://devoradevs.xyz/" target="_blank" rel="noopener noreferrer"
                        style={{ color: "#00d4ff", textDecoration: "none" }}>
                        Devora Devs
                    </a>
                    {" "}· All settings are stored locally in your browser.
                </div>
            </div>
        </div>
    );
}
