import type { Entity, Player } from "@minecraft/server";
import { QUESTS } from "../data/quests";
import { updateCollectProgress } from "../quest/actions";
import { loadState } from "../quest/state";
import { selectScene } from "./scene";
import type { NpcDef } from "./types";

/** Lets the /dialogue selector target exactly the clicked NPC. */
const DIALOGUE_TARGET_TAG = "mini_rpg_dialogue_target";

export function openNpcDialogue(player: Player, npcEntity: Entity, npc: NpcDef): void {
  // So a collect quest shows its Report button as soon as the items are in the inventory.
  updateCollectProgress(player);
  const scene = selectScene(loadState(player), npc, QUESTS);

  npcEntity.addTag(DIALOGUE_TARGET_TAG);
  try {
    player.runCommand(`dialogue open @e[tag=${DIALOGUE_TARGET_TAG},c=1] @s ${scene}`);
  } finally {
    npcEntity.removeTag(DIALOGUE_TARGET_TAG);
  }
}
