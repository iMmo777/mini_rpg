import type { QuestState } from "./state";
import { getQuestStatus } from "./status";
import type { QuestDef } from "./types";

// Pure state transitions, free of Minecraft APIs. Each returns the next state, or undefined when the
// transition isn't allowed from the current status (or changes nothing).

export function accept(state: QuestState, quest: QuestDef): QuestState | undefined {
  if (getQuestStatus(state, quest) !== "available") return undefined;
  return { ...state, active: { questId: quest.id, progress: 0 } };
}

export function kill(state: QuestState, quest: QuestDef, entityTypeId: string): QuestState | undefined {
  if (!state.active || quest.objective.type !== "kill" || quest.objective.target !== entityTypeId) return undefined;
  // Kills after the objective is done don't count; the quest waits to be reported.
  if (getQuestStatus(state, quest) !== "active") return undefined;
  return { ...state, active: { ...state.active, progress: state.active.progress + 1 } };
}

/** Collect progress follows the inventory: `have` is how many of the item the player holds now. */
export function collect(state: QuestState, quest: QuestDef, have: number): QuestState | undefined {
  if (!state.active || state.active.questId !== quest.id || quest.objective.type !== "collect") return undefined;
  const progress = Math.min(have, quest.objective.count);
  if (progress === state.active.progress) return undefined;
  return { ...state, active: { ...state.active, progress } };
}

export function report(state: QuestState, quest: QuestDef): QuestState | undefined {
  if (getQuestStatus(state, quest) !== "ready") return undefined;
  return { active: null, completed: [...state.completed, quest.id] };
}

export function reset(state: QuestState, quest: QuestDef): QuestState | undefined {
  const status = getQuestStatus(state, quest);
  if (status === "available" || status === "busy") return undefined;
  return {
    active: state.active?.questId === quest.id ? null : state.active,
    completed: state.completed.filter((id) => id !== quest.id),
  };
}
