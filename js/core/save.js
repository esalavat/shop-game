// Save/load with versioned migrations. Storage is injectable so this runs under node --test.

import { createState, giveStarterBoxes, resetTransient, STATE_VERSION, TRANSIENT } from '../sim/state.js';
import { defaultFixtures } from '../sim/building.js';
import { createKeeper } from '../sim/keeper.js';
import { emptyStats } from '../sim/day.js';

export const SAVE_KEY = 'mdds_save';

// MIGRATIONS[n] upgrades a version-n save to version n+1.
const MIGRATIONS = {
  // v2: rooms get furniture; the shopkeeper gets a position.
  1: (d) => ({
    ...d,
    version: 2,
    building: { ...d.building, rooms: d.building.rooms.map((r) => ({ ...r, fixtures: defaultFixtures(r.type, r.id) })) },
    keeper: createKeeper(d.building.rooms[0].id),
  }),
  // v3: shelves hold items; orders, delivery boxes and the Collection exist.
  // Furniture resets to the new layout (counter left, Dream Dollhouse by the window); nothing was stocked yet.
  2: (d) => {
    const next = {
      ...d,
      version: 3,
      nextId: 1,
      building: { ...d.building, rooms: d.building.rooms.map((r) => ({ ...r, fixtures: defaultFixtures(r.type, r.id) })) },
      keeper: createKeeper(d.keeper.roomId),
      orders: [],
      boxes: [],
      collection: {},
    };
    giveStarterBoxes(next);
    return next;
  },
  // v4: customers can leave wish notes.
  3: (d) => ({ ...d, version: 4, wishes: [] }),
  // v5: the Dream Dollhouse leaves the shop (it returns later as its own Window Display room when
  // the shop grows), and the shop is rearranged: two shelves right of the counter. Stock carries over.
  4: (d) => {
    const rooms = d.building.rooms.map((r) => {
      if (r.type !== 'shop') return r;
      const oldShelves = r.fixtures.filter((f) => f.slots);
      const fixtures = defaultFixtures('shop', r.id);
      fixtures.filter((f) => f.slots).forEach((f, i) => { if (oldShelves[i]) f.slots = [...oldShelves[i].slots]; });
      return { ...r, fixtures };
    });
    return { ...d, version: 5, building: { ...d.building, rooms }, keeper: createKeeper(d.keeper.roomId) };
  },
  // v6: real shop days with a clock and a daily tally. Old saves wake up on a fresh morning.
  5: (d) => ({ ...d, version: 6, day: { number: d.day.number, phase: 'morning', time: 0, stats: emptyStats() } }),
  // v7: the Dream Dollhouse gets decorating slots; Sparkle comes from what's placed in it (none yet).
  6: (d) => ({ ...d, version: 7, dollhouse: { slots: {} }, sparkle: 0 }),
  // v8: upgrades and helpers; the shopkeeper gets an accessory, a second box spot (the Stock Cart),
  // and the creator shows once for existing shops.
  7: (d) => ({
    ...d,
    version: 8,
    upgrades: {},
    helpers: {},
    shopkeeper: { accessory: 'none', ...d.shopkeeper, created: false },
    keeper: { ...d.keeper, spare: null },
  }),
};

export function migrate(data) {
  let d = data;
  while (d.version < STATE_VERSION) {
    const step = MIGRATIONS[d.version];
    if (!step) throw new Error(`No migration from save version ${d.version}`);
    d = step(d);
  }
  return d;
}

const defaultStorage = () => globalThis.localStorage;

export function loadGame(storage = defaultStorage()) {
  try {
    const raw = storage?.getItem(SAVE_KEY);
    if (!raw) return createState();
    const data = JSON.parse(raw);
    if (typeof data?.version !== 'number' || data.version > STATE_VERSION) return createState();
    return resetTransient(migrate(data));
  } catch {
    return createState(); // corrupted save -> fresh start
  }
}

export function saveGame(state, storage = defaultStorage(), now = Date.now()) {
  state.lastSeen = now;
  try {
    const saved = { ...state };
    for (const key of TRANSIENT) delete saved[key];
    storage?.setItem(SAVE_KEY, JSON.stringify(saved));
    return true;
  } catch {
    return false; // private mode / quota: keep playing without saving
  }
}

export function clearSave(storage = defaultStorage()) {
  try { storage?.removeItem(SAVE_KEY); } catch { /* ignore */ }
}
