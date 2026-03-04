/**
 * DEVORA DEVS — Premium Sidebar
 * http://devoradevs.xyz/
 */

import { Mic, LayoutDashboard, CheckSquare, Settings, BarChart3, Zap } from "lucide-react";
import { Watermark } from "./Watermark";
import { config } from "../../lib/config";

interface SidebarProps {
    active: string;
    onChange: (page: string) => void;
    recordingStatus?: "idle" | "recording" | "paused" | "processing";
}

const navItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "recorder", label: "Record", icon: Mic },
    { id: "actions", label: "Actions", icon: CheckSquare },
    { id: "analytics", label: "Analytics", icon: BarChart3 },
    { id: "settings", label: "Settings", icon: Settings },
];

export function Sidebar({ active, onChange, recordingStatus }: SidebarProps) {
    const isRecording = recordingStatus === "recording";

    return (
        <aside
            style={{
                width: 220, minWidth: 220,
                background: "rgba(4,10,20,0.96)",
                borderRight: "1px solid var(--border)",
                display: "flex", flexDirection: "column",
                justifyContent: "space-between",
                padding: "18px 12px",
                position: "relative",
                backdropFilter: "blur(20px)",
                zIndex: 10,
            }}
        >
            {/* Top purple-teal gradient line */}
            <div style={{
                position: "absolute", top: 0, left: 16, right: 16, height: 1,
                background: "linear-gradient(90deg, transparent, rgba(0,212,255,0.4), rgba(167,139,250,0.3), transparent)",
            }} />

            {/* Logo */}
            <div>
                <div style={{ padding: "6px 4px 24px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{
                            width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                            background: "linear-gradient(135deg, #00c4ee 0%, #006b8a 100%)",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            boxShadow: "0 4px 16px rgba(0,196,238,0.35)",
                            position: "relative",
                        }}>
                            {isRecording ? (
                                <div className="recording-dot" />
                            ) : (
                                <Mic size={16} color="#010d18" strokeWidth={2.5} />
                            )}
                        </div>
                        <div>
                            <div style={{
                                fontFamily: "var(--font-display)",
                                fontWeight: 800, fontSize: 14,
                                color: "var(--text-primary)", letterSpacing: "-0.02em",
                                lineHeight: 1.1,
                            }}>
                                MeetingAI
                            </div>
                            <div style={{
                                fontSize: 9, fontWeight: 700, letterSpacing: "0.12em",
                                textTransform: "uppercase", color: "var(--teal-glow)",
                            }}>
                                ENTERPRISE
                            </div>
                        </div>
                    </div>
                </div>

                {/* Nav */}
                <nav style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                    {navItems.map(({ id, label, icon: Icon }) => (
                        <button
                            key={id}
                            onClick={() => onChange(id)}
                            className={`nav-item ${active === id ? "active" : ""}`}
                            style={{ background: "none", cursor: "pointer", width: "100%", border: "1px solid transparent" }}
                        >
                            <Icon size={15} strokeWidth={active === id ? 2.2 : 1.8} />
                            <span>{label}</span>
                            {id === "recorder" && isRecording && (
                                <div className="recording-dot" style={{ marginLeft: "auto" }} />
                            )}
                        </button>
                    ))}
                </nav>

                {/* Enterprise chip */}
                <div style={{ marginTop: 20, padding: "0 4px" }}>
                    <div style={{
                        background: "linear-gradient(135deg, rgba(240,192,64,0.08), rgba(240,192,64,0.03))",
                        border: "1px solid var(--border-gold)",
                        borderRadius: 8, padding: "10px 12px",
                        display: "flex", alignItems: "center", gap: 8,
                    }}>
                        <Zap size={13} style={{ color: "var(--gold)", flexShrink: 0 }} />
                        <div>
                            <div style={{ fontSize: 10.5, fontWeight: 700, color: "var(--gold)", letterSpacing: "0.04em" }}>
                                ENTERPRISE
                            </div>
                            <div style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 1 }}>
                                v{config.app.version}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <div className="divider" />
                <Watermark variant="footer" />
            </div>
        </aside>
    );
}
