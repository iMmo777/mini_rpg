import type { Player } from "@minecraft/server";

export interface ActiveQuest {
  questId: string;
  progress: number;
}

export interface QuestState {
  /** At most one active objective per player. */
  active: ActiveQuest | null;
  completed: string[];
}

const KEY = "mini_rpg:quest_state";

/** Reads a saved value; anything missing or malformed falls back to an empty state. */
export function parseState(raw: unknown): QuestState {
  if (typeof raw !== "string") return { active: null, completed: [] };
  try {
    const parsed = JSON.parse(raw) as Partial<QuestState>;
    return { active: parsed.active ?? null, completed: parsed.completed ?? [] };
  } catch {
    return { active: null, completed: [] };
  }
}

export function loadState(player: Player): QuestState {
  return parseState(player.getDynamicProperty(KEY));
}

export function saveState(player: Player, state: QuestState): void {
  player.setDynamicProperty(KEY, JSON.stringify(state));
}
