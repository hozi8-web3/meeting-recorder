/**
 * DEVORA DEVS — Data Types & Zod Schemas
 * http://devoradevs.xyz/
 */

import { z } from "zod";

// ─── Core Data Types ─────────────────────────────────────────────────────────

export interface Meeting {
    id: string;
    title: string;
    date: string;
    duration_ms: number;
    attendees: string[];
    audio_path: string;
    transcript_path: string;
    status: "recording" | "processing" | "ready" | "error";
    sentiment: "positive" | "neutral" | "tense" | "unproductive" | "unclear";
    effectiveness_score: number;
    created_at: string;
    updated_at: string;
}

export interface ActionItem {
    id: string;
    meeting_id: string;
    task: string;
    owner: string;
    due_date: string | null;
    priority: "critical" | "high" | "medium" | "low";
    status: "open" | "in_progress" | "done" | "cancelled";
    dependencies: string[];
    context: string;
    estimated_minutes: number | null;
    created_at: string;
}

export interface TranscriptSegment {
    id: string;
    meeting_id: string;
    speaker: string;
    start_ms: number;
    end_ms: number;
    text: string;
    confidence: number;
}

export interface Decision {
    id: string;
    meeting_id: string;
    decision: string;
    context: string;
    decided_by: string;
    timestamp_ms: number;
}

export interface AuditLogEntry {
    id: string;
    timestamp: string;
    action: string;
    entity_type: string;
    entity_id: string;
    user: string;
    metadata: Record<string, unknown>;
}

// ─── Zod Schemas for MR-001 Output ───────────────────────────────────────────

export const ActionItemSchema = z.object({
    id: z.string(),
    task: z.string(),
    owner: z.string(),
    due_date: z.string().nullable(),
    priority: z.enum(["critical", "high", "medium", "low"]),
    priority_reasoning: z.string().optional(),
    dependencies: z.array(z.string()).default([]),
    context: z.string(),
    estimated_minutes: z.number().nullable().optional(),
});

export const KeyDecisionSchema = z.object({
    decision: z.string(),
    rationale: z.string(),
    decided_by: z.string(),
    impact: z.enum(["high", "medium", "low"]),
    timestamp_ms: z.number(),
});

export const OpenQuestionSchema = z.object({
    question: z.string(),
    raised_by: z.string(),
    blocking: z.boolean(),
    follow_up_owner: z.string().nullable(),
});

export const BlockerSchema = z.object({
    blocker: z.string(),
    affects: z.array(z.string()),
    owner_to_resolve: z.string(),
});

export const MeetingAnalysisSchema = z.object({
    title: z.string(),
    executive_summary: z.string(),
    attendees: z.array(z.string()),
    duration_minutes: z.number(),
    key_decisions: z.array(KeyDecisionSchema),
    action_items: z.array(ActionItemSchema),
    open_questions: z.array(OpenQuestionSchema),
    blockers: z.array(BlockerSchema),
    next_meeting: z.object({
        suggested_date: z.string().nullable(),
        agenda_items: z.array(z.string()),
    }),
    sentiment: z.enum(["positive", "neutral", "tense", "unproductive", "unclear"]),
    sentiment_evidence: z.string(),
    effectiveness_score: z.number().min(1).max(10),
    effectiveness_score_reasoning: z.string(),
    topics_covered: z.array(z.string()),
    total_action_items: z.number(),
    unassigned_action_items: z.number(),
});

export type MeetingAnalysis = z.infer<typeof MeetingAnalysisSchema>;

// ─── Zod Schemas for MR-002 Output ───────────────────────────────────────────

export const DiarizationSchema = z.object({
    speaker_map: z.record(z.string(), z.string()),
    speaker_confidence: z.record(z.string(), z.enum(["high", "medium", "low", "unknown"])),
    segments: z.array(
        z.object({
            speaker: z.string(),
            start_ms: z.number(),
            end_ms: z.number(),
            text: z.string(),
            original_text: z.string().optional(),
            confidence: z.number(),
        })
    ),
    merged_count: z.number(),
    corrections_made: z.array(z.string()),
    transcript_quality: z.enum(["high", "medium", "low"]),
    quality_issues: z.array(z.string()),
    recommended_action: z.string(),
});

export type DiarizationResult = z.infer<typeof DiarizationSchema>;

// ─── Zod Schemas for MR-003 Output ───────────────────────────────────────────

export const EmailSchema = z.object({
    subject: z.string(),
    preview_text: z.string(),
    body: z.string(),
    word_count: z.number(),
    tone_achieved: z.string(),
    personalization_notes: z.array(z.string()),
});

export type EmailResult = z.infer<typeof EmailSchema>;

// ─── Zod Schemas for MR-004 Output ───────────────────────────────────────────

export const PrioritizerSchema = z.object({
    updated_items: z.array(
        z.object({
            id: z.string(),
            priority: z.enum(["critical", "high", "medium", "low"]),
            change_reason: z.string().nullable(),
            is_overdue: z.boolean(),
            days_until_due: z.number().nullable(),
            recommended_action: z.enum([
                "start_today",
                "schedule_this_week",
                "delegate",
                "deprioritize",
                "escalate",
            ]),
        })
    ),
    daily_focus: z.array(z.string()),
    overdue_items: z.array(z.string()),
    at_risk_items: z.array(z.string()),
    unassigned_items: z.array(z.string()),
    daily_summary: z.string(),
});

export type PrioritizerResult = z.infer<typeof PrioritizerSchema>;

// ─── Zod Schemas for MR-005 Output ───────────────────────────────────────────

export const HealthSchema = z.object({
    health_score: z.number().min(0).max(100),
    grade: z.enum(["A", "B", "C", "D", "F"]),
    score_breakdown: z.object({
        clarity_of_purpose: z.number(),
        decisions_made: z.number(),
        action_item_quality: z.number(),
        time_efficiency: z.number(),
        participation_balance: z.number(),
    }),
    strengths: z.array(z.string()),
    improvements: z.array(
        z.object({
            issue: z.string(),
            recommendation: z.string(),
            impact: z.enum(["high", "medium", "low"]),
        })
    ),
    trend: z.enum(["improving", "stable", "declining", "insufficient_data"]),
    benchmark: z.string(),
    one_thing_to_change: z.string(),
});

export type HealthResult = z.infer<typeof HealthSchema>;
