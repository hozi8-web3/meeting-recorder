/**
 * DEVORA DEVS — Premium Dashboard (Bento Grid)
 * http://devoradevs.xyz/
 */

import { Mic, CheckSquare, TrendingUp, Clock, Plus, ArrowRight, Sparkles } from "lucide-react";
import { useMeetingStore } from "../../stores/meetingStore";
import { format, formatDistanceToNow } from "date-fns";

interface DashboardProps { onNavigate: (page: string) => void; }

const sentimentGlow: Record<string, string> = {
    positive: "rgba(61,220,132,0.15)",
    neutral: "rgba(0,212,255,0.15)",
    tense: "rgba(251,146,60,0.15)",
    unproductive: "rgba(255,79,79,0.15)",
    unclear: "rgba(167,139,250,0.15)",
};
const sentimentColor: Record<string, string> = {
    positive: "#3ddc84",
    neutral: "#00d4ff",
    tense: "#fb923c",
    unproductive: "#ff4f4f",
    unclear: "#a78bfa",
};

function ScoreRing({ score }: { score: number }) {
    const r = 20, circ = 2 * Math.PI * r;
    const fill = (score / 10) * circ;
    const color = score >= 8 ? "#3ddc84" : score >= 6 ? "#00d4ff" : score >= 4 ? "#f0c040" : "#ff4f4f";
    return (
        <div style={{ position: "relative", width: 50, height: 50 }}>
            <svg width="50" height="50" viewBox="0 0 50 50">
                <circle cx="25" cy="25" r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="3.5" />
                <circle cx="25" cy="25" r={r} fill="none" stroke={color} strokeWidth="3.5"
                    strokeDasharray={`${fill} ${circ}`} strokeLinecap="round"
                    transform="rotate(-90 25 25)"
                    style={{ filter: `drop-shadow(0 0 4px ${color})` }}
                />
            </svg>
            <span style={{
                position: "absolute", inset: 0,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 12, fontWeight: 800, color,
            }}>{score}</span>
        </div>
    );
}

function StatCard({ label, value, icon, color, glowColor, delay = 0 }: {
    label: string; value: string | number; icon: React.ReactNode;
    color: string; glowColor: string; delay?: number;
}) {
    return (
        <div
            className="stat-card stat-card-glow fade-up"
            style={{ "--glow-color": glowColor, animationDelay: `${delay}ms` } as React.CSSProperties}
        >
            {/* Background orb */}
            <div style={{
                position: "absolute", top: -30, right: -20,
                width: 100, height: 100, borderRadius: "50%",
                background: `radial-gradient(circle, ${glowColor} 0%, transparent 70%)`,
                pointerEvents: "none",
            }} />
            <div style={{ position: "relative" }}>
                <div style={{
                    display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14
                }}>
                    <span style={{
                        fontSize: 10, fontWeight: 700, letterSpacing: "0.08em",
                        textTransform: "uppercase", color: "var(--text-muted)"
                    }}>
                        {label}
                    </span>
                    <div style={{
                        width: 30, height: 30, borderRadius: 8,
                        background: `${glowColor}`,
                        border: `1px solid ${color}30`,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        color,
                    }}>{icon}</div>
                </div>
                <div style={{
                    fontSize: 36, fontWeight: 900, color,
                    fontFamily: "var(--font-display)",
                    letterSpacing: "-0.03em", lineHeight: 1,
                }}>{value}</div>
            </div>
        </div>
    );
}

export function Dashboard({ onNavigate }: DashboardProps) {
    const { meetings, actionItems } = useMeetingStore();

    const totalMeetings = meetings.length;
    const openActions = actionItems.filter(a => a.status === "open").length;
    const criticalCount = actionItems.filter(a => a.priority === "critical" && a.status === "open").length;
    const avgScore = meetings.length
        ? +(meetings.reduce((s, m) => s + m.effectiveness_score, 0) / meetings.length).toFixed(1)
        : 0;

    return (
        <div className="fade-in" style={{ height: "100%", overflowY: "auto", padding: "32px 36px" }}>

            {/* Header */}
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 36 }}>
                <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                        <Sparkles size={16} style={{ color: "var(--gold)" }} />
                        <span style={{
                            fontSize: 11, fontWeight: 600, color: "var(--gold)",
                            letterSpacing: "0.1em", textTransform: "uppercase"
                        }}>
                            Intelligence Dashboard
                        </span>
                    </div>
                    <h1 style={{
                        fontFamily: "var(--font-display)", fontSize: 30, fontWeight: 800,
                        color: "var(--text-primary)", letterSpacing: "-0.03em", lineHeight: 1.1,
                    }}>
                        Good evening
                    </h1>
                    <p style={{ color: "var(--text-muted)", fontSize: 13, marginTop: 4 }}>
                        {format(new Date(), "EEEE, MMMM d, yyyy")}
                    </p>
                </div>
                <button className="btn btn-primary" onClick={() => onNavigate("recorder")}
                    style={{ borderRadius: 10, padding: "11px 22px" }}>
                    <Mic size={15} /> New Recording
                </button>
            </div>

            {/* Bento stats grid */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 32 }}>
                <StatCard label="Total Meetings" value={totalMeetings}
                    icon={<Mic size={14} />} color="#00d4ff" glowColor="rgba(0,212,255,0.12)" delay={0} />
                <StatCard label="Open Actions" value={openActions}
                    icon={<CheckSquare size={14} />} color="#f0c040" glowColor="rgba(240,192,64,0.12)" delay={60} />
                <StatCard label="Critical Items" value={criticalCount}
                    icon={<TrendingUp size={14} />} color="#ff4f4f" glowColor="rgba(255,79,79,0.12)" delay={120} />
                <StatCard label="Avg Score" value={avgScore ? `${avgScore}/10` : "—"}
                    icon={<Clock size={14} />} color="#3ddc84" glowColor="rgba(61,220,132,0.12)" delay={180} />
            </div>

            {/* Recent Meetings */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                <h2 style={{
                    fontSize: 11, fontWeight: 700, letterSpacing: "0.08em",
                    textTransform: "uppercase", color: "var(--text-muted)"
                }}>
                    Recent Meetings
                </h2>
                {meetings.length > 0 && (
                    <button className="btn-ghost btn" style={{ padding: "5px 12px", fontSize: 12 }}
                        onClick={() => onNavigate("analytics")}>
                        View All <ArrowRight size={12} />
                    </button>
                )}
            </div>

            {meetings.length === 0 ? (
                /* Empty state */
                <div className="card fade-up" style={{
                    padding: 64, display: "flex", flexDirection: "column",
                    alignItems: "center", textAlign: "center",
                    borderStyle: "dashed", borderColor: "rgba(0,212,255,0.12)",
                    background: "linear-gradient(135deg, rgba(0,212,255,0.02), transparent)",
                }}>
                    <div className="float-anim" style={{
                        width: 72, height: 72, borderRadius: 20, marginBottom: 20,
                        background: "linear-gradient(135deg, rgba(0,212,255,0.12), rgba(0,212,255,0.04))",
                        border: "1px solid rgba(0,212,255,0.2)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        boxShadow: "0 0 40px rgba(0,212,255,0.1)",
                    }}>
                        <Mic size={30} style={{ color: "var(--teal-glow)" }} />
                    </div>
                    <h3 style={{
                        fontFamily: "var(--font-display)", fontSize: 20, fontWeight: 700,
                        color: "var(--text-primary)", marginBottom: 8
                    }}>
                        No recordings yet
                    </h3>
                    <p style={{ color: "var(--text-muted)", fontSize: 13, maxWidth: 360, lineHeight: 1.7, marginBottom: 28 }}>
                        Start your first AI-powered recording to automatically capture decisions,{" "}
                        extract action items, and track accountability.
                    </p>
                    <button className="btn btn-primary" onClick={() => onNavigate("recorder")}
                        style={{ borderRadius: 10, padding: "12px 28px", fontSize: 14 }}>
                        <Plus size={15} /> Start Recording
                    </button>
                </div>
            ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {meetings.slice(0, 6).map((meeting, i) => {
                        const items = actionItems.filter(a => a.meeting_id === meeting.id);
                        const open = items.filter(a => a.status === "open").length;
                        return (
                            <div
                                key={meeting.id}
                                className="card fade-up"
                                style={{
                                    padding: "16px 20px", display: "flex",
                                    alignItems: "center", gap: 16, cursor: "pointer",
                                    animationDelay: `${i * 50}ms`,
                                }}
                                onClick={() => onNavigate("actions")}
                            >
                                {/* Sentiment indicator */}
                                <div style={{
                                    width: 42, height: 42, borderRadius: 12, flexShrink: 0,
                                    background: sentimentGlow[meeting.sentiment] ?? "rgba(0,212,255,0.08)",
                                    border: `1px solid ${sentimentColor[meeting.sentiment] ?? "#00d4ff"}25`,
                                    display: "flex", alignItems: "center", justifyContent: "center",
                                }}>
                                    <Mic size={17} style={{ color: sentimentColor[meeting.sentiment] ?? "#00d4ff" }} />
                                </div>

                                {/* Info */}
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{
                                        fontSize: 14, fontWeight: 600, color: "var(--text-primary)",
                                        whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis"
                                    }}>
                                        {meeting.title}
                                    </div>
                                    <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>
                                        {formatDistanceToNow(new Date(meeting.date), { addSuffix: true })} ·{" "}
                                        {Math.round(meeting.duration_ms / 60000)} min ·{" "}
                                        {meeting.attendees.length} attendees
                                    </div>
                                </div>

                                {/* Right side */}
                                <div style={{ display: "flex", alignItems: "center", gap: 14, flexShrink: 0 }}>
                                    {open > 0 && (
                                        <div style={{ textAlign: "center" }}>
                                            <div style={{ fontSize: 18, fontWeight: 800, color: "#f0c040", lineHeight: 1 }}>{open}</div>
                                            <div style={{ fontSize: 9, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>open</div>
                                        </div>
                                    )}
                                    <ScoreRing score={meeting.effectiveness_score} />
                                    <span className="badge"
                                        style={{
                                            background: `${sentimentColor[meeting.sentiment]}15`,
                                            color: sentimentColor[meeting.sentiment],
                                            borderColor: `${sentimentColor[meeting.sentiment]}30`,
                                        }}>
                                        {meeting.sentiment}
                                    </span>
                                    <ArrowRight size={14} style={{ color: "var(--text-muted)" }} />
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
