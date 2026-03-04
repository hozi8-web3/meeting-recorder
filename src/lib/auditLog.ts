/**
 * DEVORA DEVS — Audit Log (Enterprise)
 * http://devoradevs.xyz/
 *
 * Append-only audit trail for SOC2/GDPR compliance.
 */

import { config } from "./config";
import type { AuditLogEntry } from "./types";

const LOG_KEY = "dd_audit_log";

function readLog(): AuditLogEntry[] {
    try {
        const raw = localStorage.getItem(LOG_KEY);
        return raw ? (JSON.parse(raw) as AuditLogEntry[]) : [];
    } catch {
        return [];
    }
}

function writeLog(entries: AuditLogEntry[]) {
    localStorage.setItem(LOG_KEY, JSON.stringify(entries));
}

export function auditLog(
    action: string,
    entityType: string,
    entityId: string,
    metadata: Record<string, unknown> = {}
) {
    if (!config.enterprise.auditLogs) return;

    const entry: AuditLogEntry = {
        id: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
        action,
        entity_type: entityType,
        entity_id: entityId,
        user: "local",
        metadata,
    };

    const entries = readLog();
    entries.push(entry);
    writeLog(entries);
}

export function getAuditLog(): AuditLogEntry[] {
    return readLog();
}

export function exportAuditLogCSV(): string {
    const entries = readLog();
    const header = "id,timestamp,action,entity_type,entity_id,user\n";
    const rows = entries
        .map(
            (e) =>
                `"${e.id}","${e.timestamp}","${e.action}","${e.entity_type}","${e.entity_id}","${e.user}"`
        )
        .join("\n");
    return header + rows;
}

export function clearAuditLog() {
    localStorage.removeItem(LOG_KEY);
}
