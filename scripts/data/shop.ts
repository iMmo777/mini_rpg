import shopJson from "./shop.json";

export interface ShopItem {
  itemType: string;
  amount: number;
  /** In coins. */
  price: number;
}

export interface ShopDef {
  /** Plain entity (no minecraft:npc), so its name tag never resets. */
  merchant: { typeId: string; name: string };
  items: ShopItem[];
}

/** From shop.json. The shape is checked by tests/content.test.ts. */
export const SHOP: ShopDef = shopJson;
