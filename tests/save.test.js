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

test('a v1 save upgrades: rooms get furniture and the shopkeeper appears', () => {
  const store = memoryStorage();
  const v1 = {
    version: 1, day: { number: 1, phase: 'morning' }, coins: 150, hearts: 0, sparkle: 0,
    building: { rooms: [{ id: 'r1', type: 'shop', col: 0, floor: 0 }, { id: 'r2', type: 'stock', col: 1, floor: 0 }] },
    shopkeeper: {}, settings: { muted: false }, lastSeen: 0,
  };
  store.setItem(SAVE_KEY, JSON.stringify(v1));
  const s = loadGame(store);
  assert.equal(s.version, STATE_VERSION);
  assert.equal(s.coins, 150);
  assert.ok(s.building.rooms[0].fixtures.some((f) => f.kind === 'counter'));
  assert.deepEqual(s.building.rooms[1].fixtures, []);
  assert.equal(s.keeper.roomId, 'r1');
});
