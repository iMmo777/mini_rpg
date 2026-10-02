import type { Player } from "@minecraft/server";
import type { QuestDef } from "./types";

// Each player sees only their own progress, on the actionbar (the scoreboard sidebar is shared by everyone).
export function showQuestProgress(player: Player, quest: QuestDef, progress: number): void {
  player.onScreenDisplay.setActionBar({
    translate: "mini_rpg.hud.progress",
    with: {
      rawtext: [{ translate: quest.titleKey }, { text: String(progress) }, { text: String(quest.objective.count) }],
    },
  });
}
