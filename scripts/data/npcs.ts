import type { NpcDef } from "../npc/types";

export const NPCS: Record<string, NpcDef> = {
  "mini_rpg:npc1": {
    typeId: "mini_rpg:npc1",
    name: "Ardan the Guard",
    quests: [
      {
        questId: "zombie_hunt",
        scenes: { intro: "mini_rpg_npc1_intro", progress: "mini_rpg_npc1_progress", ready: "mini_rpg_npc1_ready" },
      },
    ],
    scenes: { busy: "mini_rpg_npc1_busy", thanks: "mini_rpg_npc1_thanks" },
  },
  "mini_rpg:npc2": {
    typeId: "mini_rpg:npc2",
    name: "Mira the Hunter",
    quests: [
      {
        questId: "skeleton_patrol",
        scenes: { intro: "mini_rpg_npc2_intro", progress: "mini_rpg_npc2_progress", ready: "mini_rpg_npc2_ready" },
      },
      {
        questId: "bone_collector",
        scenes: {
          intro: "mini_rpg_npc2_bones_intro",
          progress: "mini_rpg_npc2_bones_progress",
          ready: "mini_rpg_npc2_bones_ready",
        },
      },
    ],
    scenes: { busy: "mini_rpg_npc2_busy", thanks: "mini_rpg_npc2_thanks" },
  },
};
