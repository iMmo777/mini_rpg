import { world, type Player } from "@minecraft/server";
import { ActionFormData } from "@minecraft/server-ui";
import { QUESTS } from "../data/quests";
import { loadProfile, saveProfile } from "../player/profile";
import { levelInfo } from "../player/progression";
import { resetQuest } from "../quest/actions";
import { loadState } from "../quest/state";
import { getQuestStatus, type QuestStatus } from "../quest/status";

const QUEST_RESET_ITEM = "mini_rpg:quest_reset";

const RESETTABLE: Partial<Record<QuestStatus, string>> = {
  active: "mini_rpg.status.active",
  ready: "mini_rpg.status.ready",
  completed: "mini_rpg.status.completed",
};

export function registerQuestResetItem(): void {
  world.afterEvents.itemUse.subscribe(({ source, itemStack }) => {
    if (itemStack.typeId === QUEST_RESET_ITEM) void openResetMenu(source);
  });
}

/** Buttons: each taken quest, then "Reset XP & coins", then Cancel. */
async function openResetMenu(player: Player): Promise<void> {
  const state = loadState(player);
  const profile = loadProfile(player);
  const entries = Object.values(QUESTS)
    .map((quest) => ({ quest, labelKey: RESETTABLE[getQuestStatus(state, quest)] }))
    .filter((entry) => entry.labelKey !== undefined);

  const form = new ActionFormData()
    .title({ translate: "mini_rpg.reset.title" })
    .body({ translate: "mini_rpg.reset.body" });
  for (const { quest, labelKey } of entries) {
    form.button({ rawtext: [{ translate: quest.titleKey }, { text: "\n" }, { translate: labelKey }] });
  }
  form.button({
    translate: "mini_rpg.reset.profile",
    with: [String(levelInfo(profile.xp).level), String(profile.xp), String(profile.coins)],
  });
  form.button({ translate: "mini_rpg.reset.cancel" });

  const response = await form.show(player);
  if (response.canceled || response.selection === undefined) return;
  if (response.selection < entries.length) {
    resetQuest(player, entries[response.selection].quest);
  } else if (response.selection === entries.length) {
    saveProfile(player, { xp: 0, coins: 0 });
    player.sendMessage({ translate: "mini_rpg.msg.profile_reset" });
    player.playSound("random.orb");
  }
}
