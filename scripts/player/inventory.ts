import type { ItemStack, Player } from "@minecraft/server";

export function countItem(player: Player, itemType: string): number {
  const container = player.getComponent("minecraft:inventory")?.container;
  if (!container) return 0;
  let total = 0;
  for (let slot = 0; slot < container.size; slot++) {
    const item = container.getItem(slot);
    if (item?.typeId === itemType) total += item.amount;
  }
  return total;
}

/** Removes up to `count` of the item, starting from the first slot. */
export function removeItem(player: Player, itemType: string, count: number): void {
  const container = player.getComponent("minecraft:inventory")?.container;
  if (!container) return;
  let left = count;
  for (let slot = 0; slot < container.size && left > 0; slot++) {
    const item = container.getItem(slot);
    if (item?.typeId !== itemType) continue;
    const taken = Math.min(item.amount, left);
    left -= taken;
    if (taken === item.amount) {
      container.setItem(slot);
    } else {
      item.amount -= taken;
      container.setItem(slot, item);
    }
  }
}

/** Adds the item to the inventory; whatever doesn't fit drops at the player's feet. */
export function giveItem(player: Player, item: ItemStack): void {
  const leftover = player.addItem(item);
  if (leftover) player.dimension.spawnItem(leftover, player.location);
}
