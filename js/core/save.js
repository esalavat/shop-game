// Save/load with versioned migrations. Storage is injectable so this runs under node --test.

import { createState, giveStarterBoxes, STATE_VERSION } from '../sim/state.js';
import { defaultFixtures } from '../sim/building.js';
import { createKeeper } from '../sim/keeper.js';

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
    return migrate(data);
  } catch {
    return createState(); // corrupted save -> fresh start
  }
}

export function saveGame(state, storage = defaultStorage(), now = Date.now()) {
  state.lastSeen = now;
  try {
    storage?.setItem(SAVE_KEY, JSON.stringify(state));
    return true;
  } catch {
    return false; // private mode / quota: keep playing without saving
  }
}

export function clearSave(storage = defaultStorage()) {
  try { storage?.removeItem(SAVE_KEY); } catch { /* ignore */ }
}
