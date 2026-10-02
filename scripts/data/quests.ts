import type { QuestDef } from "../quest/types";
import questJson from "./quests.json";

/** Quest definitions from quests.json, keyed by id. The shape is checked by tests/content.test.ts. */
export const QUESTS: Record<string, QuestDef> = Object.fromEntries(
  Object.entries(questJson as Record<string, Omit<QuestDef, "id">>).map(([id, quest]) => [id, { id, ...quest }])
);
