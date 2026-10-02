import type { Profile } from "./profile";

// Pure XP, level and coin rules, free of Minecraft APIs.

/** XP needed to go from `level` to `level + 1`: 100 at level 1, 200 at level 2, ... */
export function xpForNextLevel(level: number): number {
  return 100 * level;
}

export interface LevelInfo {
  level: number;
  /** XP earned since reaching `level`. */
  xpIntoLevel: number;
  xpForNext: number;
}

export function levelInfo(totalXp: number): LevelInfo {
  let level = 1;
  let remaining = Math.max(0, totalXp);
  while (remaining >= xpForNextLevel(level)) {
    remaining -= xpForNextLevel(level);
    level += 1;
  }
  return { level, xpIntoLevel: remaining, xpForNext: xpForNextLevel(level) };
}

export function grant(profile: Profile, xp: number, coins: number): Profile {
  return { xp: profile.xp + xp, coins: profile.coins + coins };
}

/** The profile after paying `price`, or undefined if the player can't afford it. */
export function spend(profile: Profile, price: number): Profile | undefined {
  if (profile.coins < price) return undefined;
  return { ...profile, coins: profile.coins - price };
}
