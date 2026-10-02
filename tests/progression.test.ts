import { describe, expect, it } from "vitest";
import { parseProfile } from "../scripts/player/profile";
import { grant, levelInfo, spend, xpForNextLevel } from "../scripts/player/progression";

describe("levelInfo", () => {
  it("starts at level 1 with no XP", () => {
    expect(levelInfo(0)).toEqual({ level: 1, xpIntoLevel: 0, xpForNext: 100 });
  });

  it("levels up exactly at each threshold (100, then +200, then +300)", () => {
    expect(levelInfo(99).level).toBe(1);
    expect(levelInfo(100)).toEqual({ level: 2, xpIntoLevel: 0, xpForNext: 200 });
    expect(levelInfo(299)).toEqual({ level: 2, xpIntoLevel: 199, xpForNext: 200 });
    expect(levelInfo(300)).toEqual({ level: 3, xpIntoLevel: 0, xpForNext: 300 });
  });

  it("treats negative XP as zero", () => {
    expect(levelInfo(-50)).toEqual(levelInfo(0));
  });

  it("grows the requirement each level", () => {
    expect(xpForNextLevel(1)).toBeLessThan(xpForNextLevel(2));
  });
});

describe("coins", () => {
  it("grant adds XP and coins", () => {
    expect(grant({ xp: 10, coins: 5 }, 50, 20)).toEqual({ xp: 60, coins: 25 });
  });

  it("spend deducts the price when affordable, including the exact amount", () => {
    expect(spend({ xp: 0, coins: 30 }, 10)).toEqual({ xp: 0, coins: 20 });
    expect(spend({ xp: 0, coins: 10 }, 10)).toEqual({ xp: 0, coins: 0 });
  });

  it("spend refuses when the player can't afford it", () => {
    expect(spend({ xp: 0, coins: 9 }, 10)).toBeUndefined();
  });
});

describe("parseProfile", () => {
  it("restores a saved profile", () => {
    expect(parseProfile(JSON.stringify({ xp: 120, coins: 45 }))).toEqual({ xp: 120, coins: 45 });
  });

  it.each([undefined, 7, "", "not json", '{"xp":"lots","coins":-5}', '{"xp":null}'])(
    "falls back to zero for %j",
    (raw) => {
      expect(parseProfile(raw)).toEqual({ xp: 0, coins: 0 });
    }
  );
});
