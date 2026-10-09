import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadGame, saveGame, clearSave, isSaveLocked, SAVE_KEY, MAIN_SAVE_KEY } from '../js/core/save.js';
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

test('corrupted save falls back to a fresh state, keeping the broken one aside', () => {
  const store = memoryStorage();
  store.setItem(SAVE_KEY, '{not json');
  assert.equal(loadGame(store).coins, createState().coins);
  assert.equal(store.getItem(`${SAVE_KEY}_broken`), '{not json');
});

test('a save from a newer version is never overwritten by older code', () => {
  const store = memoryStorage();
  const newer = JSON.stringify({ version: STATE_VERSION + 1, coins: 999 });
  store.setItem(SAVE_KEY, newer);
  const s = loadGame(store);
  assert.notEqual(s.coins, 999);
  assert.ok(isSaveLocked(s));
  assert.equal(saveGame(s, store), false);
  assert.equal(store.getItem(SAVE_KEY), newer);
});

test('a save that fails to upgrade is kept aside', () => {
  const store = memoryStorage();
  const bad = JSON.stringify({ version: 0, coins: 5 }); // there is no migration from v0
  store.setItem(SAVE_KEY, bad);
  assert.equal(loadGame(store).version, STATE_VERSION);
  assert.equal(store.getItem(`${SAVE_KEY}_broken`), bad);
});

test('the test build starts from a copy of the main save and never writes it', () => {
  const store = memoryStorage();
  const main = createState(0);
  main.coins = 321;
  saveGame(main, store, 0, MAIN_SAVE_KEY);
  const before = store.getItem(MAIN_SAVE_KEY);
  const dev = loadGame(store, 'mdds_save_dev');
  assert.equal(dev.coins, 321);
  dev.coins = 5;
  saveGame(dev, store, 1, 'mdds_save_dev');
  assert.equal(store.getItem(MAIN_SAVE_KEY), before);
  assert.equal(loadGame(store, 'mdds_save_dev').coins, 5);
  assert.equal(loadGame(store, MAIN_SAVE_KEY).coins, 321);
});

test('a newer main save copied into the test build does not lock it', () => {
  const store = memoryStorage();
  store.setItem(MAIN_SAVE_KEY, JSON.stringify({ version: STATE_VERSION + 1 }));
  const dev = loadGame(store, 'mdds_save_dev');
  assert.ok(!isSaveLocked(dev));
  assert.equal(store.getItem('mdds_save_dev_broken'), null);
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

test('a v10 save has no stocker yet, and floating boxes settle on load', () => {
  const store = memoryStorage();
  const v10 = { ...createState(0), version: 10 };
  delete v10.stocker;
  v10.boxes = [{ id: 'b1', itemId: 'chair', qty: 3, roomId: v10.building.rooms[0].id, spot: 4 }];
  store.setItem(SAVE_KEY, JSON.stringify(v10));
  const s = loadGame(store);
  assert.equal(s.version, STATE_VERSION);
  assert.equal(s.stocker, null);
  assert.equal(s.boxes[0].spot, 0);
});

test('a v11 save keeps its shopkeeper as a girl', () => {
  const store = memoryStorage();
  const v11 = { ...createState(0), version: 11 };
  delete v11.shopkeeper.body;
  v11.shopkeeper.hair = 'pigtails';
  store.setItem(SAVE_KEY, JSON.stringify(v11));
  const s = loadGame(store);
  assert.equal(s.version, STATE_VERSION);
  assert.equal(s.shopkeeper.body, 'girl');
  assert.equal(s.shopkeeper.hair, 'pigtails');
});

test('a v12 save skips the first-day guide', () => {
  const store = memoryStorage();
  const v12 = { ...createState(0), version: 12 };
  delete v12.tutorial;
  store.setItem(SAVE_KEY, JSON.stringify(v12));
  const s = loadGame(store);
  assert.equal(s.version, STATE_VERSION);
  assert.equal(s.tutorial, 'done');
});

test('a v13 save lets Bea walk between rooms', () => {
  const store = memoryStorage();
  const v13 = { ...createState(0), version: 13, helpers: { stocker: true }, stocker: { roomId: 'r1', x: 1.4, z: 0.7, facing: 0, path: [], arriveFacing: null, carrying: null, spare: null, job: null, timer: 0 } };
  store.setItem(SAVE_KEY, JSON.stringify(v13));
  const s = loadGame(store);
  assert.equal(s.version, STATE_VERSION);
  assert.equal(s.stocker.arriveRoom, null);
  assert.equal(s.stocker.x, 1.4);
});

test('a v13 save without Bea stays without her', () => {
  const store = memoryStorage();
  store.setItem(SAVE_KEY, JSON.stringify({ ...createState(0), version: 13 }));
  assert.equal(loadGame(store).stocker, null);
});
