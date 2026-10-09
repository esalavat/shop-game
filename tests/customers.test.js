import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createState } from '../js/sim/state.js';
import { buildNav } from '../js/sim/nav.js';
import { spawnCustomer, tickCustomers, QUEUE_SPOTS } from '../js/sim/customers.js';
import { checkoutTap, keeperAtCounter } from '../js/sim/checkout.js';
import { rng } from '../js/core/rng.js';
import { events } from '../js/core/events.js';
import { ITEMS } from '../js/data/items.js';
import { loadGame, saveGame } from '../js/core/save.js';

const setup = () => {
  const s = createState();
  s.spawnTimer = Infinity; // spawn by hand
  const navs = new Map(s.building.rooms.map((r) => [r.id, buildNav(r)]));
  const shelves = s.building.rooms[0].fixtures.filter((f) => f.slots);
  return { s, navs, shelves };
};
const run = (s, navs, seconds, rand) => { for (let t = 0; t < seconds; t += 0.1) tickCustomers(s, navs, 0.1, rand); };
const customerWanting = (s, itemId, rand) => {
  const c = spawnCustomer(s, rand);
  c.wants = [itemId];
  return c;
};

test('a customer takes a stocked item off the shelf and lines up at the counter', () => {
  const { s, navs, shelves } = setup();
  shelves[0].slots[4] = 'doll';
  s.keeper.x = 0; s.keeper.z = 0.3; // away from the counter, so they wait in line
  const rand = rng(1);
  const c = customerWanting(s, 'doll', rand);
  run(s, navs, 12, rand);
  assert.deepEqual(c.basket, ['doll']);
  assert.equal(shelves[0].slots[4], null);
  assert.equal(c.state, 'queued');
  assert.ok(Math.hypot(c.x - QUEUE_SPOTS[0].x, c.z - QUEUE_SPOTS[0].z) < 1e-6);
});

test('checkout: scan each item, then ring up for price + tip and a heart', () => {
  const { s, navs, shelves } = setup();
  shelves[0].slots[4] = 'doll';
  const rand = rng(2);
  const c = customerWanting(s, 'doll', rand);
  assert.ok(keeperAtCounter(s), 'shopkeeper starts behind the counter');
  run(s, navs, 12, rand);
  assert.equal(c.state, 'paying');
  const coins = s.coins;
  assert.equal(checkoutTap(s, rand), 'scanned');
  assert.equal(checkoutTap(s, rand), 'sold');
  assert.ok(s.coins >= coins + ITEMS.doll.price + 1 && s.coins <= coins + ITEMS.doll.price + 3);
  assert.equal(s.hearts, 1);
  run(s, navs, 12, rand);
  assert.equal(s.customers.length, 0, 'they walk out');
  assert.equal(s.queue.length, 0);
});

test('nobody is served while the shopkeeper is away from the counter', () => {
  const { s, navs, shelves } = setup();
  shelves[0].slots[4] = 'doll';
  s.keeper.x = 0; s.keeper.z = 0.3;
  const rand = rng(3);
  customerWanting(s, 'doll', rand);
  run(s, navs, 15, rand);
  assert.equal(s.checkout, null);
  assert.equal(s.customers[0].state, 'queued');
});

test('wanting something not on the shelves leaves a wish note, never a grumpy customer', () => {
  const { s, navs } = setup();
  const rand = rng(4);
  let wished = null;
  const off = events.on('wish', (e) => (wished = e.itemId));
  customerWanting(s, 'cottage', rand);
  run(s, navs, 20, rand);
  off();
  assert.equal(wished, 'cottage');
  assert.deepEqual(s.wishes.map((w) => w.itemId), ['cottage']);
  assert.equal(s.customers.length, 0, 'they head home');
});

test('two customers never grab the same item', () => {
  const { s, navs, shelves } = setup();
  shelves[0].slots[4] = 'doll';
  const rand = rng(5);
  const a = customerWanting(s, 'doll', rand);
  const b = customerWanting(s, 'doll', rand);
  run(s, navs, 25, rand);
  assert.equal(a.basket.length + b.basket.length, 1);
  assert.equal(s.wishes.length, 1);
});

test('the line moves up after a sale', () => {
  const { s, navs, shelves } = setup();
  shelves[0].slots[3] = 'doll';
  shelves[0].slots[4] = 'doll';
  const rand = rng(6);
  customerWanting(s, 'doll', rand);
  const second = customerWanting(s, 'doll', rand);
  run(s, navs, 20, rand);
  checkoutTap(s, rand);
  checkoutTap(s, rand);
  run(s, navs, 10, rand);
  assert.equal(s.queue[0], second.id);
  assert.equal(second.state, 'paying');
});

test('customers are not saved; they simply walk in again after a reload', () => {
  const { s } = setup();
  spawnCustomer(s, rng(7));
  const store = new Map();
  const storage = { getItem: (k) => store.get(k) ?? null, setItem: (k, v) => store.set(k, v) };
  saveGame(s, storage);
  const loaded = loadGame(storage);
  assert.deepEqual(loaded.customers, []);
  assert.equal(loaded.checkout, null);
  assert.ok(!JSON.parse(store.get('mdds_save')).customers);
});

test('a customer who has shopped for far too long gives up and pays for what they have', () => {
  const { s, navs, shelves } = setup();
  const rand = rng(11);
  const c = spawnCustomer(s, rand);
  c.wants = ['doll'];
  c.basket = ['chair'];
  Object.assign(c, { state: 'browsing', timer: 1e9, path: [], arriveRoom: null, x: 0, z: -0.44, age: 1e4 });
  tickCustomers(s, navs, 0.1, rand);
  assert.equal(c.wants.length, 0);
  assert.ok(['toQueue', 'queued'].includes(c.state));
  assert.ok(s.queue.includes(c.id));
});
