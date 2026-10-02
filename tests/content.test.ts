// Checks that the JSON/TypeScript data, dialogue files, entity and item files and lang files agree with
// each other. They reference each other by plain strings, so a typo would otherwise only show up in game.
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { NPCS } from "../scripts/data/npcs";
import { QUESTS } from "../scripts/data/quests";
import { SHOP } from "../scripts/data/shop";

const root = join(__dirname, "..");
const bp = join(root, "behavior_packs", "mini_rpg");
const rp = join(root, "resource_packs", "mini_rpg");

const readJson = (path: string) => JSON.parse(readFileSync(path, "utf8"));
const jsonFiles = (dir: string) =>
  readdirSync(dir)
    .filter((f) => f.endsWith(".json"))
    .map((f) => readJson(join(dir, f)));

const NAMESPACED_ID = /^[a-z0-9_]+:[a-z0-9_]+$/;
const isCount = (value: number, max = Infinity) => Number.isInteger(value) && value >= 1 && value <= max;

interface Scene {
  scene_tag: string;
  npc_name: string;
  on_open_commands?: string[];
  on_close_commands?: string[];
  buttons?: { commands: string[] }[];
}
const scenes = new Map<string, Scene>(
  jsonFiles(join(bp, "dialogue")).flatMap((doc) =>
    (doc["minecraft:npc_dialogue"].scenes as Scene[]).map((scene) => [scene.scene_tag, scene] as const)
  )
);

const behaviorEntityDocs = jsonFiles(join(bp, "entities"));
const behaviorEntities = behaviorEntityDocs.map((doc) => doc["minecraft:entity"].description.identifier as string);
const clientEntities = jsonFiles(join(rp, "entity")).map(
  (doc) => doc["minecraft:client_entity"].description.identifier as string
);
const itemDocs = jsonFiles(join(bp, "items")).map((doc) => doc["minecraft:item"]);
const itemTextures = readJson(join(rp, "textures", "item_texture.json")).texture_data as Record<string, unknown>;

const parseLang = (path: string) =>
  new Map(
    readFileSync(path, "utf8")
      .split(/\r?\n/)
      .filter((line) => line.includes("=") && !line.startsWith("##"))
      .map((line) => [line.slice(0, line.indexOf("=")), line.slice(line.indexOf("=") + 1)] as const)
  );
const locales = readJson(join(rp, "texts", "languages.json")) as string[];
const langs = new Map(locales.map((locale) => [locale, parseLang(join(rp, "texts", `${locale}.lang`))]));

/** Every string value stored under `property` anywhere in a JSON value. */
const valuesOf = (value: unknown, property: string): string[] => {
  if (Array.isArray(value)) return value.flatMap((child) => valuesOf(child, property));
  if (value && typeof value === "object") {
    return Object.entries(value).flatMap(([key, child]) =>
      key === property && typeof child === "string" ? [child] : valuesOf(child, property)
    );
  }
  return [];
};

/** Lang keys written as string literals in the scripts (chat messages, menus). */
const scriptKeys = (dir: string): string[] =>
  readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return scriptKeys(path);
    return [...readFileSync(path, "utf8").matchAll(/"(mini_rpg\.[\w.]+)"/g)].map((match) => match[1]);
  });

const DIALOGUE_COMMAND = /^\/scriptevent mini_rpg:dialogue (\S+) (open|close|accept|report)(?: (\S+))?$/;

describe.each(Object.values(QUESTS))("quest $id", (quest) => {
  it("has a valid objective", () => {
    const { objective } = quest;
    expect(["kill", "collect"]).toContain(objective.type);
    expect(objective.type === "kill" ? objective.target : objective.item).toMatch(NAMESPACED_ID);
    expect(isCount(objective.count)).toBe(true);
  });

  it("has a valid reward (item amounts fit one stack, as ItemStack requires)", () => {
    const { xp, coins, items } = quest.reward;
    expect(Number.isInteger(xp) && xp >= 0).toBe(true);
    expect(Number.isInteger(coins) && coins >= 0).toBe(true);
    for (const item of items) {
      expect(item.itemType).toMatch(NAMESPACED_ID);
      expect(isCount(item.amount, 64)).toBe(true);
    }
  });

  it("is given by exactly one NPC", () => {
    const givers = Object.values(NPCS).filter((npc) => npc.quests.some((entry) => entry.questId === quest.id));
    expect(givers).toHaveLength(1);
  });
});

describe.each(Object.values(NPCS))("NPC $typeId", (npc) => {
  const questScenes = npc.quests.flatMap(({ questId, scenes: tags }) =>
    Object.entries(tags).map(([kind, tag]) => ({ kind, tag, questId }))
  );
  const allScenes = [
    ...questScenes,
    { kind: "busy", tag: npc.scenes.busy, questId: undefined },
    { kind: "thanks", tag: npc.scenes.thanks, questId: undefined },
  ];

  it("has its quests, a behavior entity and a client entity", () => {
    for (const { questId } of npc.quests) expect(QUESTS[questId], questId).toBeDefined();
    expect(behaviorEntities).toContain(npc.typeId);
    expect(clientEntities).toContain(npc.typeId);
  });

  it.each(allScenes)("scene $tag exists and shows the NPC's name", ({ tag }) => {
    expect(scenes.get(tag), tag).toBeDefined();
    expect(scenes.get(tag)!.npc_name).toBe(npc.name);
  });

  it.each(allScenes)("scene $tag sends dialogue events for this NPC and quest", ({ kind, tag, questId }) => {
    const scene = scenes.get(tag)!;
    expect(scene.on_open_commands).toEqual([`/scriptevent mini_rpg:dialogue ${npc.typeId} open`]);
    expect(scene.on_close_commands).toEqual([`/scriptevent mini_rpg:dialogue ${npc.typeId} close`]);

    const buttons = (scene.buttons ?? []).map((button) => {
      expect(button.commands).toHaveLength(1);
      const [, typeId, action, buttonQuestId] = DIALOGUE_COMMAND.exec(button.commands[0]) ?? [];
      expect(typeId, button.commands[0]).toBe(npc.typeId);
      return buttonQuestId ? `${action} ${buttonQuestId}` : action;
    });
    const expected: Record<string, string[]> = {
      intro: [`accept ${questId}`, "close"],
      ready: [`report ${questId}`, "close"],
    };
    expect(buttons).toEqual(expected[kind] ?? ["close"]);
  });
});

describe("shop", () => {
  it("has a merchant with behavior and client entities", () => {
    expect(behaviorEntities).toContain(SHOP.merchant.typeId);
    expect(clientEntities).toContain(SHOP.merchant.typeId);
  });

  it.each(SHOP.items)("$itemType is a valid offer", (item) => {
    expect(item.itemType).toMatch(NAMESPACED_ID);
    expect(isCount(item.amount, 64)).toBe(true);
    expect(isCount(item.price)).toBe(true);
  });
});

describe.each(itemDocs)("item $description.identifier", (item) => {
  it("has an icon in item_texture.json", () => {
    expect(itemTextures).toHaveProperty([item.components["minecraft:icon"].textures.default]);
  });
});

describe("manifests", () => {
  const pkg = readJson(join(root, "package.json"));
  const bpManifest = readJson(join(bp, "manifest.json"));
  const rpManifest = readJson(join(rp, "manifest.json"));
  const packVersion = (pkg.version as string).split(".").map(Number);

  it("both packs carry the package.json version, so a release tag matches what players install", () => {
    expect(bpManifest.header.version).toEqual(packVersion);
    expect(rpManifest.header.version).toEqual(packVersion);
  });

  it("the packs depend on each other's current version", () => {
    const dependencyOn = (manifest: typeof bpManifest, uuid: string) =>
      (manifest.dependencies as { uuid?: string; version: number[] }[]).find((d) => d.uuid === uuid)?.version;
    expect(dependencyOn(bpManifest, rpManifest.header.uuid)).toEqual(rpManifest.header.version);
    expect(dependencyOn(rpManifest, bpManifest.header.uuid)).toEqual(bpManifest.header.version);
  });

  const modules = (bpManifest.dependencies as { module_name?: string; version: string }[]).filter(
    (dependency) => dependency.module_name
  );
  it.each(modules)("$module_name is the exact version the scripts are built against", (dependency) => {
    expect(pkg.dependencies[dependency.module_name!]).toBe(dependency.version);
  });
});

describe("lang files", () => {
  const entityIds = [...Object.keys(NPCS), SHOP.merchant.typeId];
  const referenced = new Set([
    ...valuesOf([...scenes.values()], "translate"),
    ...valuesOf(behaviorEntityDocs, "interact_text"),
    ...itemDocs.map((item) => item.components["minecraft:display_name"].value as string),
    ...Object.values(QUESTS).flatMap((quest) => [quest.titleKey, quest.descriptionKey]),
    ...entityIds.flatMap((typeId) => [`entity.${typeId}.name`, `item.spawn_egg.entity.${typeId}.name`]),
    ...scriptKeys(join(root, "scripts")),
  ]);

  it.each(locales)("%s has no malformed lines (every entry is key=value)", (locale) => {
    const lines = readFileSync(join(rp, "texts", `${locale}.lang`), "utf8").split(/\r?\n/);
    expect(lines.filter((line) => line.trim() !== "" && !line.startsWith("##") && !line.includes("="))).toEqual([]);
  });
  it.each(locales)("%s defines every key the pack uses", (locale) => {
    const lang = langs.get(locale)!;
    expect([...referenced].filter((key) => !lang.has(key))).toEqual([]);
  });

  it.each(locales)("%s has the same keys and %s placeholders as en_US", (locale) => {
    const base = langs.get("en_US")!;
    const lang = langs.get(locale)!;
    expect([...lang.keys()].sort()).toEqual([...base.keys()].sort());
    for (const [key, text] of base) {
      expect(lang.get(key)?.split("%s").length, key).toBe(text.split("%s").length);
    }
  });
});
