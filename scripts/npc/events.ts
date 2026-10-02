import { Player, system, world } from "@minecraft/server";
import { NPCS } from "../data/npcs";
import { acceptQuest, reportQuest } from "../quest/actions";
import { openNpcDialogue } from "./dialogue";

export function registerNpcEvents(): void {
  world.beforeEvents.playerInteractWithEntity.subscribe((event) => {
    const npc = NPCS[event.target.typeId];
    if (!npc) return;
    // Also blocks the NPC editor and item use (e.g. name tags).
    event.cancel = true;
    const { player, target } = event;
    system.run(() => {
      if (player.isValid && target.isValid) openNpcDialogue(player, target, npc);
    });
  });

  // minecraft:npc makes clients show "§eNPC" (on spawn and around dialogues). Rewriting the same name is
  // not sent to clients, so the value toggles between two strings that look the same.
  const renameAll = (typeId: string) => {
    const npc = NPCS[typeId];
    if (!npc) return;
    const name = `§e${npc.name}`;
    for (const dimensionId of ["overworld", "nether", "the_end"]) {
      for (const entity of world.getDimension(dimensionId).getEntities({ type: typeId })) {
        entity.nameTag = entity.nameTag === name ? `${name}§r` : name;
      }
    }
  };
  world.afterEvents.entitySpawn.subscribe(({ entity }) => {
    const { typeId } = entity;
    if (NPCS[typeId]) system.run(() => renameAll(typeId));
  });
  world.afterEvents.entityLoad.subscribe(({ entity }) => {
    const { typeId } = entity;
    if (NPCS[typeId]) system.run(() => renameAll(typeId));
  });
  // entityLoad doesn't fire for NPCs loaded before the script started; joining clients start from "§eNPC".
  const renameEveryNpc = () => {
    for (const typeId of Object.keys(NPCS)) renameAll(typeId);
  };
  world.afterEvents.worldLoad.subscribe(() => system.run(renameEveryNpc));
  world.afterEvents.playerSpawn.subscribe(({ initialSpawn }) => {
    if (initialSpawn) system.runTimeout(renameEveryNpc, 20);
  });

  // `/scriptevent mini_rpg:dialogue <npcTypeId> <open|close|accept|report> [questId]`, sent by every
  // button and every scene's on_open/on_close_commands. Renamed twice: the exact reset moment is undocumented.
  system.afterEvents.scriptEventReceive.subscribe(
    ({ id, message, initiator }) => {
      if (id !== "mini_rpg:dialogue") return;
      const [npcTypeId = "", action, questId = ""] = message.trim().split(/\s+/);
      system.run(() => renameAll(npcTypeId));
      system.runTimeout(() => renameAll(npcTypeId), 10);

      if (!(initiator instanceof Player)) return;
      if (action === "accept") acceptQuest(initiator, questId);
      else if (action === "report") reportQuest(initiator, questId);
    },
    { namespaces: ["mini_rpg"] }
  );
}
