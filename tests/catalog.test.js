import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createState } from '../js/sim/state.js';
import { ITEMS, PAGES, SETS, boxProfit } from '../js/data/items.js';
import { openPageCount, canOrder, orderableItems, toNextPage } from '../js/sim/catalog.js';
import { placeOrder } from '../js/sim/orders.js';
import { startNextDay } from '../js/sim/day.js';
import { events } from '../js/core/events.js';

test('24 items: one per theme on every page, and fancier pages earn more per box', () => {
  assert.equal(Object.keys(ITEMS).length, 24);
  for (let page = 0; page < PAGES.length; page++) {
    const ids = Object.keys(ITEMS).filter((id) => ITEMS[id].page === page);
    assert.deepEqual(ids.map((id) => ITEMS[id].set).sort(), Object.keys(SETS).sort(), `page ${page}`);
    if (page > 0) {
      const prev = Object.keys(ITEMS).filter((id) => ITEMS[id].page === page - 1);
      assert.ok(Math.min(...ids.map(boxProfit)) > Math.max(...prev.map(boxProfit)), `page ${page} out-earns page ${page - 1}`);
    }
  }
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
