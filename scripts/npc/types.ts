/** Scene tags (from behavior_packs/mini_rpg/dialogue) for one quest. */
export interface QuestScenes {
  /** Offer: Accept/Leave buttons. */
  intro: string;
  progress: string;
  /** Objective done: Report/Leave buttons. */
  ready: string;
}

export interface NpcQuest {
  questId: string;
  scenes: QuestScenes;
}

export interface NpcDef {
  typeId: string;
  /** Must match `npc_name` in its dialogue file. */
  name: string;
  /** Offered one at a time, in this order. */
  quests: NpcQuest[];
  /** Scene tags shown when another NPC's quest is active, and when all of this NPC's quests are done. */
  scenes: { busy: string; thanks: string };
}
