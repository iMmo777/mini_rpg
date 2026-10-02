import type { QuestState } from "./state";
import type { QuestDef } from "./types";

/**
 * - available: not taken, and no other quest is active
 * - active: taken, objective not done yet
 * - ready: objective done, waiting to be reported to the NPC
 * - busy: another quest is active
 * - completed: reported
 */
export type QuestStatus = "available" | "active" | "ready" | "busy" | "completed";

export function getQuestStatus(state: QuestState, quest: QuestDef): QuestStatus {
  if (state.completed.includes(quest.id)) return "completed";
  if (state.active?.questId === quest.id) {
    return state.active.progress >= quest.objective.count ? "ready" : "active";
  }
  return state.active ? "busy" : "available";
}
