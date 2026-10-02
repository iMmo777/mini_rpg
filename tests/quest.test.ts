import { describe, expect, it } from "vitest";
import { parseState, type QuestState } from "../scripts/quest/state";
import { getQuestStatus } from "../scripts/quest/status";
import { accept, collect, kill, report, reset } from "../scripts/quest/transitions";
import type { QuestDef, QuestObjective } from "../scripts/quest/types";

const quest = (id: string, objective: QuestObjective): QuestDef => ({
  id,
  titleKey: `t.${id}`,
  descriptionKey: `d.${id}`,
  objective,
  reward: { xp: 10, coins: 5, items: [] },
});

const zombies = quest("zombies", { type: "kill", target: "minecraft:zombie", count: 2 });
const skeletons = quest("skeletons", { type: "kill", target: "minecraft:skeleton", count: 1 });
const bones = quest("bones", { type: "collect", item: "minecraft:bone", count: 3 });
const empty: QuestState = { active: null, completed: [] };

describe("quest lifecycle", () => {
  it("goes available → active → ready → completed", () => {
    expect(getQuestStatus(empty, zombies)).toBe("available");

    let state = accept(empty, zombies)!;
    expect(getQuestStatus(state, zombies)).toBe("active");

    state = kill(state, zombies, "minecraft:zombie")!;
    expect(state.active?.progress).toBe(1);
    expect(getQuestStatus(state, zombies)).toBe("active");

    state = kill(state, zombies, "minecraft:zombie")!;
    expect(getQuestStatus(state, zombies)).toBe("ready");

    state = report(state, zombies)!;
    expect(state).toEqual({ active: null, completed: ["zombies"] });
    expect(getQuestStatus(state, zombies)).toBe("completed");
  });

  it("allows only one active quest per player", () => {
    const state = accept(empty, zombies)!;
    expect(getQuestStatus(state, skeletons)).toBe("busy");
    expect(accept(state, skeletons)).toBeUndefined();
  });

  it("does not accept a completed quest again", () => {
    expect(accept({ active: null, completed: ["zombies"] }, zombies)).toBeUndefined();
  });
});

describe("kill", () => {
  const active = accept(empty, zombies)!;

  it("ignores kills of other entity types", () => {
    expect(kill(active, zombies, "minecraft:skeleton")).toBeUndefined();
  });

  it("ignores kills once the objective is done, until reported", () => {
    const ready = kill(kill(active, zombies, "minecraft:zombie")!, zombies, "minecraft:zombie")!;
    expect(kill(ready, zombies, "minecraft:zombie")).toBeUndefined();
  });

  it("ignores kills when the quest isn't active", () => {
    expect(kill(empty, zombies, "minecraft:zombie")).toBeUndefined();
  });

  it("does not mutate the previous state", () => {
    kill(active, zombies, "minecraft:zombie");
    expect(active.active?.progress).toBe(0);
  });
});

describe("collect", () => {
  const active = accept(empty, bones)!;

  it("follows the inventory, capped at the target count", () => {
    const some = collect(active, bones, 2)!;
    expect(some.active?.progress).toBe(2);
    expect(getQuestStatus(some, bones)).toBe("active");

    const enough = collect(some, bones, 10)!;
    expect(enough.active?.progress).toBe(3);
    expect(getQuestStatus(enough, bones)).toBe("ready");
  });

  it("goes back to active when items leave the inventory before reporting", () => {
    const ready = collect(active, bones, 3)!;
    const dropped = collect(ready, bones, 1)!;
    expect(getQuestStatus(dropped, bones)).toBe("active");
    expect(report(dropped, bones)).toBeUndefined();
  });

  it("returns undefined when nothing changes", () => {
    expect(collect(active, bones, 0)).toBeUndefined();
  });

  it("ignores other quests and kill objectives", () => {
    expect(collect(active, zombies, 3)).toBeUndefined();
    expect(collect(accept(empty, zombies)!, zombies, 3)).toBeUndefined();
  });

  it("is not affected by kills", () => {
    expect(kill(active, bones, "minecraft:skeleton")).toBeUndefined();
  });
});

describe("report", () => {
  it("is rejected before the objective is done", () => {
    expect(report(accept(empty, zombies)!, zombies)).toBeUndefined();
  });

  it("is rejected for a quest that was already reported", () => {
    expect(report({ active: null, completed: ["zombies"] }, zombies)).toBeUndefined();
  });
});

describe("reset", () => {
  it("clears an active quest", () => {
    expect(reset(accept(empty, zombies)!, zombies)).toEqual(empty);
  });

  it("clears a completed quest and keeps other progress", () => {
    const state: QuestState = { active: { questId: "skeletons", progress: 0 }, completed: ["zombies"] };
    expect(reset(state, zombies)).toEqual({ active: state.active, completed: [] });
  });

  it("does nothing for a quest that was never taken", () => {
    expect(reset(empty, zombies)).toBeUndefined();
    expect(reset(accept(empty, skeletons)!, zombies)).toBeUndefined();
  });
});

describe("parseState", () => {
  it("restores a saved state", () => {
    const saved: QuestState = { active: { questId: "zombies", progress: 1 }, completed: ["skeletons"] };
    expect(parseState(JSON.stringify(saved))).toEqual(saved);
  });

  it.each([undefined, 42, "", "not json", "{"])("falls back to an empty state for %j", (raw) => {
    expect(parseState(raw)).toEqual(empty);
  });

  it("fills in missing fields", () => {
    expect(parseState("{}")).toEqual(empty);
  });
});
