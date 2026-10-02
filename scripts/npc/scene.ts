import type { QuestState } from "../quest/state";
import { getQuestStatus } from "../quest/status";
import type { QuestDef } from "../quest/types";
import type { NpcDef } from "./types";

/**
 * The scene tag an NPC shows to a player. The player's own quest with this NPC comes first (progress or
 * ready), then the next quest still available in the NPC's order (intro). Otherwise the NPC is busy
 * (another quest is active) or done (thanks).
 */
export function selectScene(state: QuestState, npc: NpcDef, quests: Record<string, QuestDef>): string {
  const statuses = npc.quests.map((entry) => ({ entry, status: getQuestStatus(state, quests[entry.questId]) }));

  const current = statuses.find(({ status }) => status === "active" || status === "ready");
  if (current) return current.status === "ready" ? current.entry.scenes.ready : current.entry.scenes.progress;

  const next = statuses.find(({ status }) => status === "available");
  if (next) return next.entry.scenes.intro;

  return statuses.some(({ status }) => status === "busy") ? npc.scenes.busy : npc.scenes.thanks;
}
