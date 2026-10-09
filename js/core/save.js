// Save/load with versioned migrations. Storage is injectable so this runs under node --test.
//
// Progress must never be lost (docs/TECH.md §9.4):
// - The public game and the test build at /dev/ share one origin, so each keeps its own save key.
//   The test build starts from a copy of the real save and never writes the real one.
// - A save from a newer version (an old cached page after an update) loads but is never saved
//   over: the old code can't read it, and a refresh brings the code that can.
// - Before a save is upgraded, the original is kept under `<key>_v<n>`; a save that can't be read
//   at all is kept under `<key>_broken` before starting over.

import { createState, giveStarterBoxes, resetTransient, STATE_VERSION, TRANSIENT } from '../sim/state.js';
import { defaultFixtures } from '../sim/building.js';
import { createKeeper } from '../sim/keeper.js';
import { emptyStats } from '../sim/day.js';
import { settleBoxes } from '../sim/stock.js';
import { CHANNEL } from './channel.js';

export const MAIN_SAVE_KEY = 'mdds_save';
export const SAVE_KEY = CHANNEL === 'main' ? MAIN_SAVE_KEY : `${MAIN_SAVE_KEY}_${CHANNEL}`;

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
  // v9: the shopkeeper can walk to other rooms and the street (keeper.arriveRoom while on the way).
  8: (d) => ({ ...d, version: 9, keeper: { ...d.keeper, arriveRoom: null } }),
  // v10: the best day's coins (end-of-day record); every save gets settings (mute).
  9: (d) => ({ ...d, version: 10, best: { coins: 0 }, settings: { muted: false, ...d.settings } }),
  // v11: Bea the stocker (state.stocker, once hired: where she is and the boxes she holds).
  10: (d) => ({ ...d, version: 11, stocker: null }),
  // v12: girl or boy shopkeeper (GDD #43); everyone so far made a girl.
  11: (d) => ({ ...d, version: 12, shopkeeper: { body: 'girl', ...d.shopkeeper } }),
  // v13: the first-day guide (GDD #57), for new games only: existing shops already know the way.
  12: (d) => ({ ...d, version: 13, tutorial: 'done' }),
  // v14: Bea can walk to other rooms (stocker.arriveRoom while on the way; GDD #58).
  13: (d) => ({ ...d, version: 14, stocker: d.stocker && { ...d.stocker, arriveRoom: null } }),
  // v15: the Stairwell and upstairs rooms (GDD #58): walks come in legs (keeper.legs, up the stairs,
  // ...) and people have a height on the stairs (y).
  14: (d) => ({
    ...d,
    version: 15,
    keeper: { ...d.keeper, legs: [], y: 0 },
    stocker: d.stocker && { ...d.stocker, legs: [], y: 0 },
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

// States loaded from a newer save; saveGame leaves the save alone for these.
const locked = new WeakSet();

/** True when the save on this device is from a newer version of the game than this code. */
export const isSaveLocked = (state) => locked.has(state);

function keep(storage, key, raw) {
  try { storage.setItem(key, raw); } catch { /* quota: nothing more we can do */ }
}

export function loadGame(storage = defaultStorage(), key = SAVE_KEY) {
  let raw = null, own = true;
  try {
    raw = storage?.getItem(key) ?? null;
    if (raw === null && key !== MAIN_SAVE_KEY) {
      raw = storage?.getItem(MAIN_SAVE_KEY) ?? null; // a test build starts from a copy of the real save
      own = false;
    }
  } catch { /* storage blocked: play without a save */ }
  if (raw === null) return createState();

  let data;
  try {
    data = JSON.parse(raw);
    if (typeof data?.version !== 'number') throw new Error('not a save');
  } catch {
    if (own) keep(storage, `${key}_broken`, raw);
    return createState();
  }
  if (data.version > STATE_VERSION) {
    const state = createState();
    if (own) locked.add(state);
    return state;
  }
  try {
    if (own && data.version < STATE_VERSION) keep(storage, `${key}_v${data.version}`, raw);
    const state = resetTransient(migrate(data));
    settleBoxes(state); // older saves could have a box floating over an empty spot
    return state;
  } catch {
    if (own) keep(storage, `${key}_broken`, raw);
    return createState();
  }
}

export function saveGame(state, storage = defaultStorage(), now = Date.now(), key = SAVE_KEY) {
  if (locked.has(state)) return false;
  state.lastSeen = now;
  try {
    const saved = { ...state };
    for (const k of TRANSIENT) delete saved[k];
    storage?.setItem(key, JSON.stringify(saved));
    return true;
  } catch {
    return false; // private mode / quota: keep playing without saving
  }
}

export function clearSave(storage = defaultStorage(), key = SAVE_KEY) {
  try { storage?.removeItem(key); } catch { /* ignore */ }
}
