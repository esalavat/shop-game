// The whole game state: one plain, JSON-serializable object.
// Bump STATE_VERSION and add a migration in core/save.js whenever its shape changes.

import { makeRoom } from './building.js';
import { createKeeper } from './keeper.js';
import { dropBox } from './stock.js';

export const STATE_VERSION = 5;

/** Live-only fields: never saved, reset on every load (customers just walk in again). */
export const TRANSIENT = ['customers', 'queue', 'checkout', 'spawnTimer'];

export function resetTransient(state) {
  state.customers = [];
  state.queue = [];
  state.checkout = null;
  state.spawnTimer = 2; // first visitor shortly after opening
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
    day: { number: 1, phase: 'morning' },
    coins: 50,
    hearts: 0,
    sparkle: 0,
    building: {
      rooms: [makeRoom('r1', 'shop', 0, 0)],
    },
    keeper: createKeeper('r1'),
    orders: [],
    boxes: [],
    collection: {},
    wishes: [],
    shopkeeper: { hair: 'bun', hairColor: '#c2563a', skin: '#ffd9c2', outfit: '#9fe0c8' },
    settings: { muted: false },
    lastSeen: now,
  };
  giveStarterBoxes(state);
  return resetTransient(state);
}
