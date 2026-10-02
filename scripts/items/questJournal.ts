import { world, type Player, type RawMessage } from "@minecraft/server";
import { ActionFormData } from "@minecraft/server-ui";
import { QUESTS } from "../data/quests";
import { loadProfile } from "../player/profile";
import { levelInfo } from "../player/progression";
import { loadState } from "../quest/state";

const QUEST_JOURNAL_ITEM = "mini_rpg:quest_journal";

export function registerQuestJournal(): void {
  world.afterEvents.itemUse.subscribe(({ source, itemStack }) => {
    if (itemStack.typeId === QUEST_JOURNAL_ITEM) void openJournal(source);
  });
}

/** Level, coins, the active quest with its progress, and completed quests. */
async function openJournal(player: Player): Promise<void> {
  const profile = loadProfile(player);
  const { level, xpIntoLevel, xpForNext } = levelInfo(profile.xp);
  const state = loadState(player);
  const active = state.active && QUESTS[state.active.questId];
  const completed = state.completed.flatMap((id) => (QUESTS[id] ? [QUESTS[id]] : []));

  const lines: RawMessage[] = [
    { translate: "mini_rpg.journal.level", with: [String(level), String(xpIntoLevel), String(xpForNext)] },
    { text: "\n" },
    { translate: "mini_rpg.journal.coins", with: [String(profile.coins)] },
    { text: "\n\n" },
    { translate: "mini_rpg.journal.active" },
    { text: "\n" },
  ];
  if (state.active && active) {
    lines.push(
      {
        translate: "mini_rpg.hud.progress",
        with: {
          rawtext: [
            { translate: active.titleKey },
            { text: String(state.active.progress) },
            { text: String(active.objective.count) },
          ],
        },
      },
      { text: "\n" },
      { translate: active.descriptionKey }
    );
  } else {
    lines.push({ translate: "mini_rpg.journal.none" });
  }
  lines.push({ text: "\n\n" }, { translate: "mini_rpg.journal.completed" }, { text: "\n" });
  if (completed.length === 0) lines.push({ translate: "mini_rpg.journal.none" });
  for (const quest of completed) lines.push({ text: "- " }, { translate: quest.titleKey }, { text: "\n" });

  await new ActionFormData()
    .title({ translate: "mini_rpg.journal.title" })
    .body({ rawtext: lines })
    .button({ translate: "mini_rpg.journal.close" })
    .show(player);
}
