import { ItemStack, system, type Player, type RawMessage } from "@minecraft/server";
import type { QuestReward } from "../quest/types";
import { giveItem } from "./inventory";
import { loadProfile, saveProfile } from "./profile";
import { grant, levelInfo } from "./progression";

/** In ticks: 0.5 s fade in, 3 s on screen, 1 s fade out. */
export const TITLE_TIMING = { fadeInDuration: 10, stayDuration: 60, fadeOutDuration: 20 };

/** Gives XP, coins and items, and returns a "+60 XP, +25 Coins, +5 Emerald" message for chat and titles. */
export function grantReward(player: Player, reward: QuestReward): RawMessage {
  const before = loadProfile(player);
  const after = grant(before, reward.xp, reward.coins);
  saveProfile(player, after);

  const parts: RawMessage[] = [];
  if (reward.xp > 0) parts.push({ translate: "mini_rpg.reward.xp", with: [String(reward.xp)] });
  if (reward.coins > 0) parts.push({ translate: "mini_rpg.reward.coins", with: [String(reward.coins)] });
  for (const { itemType, amount } of reward.items) {
    const item = new ItemStack(itemType, amount);
    giveItem(player, item);
    parts.push({
      translate: "mini_rpg.reward.item",
      with: { rawtext: [{ text: String(amount) }, { translate: item.localizationKey }] },
    });
  }

  const levelBefore = levelInfo(before.xp).level;
  const levelAfter = levelInfo(after.xp).level;
  if (levelAfter > levelBefore) {
    // After the quest's own title has faded out.
    system.runTimeout(() => {
      if (!player.isValid) return;
      player.onScreenDisplay.setTitle(
        { translate: "mini_rpg.title.level_up" },
        { ...TITLE_TIMING, subtitle: { translate: "mini_rpg.title.level", with: [String(levelAfter)] } }
      );
      player.playSound("random.levelup");
    }, 90);
  }

  return { rawtext: parts.flatMap((part, index) => (index === 0 ? [part] : [{ text: ", " }, part])) };
}
