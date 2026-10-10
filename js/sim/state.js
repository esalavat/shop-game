// The whole game state: one plain, JSON-serializable object.
// Bump STATE_VERSION and add a migration in core/save.js whenever its shape changes.

import { makeRoom } from './building.js';
import { createKeeper } from './keeper.js';
import { dropBox } from './stock.js';
import { emptyStats } from './day.js';
import { ribbonsForCollection } from './decor.js';

export const STATE_VERSION = 19;

/** Live-only fields: never saved, reset on every load (customers just walk in again). */
export const TRANSIENT = ['customers', 'queue', 'checkout', 'spawnTimer', 'cashier', 'greeter', 'dresser', 'registers'];

export function resetTransient(state) {
  state.customers = [];
  state.queue = [];
  state.checkout = null;
  state.spawnTimer = 2; // first visitor shortly after opening
  state.cashier = null; // Mia's spot behind the counter (sim/helpers.js), once she's hired
  state.registers = {}; // register rooms' lines, checkouts and cashiers (sim/checkout.js registerOf, GDD #73)
  state.greeter = null; // Ollie at the door and Rosa in the Window Display (sim/helpers.js, GDD #72)
  state.dresser = null;
  return state;
}

/** Every new shop starts with a first delivery waiting to be unpacked. */
export const STARTER_BOXES = [{ itemId: 'teaset', qty: 3 }, { itemId: 'chair', qty: 3 }];

export function giveStarterBoxes(state) {
  for (const b of STARTER_BOXES) {
    dropBox(state, b.itemId, b.qty);
    state.collection[b.itemId] = true;
  }
}

export function createState(now = Date.now()) {
  const state = {
    version: STATE_VERSION,
    nextId: 1,
    day: { number: 1, phase: 'morning', time: 0, stats: emptyStats() },
    coins: 50,
    hearts: 0,
    sparkle: 0,
    ribbons: 0, // Ribbons 🎀 for room styles (GDD #68); set below from the starter Collection
    building: {
      rooms: [makeRoom('r1', 'shop', 0, 0)],
    },
    keeper: createKeeper('r1'),
    orders: [],
    boxes: [],
    collection: {},
    dollhouse: { slots: {} }, // slotId -> itemId (data/dollhouse.js); on show once the Window Display is built
    wishes: [],
    decor: { owned: {} }, // room styles bought with Ribbons ('kind:id' -> true; sim/decor.js); each room wears room.decor
    // The shopkeeper's look, girl or boy (the creator, ui/creator.js); `created` is false until the player has seen the creator.
    shopkeeper: { body: 'girl', hair: 'bun', hairColor: '#c2563a', skin: '#ffd9c2', outfit: '#9fe0c8', accessory: 'none', created: false },
    themeGifts: [], // themes whose coin gift was given, in order (sim/rewards.js, GDD #70)
    upgrades: {}, // id -> true (data/upgrades.js)
    helpers: {},  // id -> true
    stockers: [], // Bea, Theo and Juno, once hired (sim/stocker.js, GDD #72); saved, so boxes in their hands are never lost
    settings: { muted: false }, // sounds and vibration (audio/audio.js)
    best: { coins: 0 },          // best day so far (sim/day.js recordBest)
    tutorial: 'box',             // the first-day guide's step (sim/tutorial.js); 'done' once finished
    lastSeen: now,
  };
  giveStarterBoxes(state);
  state.ribbons = ribbonsForCollection(state.collection);
  return resetTransient(state);
}
