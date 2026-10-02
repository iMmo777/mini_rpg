import { Player, system, world } from "@minecraft/server";
import { QUESTS } from "../data/quests";
import { recordKill, updateCollectProgress } from "./actions";
import { showQuestProgress } from "./hud";
import { loadState } from "./state";

export function registerQuestTracking(): void {
  const killTargets = [
    ...new Set(
      Object.values(QUESTS).flatMap((quest) => (quest.objective.type === "kill" ? [quest.objective.target] : []))
    ),
  ];
  world.afterEvents.entityDie.subscribe(
    ({ deadEntity, damageSource }) => {
      const killer = damageSource.damagingEntity;
      if (killer instanceof Player) recordKill(killer, deadEntity.typeId);
    },
    { entityTypes: killTargets }
  );

  // Once a second: collect progress follows the inventory, and the actionbar stays up while a quest is active.
  system.runInterval(() => {
    for (const player of world.getAllPlayers()) {
      updateCollectProgress(player);
      const { active } = loadState(player);
      const quest = active && QUESTS[active.questId];
      if (active && quest) showQuestProgress(player, quest, active.progress);
    }
  }, 20);
}
