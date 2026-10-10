import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createState } from '../js/sim/state.js';
import { ITEMS, PAGES, SETS, STEPS, ROUNDS, boxProfit, stepOf, colorsOf } from '../js/data/items.js';
import { openPageCount, canOrder, orderableItems, toNextPage, roundOpen, notePagesOpen } from '../js/sim/catalog.js';
import { placeOrder } from '../js/sim/orders.js';
import { startNextDay } from '../js/sim/day.js';
import { events } from '../js/core/events.js';

test('32 items in three colors: one per theme on every page of every round, and each step earns more per box', () => {
  assert.equal(Object.keys(ITEMS).length, 32 * ROUNDS.length);
  assert.equal(Object.keys(SETS).length, 8 * ROUNDS.length);
  for (let step = 0; step < STEPS.length; step++) {
    const ids = Object.keys(ITEMS).filter((id) => stepOf(id) === step);
    const round = STEPS[step].round;
    assert.equal(ids.length, 8, `step ${step}`);
    assert.equal(new Set(ids.map((id) => ITEMS[id].set)).size, 8, `step ${step}: one per theme`);
    assert.ok(ids.every((id) => ITEMS[id].round === round));
    if (step > 0) {
      const prev = Object.keys(ITEMS).filter((id) => stepOf(id) === step - 1);
      assert.ok(Math.min(...ids.map(boxProfit)) > Math.max(...prev.map(boxProfit)), `step ${step} out-earns step ${step - 1}`);
      assert.ok(STEPS[step].opensAt > STEPS[step - 1].opensAt);
    }
  }
});

test('color rounds: ×12 prices, a new color for each, and Bright opens once all 32 are found (GDD #77, #80)', () => {
  assert.equal(ITEMS.teaset2.price, ITEMS.teaset.price * 12);
  assert.equal(ITEMS.castle3.cost, ITEMS.castle.cost * 144);
  assert.ok(ITEMS.castle3.sparkle > ITEMS.castle2.sparkle && ITEMS.castle2.sparkle > ITEMS.castle.sparkle, 'bolder colors sparkle more');
  assert.deepEqual(colorsOf('cottage2'), ['cottage', 'cottage2', 'cottage3']);
  assert.equal(ITEMS.chair2.set, 'parlor2');
  assert.notEqual(ITEMS.chair2.color, ITEMS.chair.color);
  // Each round's cheapest box earns more than the last round's best (GDD #79; single items may not, since #80).
  for (let round = 1; round < ROUNDS.length; round++) {
    const profit = (r) => Object.keys(ITEMS).filter((id) => ITEMS[id].round === r).map(boxProfit);
    assert.ok(Math.min(...profit(round)) > Math.max(...profit(round - 1)));
  }
  const s = createState();
  s.hearts = STEPS[PAGES.length].hearts; // enough happy customers for Bright (GDD #80)
  for (const id of Object.keys(ITEMS)) if (ITEMS[id].round === 0 && id !== 'castle') s.collection[id] = true;
  notePagesOpen(s); // as if found one delivery at a time
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
  assert.deepEqual(toNextPage(s), { page: 1, need: PAGES[1].opensAt - 2, hearts: STEPS[1].hearts });
});

test('finding enough items opens the next page, with an event', () => {
  const s = createState();
  s.coins = 10000;
  s.hearts = STEPS[1].hearts;
  const opened = [];
  let delivered;
  const offs = [events.on('pageOpened', ({ page }) => opened.push(page)), events.on('dayStarted', (e) => (delivered = e.delivered))];
  placeOrder(s, 'teddy');
  placeOrder(s, 'lamp');
  placeOrder(s, 'kitten');
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

test('an opened page stays open, even with fewer finds than it needs now (GDD #79)', () => {
  const s = createState();
  s.pagesOpen = 5; // e.g. opened under the old thresholds
  assert.ok(canOrder(s, 'cupcakes') && canOrder(s, 'castle'));
  assert.ok(canOrder(s, 'lollipops2') && !canOrder(s, 'gumdrops2'));
  assert.ok(roundOpen(s, 1));
  assert.ok(toNextPage(s).need >= 1);
});

test('the order book lists each page cheapest first', () => {
  for (let page = 0; page < PAGES.length; page++) {
    const prices = Object.values(ITEMS).filter((i) => i.round === 0 && i.page === page).map((i) => i.price);
    assert.deepEqual(prices, [...prices].sort((a, b) => a - b), `page ${page}`);
  }
});

test('each page also needs happy customers, and opens on the sale that makes enough (GDD #80)', async () => {
  const { startCheckout, scanNext, completeSale } = await import('../js/sim/checkout.js');
  const { needText } = await import('../js/sim/catalog.js');
  for (let step = 1; step < STEPS.length; step++) assert.ok(STEPS[step].hearts > STEPS[step - 1].hearts, `step ${step} needs more Hearts`);
  const s = createState();
  for (const id of ['teddy', 'lamp', 'kitten']) s.collection[id] = true; // enough finds for page 2...
  assert.equal(openPageCount(s), 1, '...but not enough Hearts');
  assert.deepEqual(toNextPage(s), { page: 1, need: 0, hearts: STEPS[1].hearts });
  assert.equal(needText(s, 1), `Make ${STEPS[1].hearts} more customers happy ❤️`);
  s.hearts = STEPS[1].hearts - 1;
  const c = { id: 'c1', basket: ['teaset'], state: 'queued' };
  s.customers.push(c);
  startCheckout(s, c);
  scanNext(s);
  const opened = [];
  const off = events.on('pageOpened', ({ page }) => opened.push(page));
  completeSale(s, () => 0);
  off();
  assert.deepEqual(opened, [1]);
  assert.ok(canOrder(s, 'cottage'));
  assert.equal(needText(createState(), 1), `Find 3 new items and make ${STEPS[1].hearts} more customers happy ❤️`);
});
