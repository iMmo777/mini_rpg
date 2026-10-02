import { ItemStack, system, world, type Player } from "@minecraft/server";
import { ActionFormData } from "@minecraft/server-ui";
import { SHOP, type ShopItem } from "../data/shop";
import { giveItem } from "../player/inventory";
import { loadProfile, saveProfile } from "../player/profile";
import { spend } from "../player/progression";

export function registerShop(): void {
  const { typeId, name } = SHOP.merchant;

  world.beforeEvents.playerInteractWithEntity.subscribe((event) => {
    if (event.target.typeId !== typeId) return;
    event.cancel = true;
    const { player } = event;
    system.run(() => {
      if (player.isValid) void openShop(player);
    });
  });

  // A plain entity keeps its name tag, so setting it once on spawn/load is enough.
  const nameTag = `§6${name}`;
  world.afterEvents.entitySpawn.subscribe(({ entity }) => {
    if (entity.typeId === typeId) entity.nameTag = nameTag;
  });
  world.afterEvents.entityLoad.subscribe(({ entity }) => {
    if (entity.typeId === typeId) entity.nameTag = nameTag;
  });
}

async function openShop(player: Player): Promise<void> {
  const form = new ActionFormData()
    .title({ translate: "mini_rpg.shop.title" })
    .body({ translate: "mini_rpg.shop.body", with: [String(loadProfile(player).coins)] });
  for (const item of SHOP.items) {
    form.button({
      translate: "mini_rpg.shop.item",
      with: {
        rawtext: [
          { text: String(item.amount) },
          { translate: new ItemStack(item.itemType).localizationKey },
          { text: String(item.price) },
        ],
      },
    });
  }
  form.button({ translate: "mini_rpg.shop.close" });

  const response = await form.show(player);
  if (response.canceled || response.selection === undefined || response.selection >= SHOP.items.length) return;
  buy(player, SHOP.items[response.selection]);
}

function buy(player: Player, shopItem: ShopItem): void {
  // Re-read: coins may have changed while the menu was open.
  const next = spend(loadProfile(player), shopItem.price);
  if (!next) {
    player.sendMessage({ translate: "mini_rpg.shop.too_expensive", with: [String(shopItem.price)] });
    player.playSound("note.bass");
    return;
  }
  saveProfile(player, next);
  const item = new ItemStack(shopItem.itemType, shopItem.amount);
  giveItem(player, item);
  player.sendMessage({
    translate: "mini_rpg.shop.bought",
    with: {
      rawtext: [{ text: String(shopItem.amount) }, { translate: item.localizationKey }, { text: String(next.coins) }],
    },
  });
  player.playSound("random.orb");
}
