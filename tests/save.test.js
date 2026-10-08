import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadGame, saveGame, clearSave, SAVE_KEY } from '../js/core/save.js';
import { createState, STATE_VERSION } from '../js/sim/state.js';

function memoryStorage() {
  const m = new Map();
  return {
    getItem: (k) => (m.has(k) ? m.get(k) : null),
    setItem: (k, v) => m.set(k, String(v)),
    removeItem: (k) => m.delete(k),
  };
}

test('empty storage gives a fresh state', () => {
  const s = loadGame(memoryStorage());
  assert.equal(s.version, STATE_VERSION);
  assert.equal(s.building.rooms.length, 1);
});

test('save then load round-trips and stamps lastSeen', () => {
  const store = memoryStorage();
  const s = createState(0);
  s.coins = 123;
  saveGame(s, store, 5000);
  const loaded = loadGame(store);
  assert.equal(loaded.coins, 123);
  assert.equal(loaded.lastSeen, 5000);
});

test('corrupted save falls back to a fresh state', () => {
  const store = memoryStorage();
  store.setItem(SAVE_KEY, '{not json');
  assert.equal(loadGame(store).coins, createState().coins);
});

test('save from a newer version is not trusted', () => {
  const store = memoryStorage();
  store.setItem(SAVE_KEY, JSON.stringify({ version: STATE_VERSION + 1, coins: 999 }));
  assert.notEqual(loadGame(store).coins, 999);
});

test('clearSave removes the save', () => {
  const store = memoryStorage();
  saveGame(createState(), store);
  clearSave(store);
  assert.equal(store.getItem(SAVE_KEY), null);
});

test('saving survives a throwing storage', () => {
  const bad = { setItem() { throw new Error('quota'); } };
  assert.equal(saveGame(createState(), bad), false);
});
