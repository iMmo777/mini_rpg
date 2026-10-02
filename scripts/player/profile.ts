import type { Player } from "@minecraft/server";

/** Per-player progression, saved next to the quest state. */
export interface Profile {
  xp: number;
  coins: number;
}

const KEY = "mini_rpg:profile";

/** Reads a saved value; anything missing or malformed falls back to zero. */
export function parseProfile(raw: unknown): Profile {
  if (typeof raw !== "string") return { xp: 0, coins: 0 };
  try {
    const parsed = JSON.parse(raw) as Partial<Profile>;
    const count = (value: unknown) => (typeof value === "number" && Number.isFinite(value) && value > 0 ? value : 0);
    return { xp: count(parsed.xp), coins: count(parsed.coins) };
  } catch {
    return { xp: 0, coins: 0 };
  }
}

export function loadProfile(player: Player): Profile {
  return parseProfile(player.getDynamicProperty(KEY));
}

export function saveProfile(player: Player, profile: Profile): void {
  player.setDynamicProperty(KEY, JSON.stringify(profile));
}
