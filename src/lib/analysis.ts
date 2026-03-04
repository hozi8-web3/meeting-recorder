/**
 * DEVORA DEVS — Analysis Pipeline (MR-001 → MR-005)
 * http://devoradevs.xyz/
 *
 * Orchestrates all 5 AI analysis prompts via Groq API.
 */

import { groqJSON } from "./groq";
import { useUserConfig } from "../stores/userConfigStore";
import { PROMPTS } from "./prompts";
import {
    MeetingAnalysisSchema,
    DiarizationSchema,
    EmailSchema,
    PrioritizerSchema,
    HealthSchema,
} from "./types";
import type {
    MeetingAnalysis,
    DiarizationResult,
    EmailResult,
    PrioritizerResult,
    HealthResult,
    TranscriptSegment,
    ActionItem,
} from "./types";

/** MR-001 — Analyze a full meeting transcript */
export async function analyzeMeeting(
    transcript: TranscriptSegment[],
    meetingDate: string,
    attendees: string[] = []
): Promise<MeetingAnalysis> {
    const userMessage = JSON.stringify({
        meeting_date: meetingDate,
        known_attendees: attendees,
        transcript,
    });

    const raw = await groqJSON<unknown>(
        useUserConfig.getState().modelSummary,
        PROMPTS.SUMMARY,
        userMessage
    );

    return MeetingAnalysisSchema.parse(raw);
}

/** MR-002 — Clean raw Whisper diarization output */
export async function cleanDiarization(
    rawSegments: TranscriptSegment[],
    knownAttendees: string[] = [],
    meetingContext = ""
): Promise<DiarizationResult> {
    const userMessage = JSON.stringify({
        raw_segments: rawSegments,
        known_attendees: knownAttendees,
        meeting_context: meetingContext,
    });

    const raw = await groqJSON<unknown>(
        useUserConfig.getState().modelDiarization,
        PROMPTS.DIARIZATION,
        userMessage
    );

    return DiarizationSchema.parse(raw);
}

/** MR-003 — Generate follow-up email from meeting analysis */
export async function generateEmail(
    meetingSummary: MeetingAnalysis,
    sender: { name: string; title: string; company: string; email: string },
    recipients: { name: string; email: string; role: string }[],
    tone: "formal" | "professional" | "casual-professional" = "professional",
    includeSections = ["decisions", "action_items", "open_questions", "next_meeting"]
): Promise<EmailResult> {
    const userMessage = JSON.stringify({
        meeting_summary: meetingSummary,
        sender,
        recipients,
        tone,
        include_sections: includeSections,
    });

    const raw = await groqJSON<unknown>(
        useUserConfig.getState().modelEmail,
        PROMPTS.EMAIL,
        userMessage
    );

    return EmailSchema.parse(raw);
}

/** MR-004 — Re-prioritize action items for daily review */
export async function prioritizeActions(
    actionItems: ActionItem[],
    today: string = new Date().toISOString().split("T")[0]
): Promise<PrioritizerResult> {
    const userMessage = JSON.stringify({
        today,
        action_items: actionItems,
    });

    const raw = await groqJSON<unknown>(
        useUserConfig.getState().modelPrioritizer,
        PROMPTS.PRIORITIZER,
        userMessage
    );

    return PrioritizerSchema.parse(raw);
}

/** MR-005 — Score meeting health */
export async function scoreMeetingHealth(
    meetingSummary: MeetingAnalysis,
    meetingMetadata: {
        scheduled_duration_minutes: number;
        actual_duration_minutes: number;
        attendee_count: number;
        meeting_type: string;
    },
    historicalScores: { date: string; score: number }[] = []
): Promise<HealthResult> {
    const userMessage = JSON.stringify({
        meeting_summary: meetingSummary,
        meeting_metadata: meetingMetadata,
        historical_scores: historicalScores,
    });

    const raw = await groqJSON<unknown>(
        useUserConfig.getState().modelHealth,
        PROMPTS.HEALTH,
        userMessage
    );

    return HealthSchema.parse(raw);
}
