import type { Player } from "@minecraft/server";
import { NPCS } from "../data/npcs";
import { QUESTS } from "../data/quests";
import { countItem, removeItem } from "../player/inventory";
import { grantReward, TITLE_TIMING } from "../player/rewards";
import { showQuestProgress } from "./hud";
import { loadState, saveState } from "./state";
import { getQuestStatus } from "./status";
import { accept, collect, kill, report, reset } from "./transitions";
import type { QuestDef } from "./types";

// Applies a transition to the player's saved state, then handles the side effects (chat, titles, sound,
// actionbar, inventory, rewards).

export function acceptQuest(player: Player, questId: string): void {
  const quest = QUESTS[questId];
  const next = quest && accept(loadState(player), quest);
  if (!next) return;
  saveState(player, next);

  player.sendMessage({
    translate: "mini_rpg.msg.accepted",
    with: { rawtext: [{ translate: quest.titleKey }, { translate: quest.descriptionKey }] },
  });
  player.onScreenDisplay.setTitle(
    { translate: "mini_rpg.title.accepted" },
    { ...TITLE_TIMING, subtitle: { translate: quest.titleKey } }
  );
  player.playSound("random.orb");
  // A collect quest may already be (partly) done with what the player is carrying.
  updateCollectProgress(player);
}

export function recordKill(player: Player, entityTypeId: string): void {
  const state = loadState(player);
  const quest = state.active ? QUESTS[state.active.questId] : undefined;
  if (!quest) return;
  const next = kill(state, quest, entityTypeId);
  if (!next?.active) return;
  saveState(player, next);
  showQuestProgress(player, quest, next.active.progress);
  if (getQuestStatus(next, quest) === "ready") notifyReady(player, quest);
}

/** Sets an active collect quest's progress to what the player is carrying. */
export function updateCollectProgress(player: Player): void {
  const state = loadState(player);
  const quest = state.active ? QUESTS[state.active.questId] : undefined;
  if (quest?.objective.type !== "collect") return;
  const next = collect(state, quest, countItem(player, quest.objective.item));
  if (!next?.active) return;
  saveState(player, next);
  showQuestProgress(player, quest, next.active.progress);
  if (getQuestStatus(state, quest) !== "ready" && getQuestStatus(next, quest) === "ready") notifyReady(player, quest);
}

export function reportQuest(player: Player, questId: string): void {
  const quest = QUESTS[questId];
  if (!quest) return;
  // The items must still be in the inventory when reporting.
  updateCollectProgress(player);
  const next = report(loadState(player), quest);
  if (!next) return;
  saveState(player, next);
  if (quest.objective.type === "collect") removeItem(player, quest.objective.item, quest.objective.count);

  const rewards = grantReward(player, quest.reward);
  player.sendMessage({
    translate: "mini_rpg.msg.completed",
    with: { rawtext: [{ translate: quest.titleKey }, rewards] },
  });
  player.onScreenDisplay.setTitle(
    { translate: "mini_rpg.title.completed" },
    { ...TITLE_TIMING, subtitle: { rawtext: [{ translate: quest.titleKey }, { text: "  " }, rewards] } }
  );
  player.playSound("random.levelup");
}

export function resetQuest(player: Player, quest: QuestDef): void {
  const next = reset(loadState(player), quest);
  if (!next) return;
  saveState(player, next);
  player.sendMessage({ translate: "mini_rpg.msg.reset", with: { rawtext: [{ translate: quest.titleKey }] } });
  player.playSound("random.orb");
}

function notifyReady(player: Player, quest: QuestDef): void {
  const giver = Object.values(NPCS).find((npc) => npc.quests.some((entry) => entry.questId === quest.id));
  player.sendMessage({
    translate: "mini_rpg.msg.ready",
    with: { rawtext: [{ translate: quest.titleKey }, { text: giver?.name ?? "" }] },
  });
  player.playSound("random.orb");
}
