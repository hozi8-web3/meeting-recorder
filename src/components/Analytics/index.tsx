/**
 * DEVORA DEVS — Analytics View
 * http://devoradevs.xyz/
 */

import { useMeetingStore } from "../../stores/meetingStore";
import { BarChart3, TrendingUp, Users, CheckSquare } from "lucide-react";

function HealthBar({ score, grade }: { score: number; grade: string }) {
    const color =
        score >= 80 ? "#68d391" : score >= 60 ? "#63c4d2" : score >= 40 ? "#f5c842" : "#f56565";
    return (
        <div className="w-full">
            <div
                className="h-2 rounded-full"
                style={{ background: "rgba(255,255,255,0.06)", overflow: "hidden" }}
            >
                <div
                    className="h-full rounded-full transition-all"
                    style={{
                        width: `${score}%`,
                        background: color,
                        boxShadow: `0 0 8px ${color}60`,
                    }}
                />
            </div>
            <div className="flex items-center justify-between mt-1">
                <span className="text-xs text-slate-600">{score}/100</span>
                <span className="text-xs font-bold" style={{ color }}>
                    {grade}
                </span>
            </div>
        </div>
    );
}

export function Analytics() {
    const { meetings, actionItems } = useMeetingStore();

    const totalMinutes = Math.round(
        meetings.reduce((s, m) => s + m.duration_ms / 60000, 0)
    );
    const doneCount = actionItems.filter((a) => a.status === "done").length;
    const completionRate =
        actionItems.length > 0
            ? Math.round((doneCount / actionItems.length) * 100)
            : 0;

    const sentimentCounts = meetings.reduce<Record<string, number>>((acc, m) => {
        acc[m.sentiment] = (acc[m.sentiment] ?? 0) + 1;
        return acc;
    }, {});

    const ownerMap = actionItems.reduce<Record<string, number>>((acc, a) => {
        if (a.owner && a.owner !== "Unassigned") {
            acc[a.owner] = (acc[a.owner] ?? 0) + 1;
        }
        return acc;
    }, {});

    const topOwners = Object.entries(ownerMap)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);

    const sentimentColor: Record<string, string> = {
        positive: "#68d391",
        neutral: "#63c4d2",
        tense: "#f6ad55",
        unproductive: "#f56565",
        unclear: "#9f7aea",
    };

    return (
        <div className="h-full overflow-auto" style={{ padding: 32 }}>
            <h1 className="text-2xl font-bold text-white mb-8">Analytics</h1>

            {meetings.length === 0 ? (
                <div className="card flex flex-col items-center justify-center text-center" style={{ padding: 64 }}>
                    <BarChart3 size={40} style={{ color: "#1e3a4f", marginBottom: 16 }} />
                    <h3 className="text-white font-semibold mb-2">No data yet</h3>
                    <p className="text-slate-500 text-sm">Record your first meeting to see analytics.</p>
                </div>
            ) : (
                <div className="grid grid-cols-2 gap-6">
                    {/* Summary stats */}
                    <div className="card">
                        <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">Overview</h2>
                        <div className="grid grid-cols-2 gap-4">
                            {[
                                { label: "Meetings", value: meetings.length, icon: <BarChart3 size={16} />, color: "#63c4d2" },
                                { label: "Hours Recorded", value: `${(totalMinutes / 60).toFixed(1)}h`, icon: <TrendingUp size={16} />, color: "#f5c842" },
                                { label: "Action Items", value: actionItems.length, icon: <CheckSquare size={16} />, color: "#68d391" },
                                { label: "Completion Rate", value: `${completionRate}%`, icon: <Users size={16} />, color: "#9f7aea" },
                            ].map((s) => (
                                <div key={s.label} className="card" style={{ padding: 16 }}>
                                    <div className="flex items-center gap-2 mb-2" style={{ color: s.color }}>
                                        {s.icon}
                                        <span className="text-xs text-slate-500">{s.label}</span>
                                    </div>
                                    <div className="text-2xl font-black" style={{ color: s.color }}>{s.value}</div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Meeting Health History */}
                    <div className="card">
                        <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">Health Scores</h2>
                        <div className="flex flex-col gap-3">
                            {meetings.slice(0, 6).map((m) => (
                                <div key={m.id}>
                                    <p className="text-xs text-slate-400 truncate mb-1">{m.title}</p>
                                    <HealthBar score={m.effectiveness_score * 10} grade={
                                        m.effectiveness_score >= 8 ? "A" : m.effectiveness_score >= 6 ? "B" : m.effectiveness_score >= 4 ? "C" : "D"
                                    } />
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Sentiment breakdown */}
                    <div className="card">
                        <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">Sentiment Breakdown</h2>
                        <div className="flex flex-col gap-2">
                            {Object.entries(sentimentCounts).map(([sentiment, count]) => (
                                <div key={sentiment} className="flex items-center gap-3">
                                    <div className="w-2 h-2 rounded-full" style={{ background: sentimentColor[sentiment] }} />
                                    <span className="text-sm text-slate-300 capitalize flex-1">{sentiment}</span>
                                    <div className="flex-1 h-1.5 rounded-full" style={{ background: "rgba(255,255,255,0.06)" }}>
                                        <div
                                            className="h-full rounded-full"
                                            style={{
                                                width: `${(count / meetings.length) * 100}%`,
                                                background: sentimentColor[sentiment],
                                            }}
                                        />
                                    </div>
                                    <span className="text-xs text-slate-500 w-6 text-right">{count}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Top action owners */}
                    <div className="card">
                        <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">Top Action Owners</h2>
                        {topOwners.length === 0 ? (
                            <p className="text-slate-600 text-sm">No assigned items yet.</p>
                        ) : (
                            <div className="flex flex-col gap-3">
                                {topOwners.map(([owner, count], i) => (
                                    <div key={owner} className="flex items-center gap-3">
                                        <div
                                            className="rounded-full flex items-center justify-center text-xs font-black flex-shrink-0"
                                            style={{
                                                width: 28,
                                                height: 28,
                                                background: `hsl(${i * 60}, 60%, 20%)`,
                                                color: `hsl(${i * 60}, 80%, 70%)`,
                                            }}
                                        >
                                            {owner.charAt(0).toUpperCase()}
                                        </div>
                                        <span className="text-sm text-slate-300 flex-1 truncate">{owner}</span>
                                        <span className="badge badge-medium">{count}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
