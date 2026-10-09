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

test('a v4 save takes the Dream Dollhouse out of the shop and keeps shelf stock', () => {
  const store = memoryStorage();
  const v4 = {
    version: 4, nextId: 9, day: { number: 3, phase: 'morning' }, coins: 80, hearts: 2, sparkle: 0,
    building: { rooms: [{ id: 'r1', type: 'shop', col: 0, floor: 0, fixtures: [
      { id: 'r1-f1', kind: 'shelf', x: -0.95, z: -1.06, slots: ['doll', null, null, null, null, null, null, null, null] },
      { id: 'r1-f2', kind: 'shelf', x: 0.25, z: -1.06, slots: [null, 'bed', null, null, null, null, null, null, null] },
      { id: 'r1-f4', kind: 'pedestal', x: 1.15, z: 0.85 },
    ] }] },
    keeper: { roomId: 'r1', x: 0, z: 0, facing: 0, path: [], carrying: null },
    orders: [], boxes: [], collection: {}, wishes: [], shopkeeper: {}, settings: {}, lastSeen: 0,
  };
  store.setItem(SAVE_KEY, JSON.stringify(v4));
  const s = loadGame(store);
  const shop = s.building.rooms.find((r) => r.type === 'shop');
  assert.ok(!shop.fixtures.some((f) => f.kind === 'pedestal'));
  const shelves = shop.fixtures.filter((f) => f.slots);
  assert.equal(shelves[0].slots[0], 'doll');
  assert.equal(shelves[1].slots[1], 'bed');
  assert.equal(s.building.rooms.length, 1);
});

test('a v6 save gets an empty Dream Dollhouse and no Sparkle', () => {
  const store = memoryStorage();
  const v6 = {
    ...createState(0), version: 6, sparkle: 3,
    day: { number: 4, phase: 'close', time: 0, stats: { coins: 0, tips: 0, served: 0, hearts: 0, sold: {}, wishes: [] } },
  };
  delete v6.dollhouse;
  store.setItem(SAVE_KEY, JSON.stringify(v6));
  const s = loadGame(store);
  assert.equal(s.version, STATE_VERSION);
  assert.deepEqual(s.dollhouse, { slots: {} });
  assert.equal(s.sparkle, 0);
  assert.equal(s.day.number, 4);
});

test('the Dream Dollhouse round-trips through a save', () => {
  const store = memoryStorage();
  const s = createState(0);
  s.dollhouse.slots.tearoom = 'teaset';
  s.sparkle = 3;
  saveGame(s, store);
  const loaded = loadGame(store);
  assert.equal(loaded.dollhouse.slots.tearoom, 'teaset');
  assert.equal(loaded.sparkle, 3);
});

test('a v7 save gets upgrades, helpers, an accessory, and sees the creator once', () => {
  const store = memoryStorage();
  const v7 = { ...createState(0), version: 7, shopkeeper: { hair: 'bob', hairColor: '#6b3e2e', skin: '#e0a37c', outfit: '#ff9ec4' } };
  delete v7.upgrades;
  delete v7.helpers;
  delete v7.keeper.spare;
  store.setItem(SAVE_KEY, JSON.stringify(v7));
  const s = loadGame(store);
  assert.equal(s.version, STATE_VERSION);
  assert.deepEqual(s.upgrades, {});
  assert.deepEqual(s.helpers, {});
  assert.equal(s.shopkeeper.hair, 'bob');
  assert.equal(s.shopkeeper.accessory, 'none');
  assert.equal(s.shopkeeper.created, false);
  assert.equal(s.keeper.spare, null);
  assert.equal(s.cashier, null);
});

test('a v8 save lets the shopkeeper walk between rooms', () => {
  const store = memoryStorage();
  const v8 = { ...createState(0), version: 8 };
  delete v8.keeper.arriveRoom;
  store.setItem(SAVE_KEY, JSON.stringify(v8));
  const s = loadGame(store);
  assert.equal(s.version, STATE_VERSION);
  assert.equal(s.keeper.arriveRoom, null);
});

test('a v9 save gets a best day of zero and keeps its mute setting', () => {
  const store = memoryStorage();
  const v9 = { ...createState(0), version: 9, settings: { muted: true } };
  delete v9.best;
  store.setItem(SAVE_KEY, JSON.stringify(v9));
  const s = loadGame(store);
  assert.equal(s.version, STATE_VERSION);
  assert.deepEqual(s.best, { coins: 0 });
  assert.equal(s.settings.muted, true);
});
