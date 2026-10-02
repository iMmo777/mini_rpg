export interface KillObjective {
  type: "kill";
  /** Entity type id, e.g. "minecraft:zombie". */
  target: string;
  count: number;
}

/** Progress is the amount of the item in the player's inventory; the items are taken on report. */
export interface CollectObjective {
  type: "collect";
  /** Item type id, e.g. "minecraft:bone". */
  item: string;
  count: number;
}

export type QuestObjective = KillObjective | CollectObjective;

export interface ItemReward {
  itemType: string;
  amount: number;
}

export interface QuestReward {
  xp: number;
  coins: number;
  items: ItemReward[];
}

export interface QuestDef {
  id: string;
  titleKey: string;
  descriptionKey: string;
  objective: QuestObjective;
  reward: QuestReward;
}
