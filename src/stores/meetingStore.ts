/**
 * DEVORA DEVS — Meeting Store (Zustand)
 * http://devoradevs.xyz/
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Meeting, ActionItem, Decision, TranscriptSegment } from "../lib/types";
import { auditLog } from "../lib/auditLog";

interface MeetingState {
    meetings: Meeting[];
    actionItems: ActionItem[];
    decisions: Decision[];
    segments: TranscriptSegment[];
    selectedMeetingId: string | null;

    addMeeting: (m: Meeting) => void;
    updateMeeting: (id: string, patch: Partial<Meeting>) => void;
    deleteMeeting: (id: string) => void;
    selectMeeting: (id: string | null) => void;

    addActionItems: (items: ActionItem[]) => void;
    updateActionItem: (id: string, patch: Partial<ActionItem>) => void;
    deleteActionItem: (id: string) => void;

    addDecisions: (d: Decision[]) => void;
    addSegments: (s: TranscriptSegment[]) => void;

    getSelectedMeeting: () => Meeting | undefined;
    getMeetingItems: (meetingId: string) => ActionItem[];
    getMeetingDecisions: (meetingId: string) => Decision[];
    getMeetingSegments: (meetingId: string) => TranscriptSegment[];
}

export const useMeetingStore = create<MeetingState>()(
    persist(
        (set, get) => ({
            meetings: [],
            actionItems: [],
            decisions: [],
            segments: [],
            selectedMeetingId: null,

            addMeeting: (m) => {
                set((s) => ({ meetings: [m, ...s.meetings] }));
                auditLog("create", "meeting", m.id, { title: m.title });
            },

            updateMeeting: (id, patch) => {
                set((s) => ({
                    meetings: s.meetings.map((m) =>
                        m.id === id ? { ...m, ...patch, updated_at: new Date().toISOString() } : m
                    ),
                }));
                auditLog("update", "meeting", id, patch);
            },

            deleteMeeting: (id) => {
                set((s) => ({
                    meetings: s.meetings.filter((m) => m.id !== id),
                    actionItems: s.actionItems.filter((a) => a.meeting_id !== id),
                    decisions: s.decisions.filter((d) => d.meeting_id !== id),
                    segments: s.segments.filter((seg) => seg.meeting_id !== id),
                    selectedMeetingId: s.selectedMeetingId === id ? null : s.selectedMeetingId,
                }));
                auditLog("delete", "meeting", id);
            },

            selectMeeting: (id) => set({ selectedMeetingId: id }),

            addActionItems: (items) => {
                set((s) => ({ actionItems: [...s.actionItems, ...items] }));
            },

            updateActionItem: (id, patch) => {
                set((s) => ({
                    actionItems: s.actionItems.map((a) =>
                        a.id === id ? { ...a, ...patch } : a
                    ),
                }));
                auditLog("update", "action_item", id, patch);
            },

            deleteActionItem: (id) => {
                set((s) => ({
                    actionItems: s.actionItems.filter((a) => a.id !== id),
                }));
            },

            addDecisions: (d) =>
                set((s) => ({ decisions: [...s.decisions, ...d] })),

            addSegments: (segs) =>
                set((s) => ({ segments: [...s.segments, ...segs] })),

            getSelectedMeeting: () => {
                const { meetings, selectedMeetingId } = get();
                return meetings.find((m) => m.id === selectedMeetingId);
            },

            getMeetingItems: (meetingId) =>
                get().actionItems.filter((a) => a.meeting_id === meetingId),

            getMeetingDecisions: (meetingId) =>
                get().decisions.filter((d) => d.meeting_id === meetingId),

            getMeetingSegments: (meetingId) =>
                get().segments.filter((s) => s.meeting_id === meetingId),
        }),
        { name: "dd-meetings-v1" }
    )
);
