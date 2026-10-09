import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createState } from '../js/sim/state.js';
import { buildNav } from '../js/sim/nav.js';
import { placeOrder } from '../js/sim/orders.js';
import { startNextDay } from '../js/sim/day.js';
import { walkToBox, walkToFixture, tickKeeper } from '../js/sim/keeper.js';
import { pickUpBox, stockShelf, freeSlots, dropBox, BOX_SPOTS } from '../js/sim/stock.js';
import { boxCost, ITEMS } from '../js/data/items.js';

const run = (state, seconds = 8) => { for (let t = 0; t < seconds; t += 0.1) tickKeeper(state, 0.1); };
const shelves = (s) => s.building.rooms[0].fixtures.filter((f) => f.kind === 'shelf');

test('a new shop starts with two boxes to unpack, already in the Collection', () => {
  const s = createState();
  assert.equal(s.boxes.length, 2);
  assert.ok(s.collection.teaset && s.collection.chair);
  assert.notEqual(s.boxes[0].spot, s.boxes[1].spot);
});

test('ordering costs coins and the box arrives the next morning', () => {
  const s = createState();
  const before = s.coins;
  assert.ok(placeOrder(s, 'doll'));
  assert.equal(s.coins, before - boxCost('doll'));
  assert.equal(s.boxes.length, 2);
  startNextDay(s);
  assert.equal(s.day.number, 2);
  assert.equal(s.orders.length, 0);
  const box = s.boxes.find((b) => b.itemId === 'doll');
  assert.equal(box.qty, ITEMS.doll.perBox);
  assert.ok(s.collection.doll);
});

test('cannot order without enough coins', () => {
  const s = createState();
  s.coins = 5;
  assert.equal(placeOrder(s, 'cottage'), null);
  assert.equal(s.coins, 5);
});

test('pick up a box, carry it to a shelf, and the items fill the middle board first', () => {
  const s = createState();
  const nav = new Map([['r1', buildNav(s.building.rooms[0])]]);
  const box = s.boxes[0];
  walkToBox(s, nav, box);
  run(s);
  assert.equal(s.keeper.carrying?.id, box.id);
  assert.equal(s.boxes.length, 1);

  const shelf = shelves(s)[0];
  walkToFixture(s, nav, shelf, { type: 'stock', fixtureId: shelf.id });
  run(s);
  assert.equal(s.keeper.carrying, null);
  assert.deepEqual(shelf.slots.slice(3, 6), ['teaset', 'teaset', 'teaset']);
});

test('only one box at a time, and a full shelf keeps the rest in the box', () => {
  const s = createState();
  const [a, b] = s.boxes;
  assert.ok(pickUpBox(s, a.id));
  assert.equal(pickUpBox(s, b.id), false);

  const shelf = shelves(s)[0];
  shelf.slots.fill('doll');
  shelf.slots[0] = null;
  assert.equal(stockShelf(s, shelf.id), 1);
  assert.equal(s.keeper.carrying.qty, 2);
  assert.equal(freeSlots(shelf).length, 0);
  assert.equal(stockShelf(s, shelf.id), 0);
});

test('new boxes take the first free spot after one is picked up', () => {
  const s = createState();
  pickUpBox(s, s.boxes[0].id);
  placeOrder(s, 'teaset');
  startNextDay(s);
  assert.deepEqual(s.boxes.map((b) => b.spot).sort(), [0, 1]);
});

test('every box spot can be reached and picked up', () => {
  const s = createState();
  s.boxes = [];
  const nav = new Map([['r1', buildNav(s.building.rooms[0])]]);
  for (let i = 0; i < BOX_SPOTS.length; i++) {
    const box = dropBox(s, 'teaset', 3);
    s.keeper.carrying = null;
    walkToBox(s, nav, box);
    run(s);
    assert.equal(s.keeper.carrying?.id, box.id, `spot ${i}`);
  }
});
