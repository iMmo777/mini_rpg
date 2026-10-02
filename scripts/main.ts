import { registerQuestJournal } from "./items/questJournal";
import { registerQuestResetItem } from "./items/questReset";
import { registerNpcEvents } from "./npc/events";
import { registerQuestTracking } from "./quest/tracking";
import { registerShop } from "./shop/merchant";

registerNpcEvents();
registerQuestTracking();
registerShop();
registerQuestJournal();
registerQuestResetItem();
