import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createState } from '../js/sim/state.js';
import { ITEMS, PAGES, SETS, STEPS, ROUNDS, boxProfit, stepOf, colorsOf } from '../js/data/items.js';
import { openPageCount, canOrder, orderableItems, toNextPage, roundOpen } from '../js/sim/catalog.js';
import { placeOrder } from '../js/sim/orders.js';
import { startNextDay } from '../js/sim/day.js';
import { events } from '../js/core/events.js';

test('24 items in three colors: one per theme on every page of every round, and each step earns more per box', () => {
  assert.equal(Object.keys(ITEMS).length, 24 * ROUNDS.length);
  assert.equal(Object.keys(SETS).length, 6 * ROUNDS.length);
  for (let step = 0; step < STEPS.length; step++) {
    const ids = Object.keys(ITEMS).filter((id) => stepOf(id) === step);
    const round = STEPS[step].round;
    assert.equal(ids.length, 6, `step ${step}`);
    assert.equal(new Set(ids.map((id) => ITEMS[id].set)).size, 6, `step ${step}: one per theme`);
    assert.ok(ids.every((id) => ITEMS[id].round === round));
    if (step > 0) {
      const prev = Object.keys(ITEMS).filter((id) => stepOf(id) === step - 1);
      assert.ok(Math.min(...ids.map(boxProfit)) > Math.max(...prev.map(boxProfit)), `step ${step} out-earns step ${step - 1}`);
      assert.ok(STEPS[step].opensAt > STEPS[step - 1].opensAt);
    }
  }
});

test('color rounds: ×16 prices, a new color for each, and Bright opens once all 24 are found (GDD #77)', () => {
  assert.equal(ITEMS.teaset2.price, ITEMS.teaset.price * 16);
  assert.equal(ITEMS.castle3.cost, ITEMS.castle.cost * 256);
  assert.deepEqual(colorsOf('cottage2'), ['cottage', 'cottage2', 'cottage3']);
  assert.equal(ITEMS.chair2.set, 'parlor2');
  assert.notEqual(ITEMS.chair2.color, ITEMS.chair.color);
  // Each round's cheapest item sells for more than the last round's dearest.
  for (let round = 1; round < ROUNDS.length; round++) {
    const price = (r) => Object.values(ITEMS).filter((i) => i.round === r).map((i) => i.price);
    assert.ok(Math.min(...price(round)) > Math.max(...price(round - 1)));
  }
  const s = createState();
  for (const id of Object.keys(ITEMS)) if (ITEMS[id].round === 0 && id !== 'castle') s.collection[id] = true;
  assert.ok(!roundOpen(s, 1));
  assert.ok(!canOrder(s, 'teaset2'));
  assert.equal(openPageCount(s), PAGES.length);
  s.coins = 10000;
  const opened = [];
  const off = events.on('pageOpened', ({ page }) => opened.push(page));
  placeOrder(s, 'castle');
  startNextDay(s);
  off();
  assert.deepEqual(opened, [PAGES.length]);
  assert.ok(roundOpen(s, 1));
  assert.ok(canOrder(s, 'teaset2'));
  assert.ok(!canOrder(s, 'cupcakes2'));
  assert.ok(!canOrder(s, 'teaset3'));
});

test('a new shop can only order from the first page', () => {
  const s = createState();
  assert.equal(openPageCount(s), 1);
  s.coins = 10000;
  assert.equal(placeOrder(s, 'castle'), null);
  assert.ok(placeOrder(s, 'teddy'));
  assert.ok(orderableItems(s).every((id) => ITEMS[id].page === 0));
  assert.deepEqual(toNextPage(s), { page: 1, need: PAGES[1].opensAt - 2 });
});

test('finding enough items opens the next page, with an event', () => {
  const s = createState();
  s.coins = 10000;
  const opened = [];
  let delivered;
  const offs = [events.on('pageOpened', ({ page }) => opened.push(page)), events.on('dayStarted', (e) => (delivered = e.delivered))];
  placeOrder(s, 'teddy');
  placeOrder(s, 'lamp');
  startNextDay(s);
  offs.forEach((off) => off());
  assert.deepEqual(opened, [1]);
  assert.deepEqual(delivered.opened, [1]);
  assert.ok(canOrder(s, 'cottage'));
  assert.ok(!canOrder(s, 'castle'));
});

test('items already found can always be ordered again', () => {
  const s = createState();
  s.collection.cottage = true; // found before catalog pages existed
  s.coins = 10000;
  assert.ok(canOrder(s, 'cottage'));
  assert.ok(placeOrder(s, 'cottage'));
});

test('customers only wish for things you can order', async () => {
  const { spawnCustomer } = await import('../js/sim/customers.js');
  const s = createState();
  for (let i = 0; i < 200; i++) {
    const c = spawnCustomer(s);
    assert.ok(c.wants.every((id) => canOrder(s, id)), c.wants.join());
  }
});
