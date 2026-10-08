// Save/load with versioned migrations. Storage is injectable so this runs under node --test.

import { createState, STATE_VERSION } from '../sim/state.js';

export const SAVE_KEY = 'mdds_save';

// MIGRATIONS[n] upgrades a version-n save to version n+1.
const MIGRATIONS = {};

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
