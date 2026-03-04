/**
 * DEVORA DEVS — Action Board (Kanban)
 * http://devoradevs.xyz/
 */

import { CheckSquare, Clock, AlertTriangle, XCircle } from "lucide-react";
import { useMeetingStore } from "../../stores/meetingStore";
import type { ActionItem } from "../../lib/types";

const columns: { id: ActionItem["status"]; label: string; icon: React.ReactNode; color: string }[] = [
    { id: "open", label: "Open", icon: <Clock size={14} />, color: "#63c4d2" },
    { id: "in_progress", label: "In Progress", icon: <AlertTriangle size={14} />, color: "#f5c842" },
    { id: "done", label: "Done", icon: <CheckSquare size={14} />, color: "#68d391" },
    { id: "cancelled", label: "Cancelled", icon: <XCircle size={14} />, color: "#94a3b8" },
];

const priorityBadge: Record<string, string> = {
    critical: "badge-critical",
    high: "badge-high",
    medium: "badge-medium",
    low: "badge-low",
};

function ActionCard({ item, onStatusChange }: { item: ActionItem; onStatusChange: (id: string, s: ActionItem["status"]) => void }) {
    const isOverdue = item.due_date && new Date(item.due_date) < new Date() && item.status !== "done";

    return (
        <div
            className="card"
            style={{ padding: "14px 16px", cursor: "grab", userSelect: "none" }}
        >
            <div className="flex items-start justify-between gap-2 mb-2">
                <p className="text-sm text-white leading-snug font-medium">{item.task}</p>
                <span className={`badge ${priorityBadge[item.priority]} flex-shrink-0`}>
                    {item.priority}
                </span>
            </div>

            <div className="flex items-center gap-2 mt-2 flex-wrap">
                <span className="text-xs text-slate-500">{item.owner}</span>
                {item.due_date && (
                    <span
                        className="text-xs px-2 py-0.5 rounded"
                        style={{
                            background: isOverdue ? "rgba(245,101,101,0.1)" : "rgba(255,255,255,0.05)",
                            color: isOverdue ? "#f56565" : "#64748b",
                        }}
                    >
                        {isOverdue ? "⚠ " : ""}
                        {item.due_date}
                    </span>
                )}
            </div>

            {/* Quick status move */}
            <div className="flex gap-1 mt-3">
                {columns
                    .filter((c) => c.id !== item.status)
                    .map((c) => (
                        <button
                            key={c.id}
                            className="text-[10px] px-2 py-0.5 rounded transition-colors"
                            style={{
                                background: `${c.color}15`,
                                color: c.color,
                                border: `1px solid ${c.color}30`,
                            }}
                            onClick={() => onStatusChange(item.id, c.id)}
                        >
                            → {c.label}
                        </button>
                    ))}
            </div>
        </div>
    );
}

export function ActionBoard() {
    const { actionItems, updateActionItem } = useMeetingStore();

    function handleStatusChange(id: string, status: ActionItem["status"]) {
        updateActionItem(id, { status });
    }

    return (
        <div className="flex flex-col h-full" style={{ padding: 32 }}>
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-bold text-white">Action Board</h1>
                <span className="badge badge-medium">{actionItems.filter((a) => a.status === "open").length} Open</span>
            </div>

            <div className="flex gap-4 flex-1 overflow-hidden">
                {columns.map((col) => {
                    const items = actionItems.filter((a) => a.status === col.id);
                    return (
                        <div
                            key={col.id}
                            className="flex-1 flex flex-col overflow-hidden"
                            style={{ minWidth: 0 }}
                        >
                            {/* Column header */}
                            <div
                                className="flex items-center justify-between mb-3 px-1"
                                style={{ color: col.color }}
                            >
                                <div className="flex items-center gap-2 text-sm font-semibold">
                                    {col.icon}
                                    {col.label}
                                </div>
                                <span
                                    className="text-xs font-bold rounded-full px-2 py-0.5"
                                    style={{ background: `${col.color}18`, color: col.color }}
                                >
                                    {items.length}
                                </span>
                            </div>

                            {/* Cards */}
                            <div
                                className="flex-1 overflow-auto flex flex-col gap-2"
                                style={{
                                    background: "rgba(255,255,255,0.02)",
                                    borderRadius: 10,
                                    border: "1px solid var(--color-border)",
                                    padding: 10,
                                    minHeight: 200,
                                }}
                            >
                                {items.length === 0 ? (
                                    <div
                                        className="flex-1 flex items-center justify-center text-xs text-slate-600"
                                        style={{ padding: 20 }}
                                    >
                                        No items
                                    </div>
                                ) : (
                                    items.map((item) => (
                                        <ActionCard key={item.id} item={item} onStatusChange={handleStatusChange} />
                                    ))
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
