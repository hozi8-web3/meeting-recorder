/**
 * DEVORA DEVS — Export Module
 * http://devoradevs.xyz/
 */

import type { Meeting, ActionItem, Decision, MeetingAnalysis } from "./types";
import { auditLog } from "./auditLog";
import { config } from "./config";

const WATERMARK = config.branding.watermarkVisible
    ? `\n\n---\n*Made by [${config.branding.name}](${config.branding.url}) · Enterprise Meeting Recorder*`
    : "";

// ─── Markdown Export ──────────────────────────────────────────────────────────

export function exportMarkdown(
    meeting: Meeting,
    analysis: MeetingAnalysis,
    actionItems: ActionItem[],
    decisions: Decision[]
): string {
    const priorityEmoji: Record<string, string> = {
        critical: "🔴",
        high: "🟠",
        medium: "🟡",
        low: "⚪",
    };

    const lines: string[] = [
        `# ${analysis.title}`,
        ``,
        `**Date:** ${new Date(meeting.date).toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}  `,
        `**Duration:** ${analysis.duration_minutes} minutes  `,
        `**Attendees:** ${analysis.attendees.join(", ")}  `,
        `**Health Score:** ${analysis.effectiveness_score}/10 (Sentiment: ${analysis.sentiment})`,
        ``,
        `## Executive Summary`,
        ``,
        analysis.executive_summary,
        ``,
        `## Key Decisions`,
        ``,
        ...decisions.map((d) => `- **${d.decision}** *(${d.decided_by})*`),
        ``,
        `## Action Items`,
        ``,
        `| Priority | Task | Owner | Due Date |`,
        `|---|---|---|---|`,
        ...actionItems
            .sort((a, b) => {
                const order = { critical: 0, high: 1, medium: 2, low: 3 };
                return order[a.priority] - order[b.priority];
            })
            .map(
                (a) =>
                    `| ${priorityEmoji[a.priority]} ${a.priority} | ${a.task} | ${a.owner} | ${a.due_date ?? "—"} |`
            ),
        ``,
        `## Open Questions`,
        ``,
        ...analysis.open_questions.map(
            (q) => `- ❓ **${q.question}** *(${q.follow_up_owner ?? "Unassigned"})*`
        ),
        WATERMARK,
    ];

    const md = lines.join("\n");
    auditLog("export", "meeting", meeting.id, { format: "markdown" });
    return md;
}

export function downloadMarkdown(filename: string, content: string) {
    const blob = new Blob([content], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
}

// ─── Email Composer ───────────────────────────────────────────────────────────

export function openEmailMailto(subject: string, body: string, to: string[] = []) {
    const mailto = `mailto:${to.join(",")}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.open(mailto, "_blank");
    auditLog("export", "email", "compose", { subject });
}

// ─── Clipboard ───────────────────────────────────────────────────────────────

export async function copyActionItemsAsText(items: ActionItem[]): Promise<void> {
    const text = items
        .map((a) => `☐ [${a.priority.toUpperCase()}] ${a.task} — ${a.owner}${a.due_date ? ` (due ${a.due_date})` : ""}`)
        .join("\n");
    await navigator.clipboard.writeText(text);
}

// ─── Notion Export (stub — requires VITE_NOTION_API_KEY) ─────────────────────

export async function exportToNotion(
    analysis: MeetingAnalysis,
    actionItems: ActionItem[]
): Promise<void> {
    if (!config.integrations.notionApiKey) {
        throw new Error("VITE_NOTION_API_KEY not set. Add it to your .env file.");
    }

    const blocks = [
        {
            object: "block",
            type: "heading_1",
            heading_1: { rich_text: [{ text: { content: analysis.title } }] },
        },
        {
            object: "block",
            type: "paragraph",
            paragraph: { rich_text: [{ text: { content: analysis.executive_summary } }] },
        },
        {
            object: "block",
            type: "heading_2",
            heading_2: { rich_text: [{ text: { content: "Action Items" } }] },
        },
        ...actionItems.map((a) => ({
            object: "block",
            type: "to_do",
            to_do: {
                rich_text: [{ text: { content: `${a.task} — ${a.owner}` } }],
                checked: a.status === "done",
            },
        })),
    ];

    const response = await fetch("https://api.notion.com/v1/pages", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${config.integrations.notionApiKey}`,
            "Notion-Version": "2022-06-28",
        },
        body: JSON.stringify({
            parent: { type: "database_id", database_id: "REPLACE_WITH_DATABASE_ID" },
            properties: {
                title: { title: [{ text: { content: analysis.title } }] },
            },
            children: blocks,
        }),
    });

    if (!response.ok) {
        const err = await response.json() as { message?: string };
        throw new Error(`Notion export failed: ${err.message}`);
    }

    auditLog("export", "meeting", analysis.title, { format: "notion" });
}

// ─── Slack Export ─────────────────────────────────────────────────────────────

export async function exportToSlack(
    analysis: MeetingAnalysis,
    actionItems: ActionItem[]
): Promise<void> {
    if (!config.integrations.slackBotToken) {
        throw new Error("VITE_SLACK_BOT_TOKEN not set. Add it to your .env file.");
    }

    const blocks = [
        {
            type: "header",
            text: { type: "plain_text", text: `📋 ${analysis.title}` },
        },
        {
            type: "section",
            text: { type: "mrkdwn", text: `*Summary:* ${analysis.executive_summary}` },
        },
        { type: "divider" },
        {
            type: "section",
            text: {
                type: "mrkdwn",
                text: `*Action Items:*\n${actionItems
                    .slice(0, 10)
                    .map((a) => `• \`${a.priority}\` ${a.task} — ${a.owner}`)
                    .join("\n")}`,
            },
        },
        {
            type: "context",
            elements: [
                {
                    type: "mrkdwn",
                    text: `Health Score: *${analysis.effectiveness_score}/10* · Made by <${config.branding.url}|${config.branding.name}>`,
                },
            ],
        },
    ];

    const response = await fetch("https://slack.com/api/chat.postMessage", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${config.integrations.slackBotToken}`,
        },
        body: JSON.stringify({
            channel: config.integrations.slackChannelId,
            blocks,
            text: `Meeting summary: ${analysis.title}`,
        }),
    });

    const data = await response.json() as { ok: boolean; error?: string };
    if (!data.ok) {
        throw new Error(`Slack export failed: ${data.error}`);
    }

    auditLog("export", "meeting", analysis.title, { format: "slack" });
}
