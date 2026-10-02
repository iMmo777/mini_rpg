import { describe, expect, it } from "vitest";
import { selectScene } from "../scripts/npc/scene";
import type { NpcDef } from "../scripts/npc/types";
import type { QuestState } from "../scripts/quest/state";
import type { QuestDef } from "../scripts/quest/types";

const quest = (id: string, count: number): QuestDef => ({
  id,
  titleKey: id,
  descriptionKey: id,
  objective: { type: "kill", target: "minecraft:zombie", count },
  reward: { xp: 0, coins: 0, items: [] },
});
const quests: Record<string, QuestDef> = {
  first: quest("first", 2),
  second: quest("second", 1),
  other: quest("other", 1),
};

const scenes = (id: string) => ({ intro: `${id}_intro`, progress: `${id}_progress`, ready: `${id}_ready` });
const npc: NpcDef = {
  typeId: "test:npc",
  name: "Test",
  quests: [
    { questId: "first", scenes: scenes("first") },
    { questId: "second", scenes: scenes("second") },
  ],
  scenes: { busy: "busy", thanks: "thanks" },
};

const state = (active: QuestState["active"], completed: string[] = []): QuestState => ({ active, completed });

describe("selectScene", () => {
  it("offers the NPC's quests in order", () => {
    expect(selectScene(state(null), npc, quests)).toBe("first_intro");
    expect(selectScene(state(null, ["first"]), npc, quests)).toBe("second_intro");
  });

  it("shows progress, then ready, for the player's active quest with this NPC", () => {
    expect(selectScene(state({ questId: "second", progress: 0 }, ["first"]), npc, quests)).toBe("second_progress");
    expect(selectScene(state({ questId: "first", progress: 2 }), npc, quests)).toBe("first_ready");
  });

  it("is busy while a quest from another NPC is active", () => {
    expect(selectScene(state({ questId: "other", progress: 0 }), npc, quests)).toBe("busy");
    expect(selectScene(state({ questId: "other", progress: 0 }, ["first"]), npc, quests)).toBe("busy");
  });

  it("thanks the player once every quest is completed", () => {
    expect(selectScene(state(null, ["first", "second"]), npc, quests)).toBe("thanks");
    expect(selectScene(state({ questId: "other", progress: 0 }, ["first", "second"]), npc, quests)).toBe("thanks");
  });
});
