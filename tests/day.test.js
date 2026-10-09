import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createState } from '../js/sim/state.js';
import { buildNav } from '../js/sim/nav.js';
import { openShop, tickDay, startNextDay, twilightFor, closeEarly, soldOut, DAY_LENGTH } from '../js/sim/day.js';
import { tickCustomers, spawnCustomer } from '../js/sim/customers.js';
import { checkoutTap } from '../js/sim/checkout.js';
import { events } from '../js/core/events.js';
import { rng } from '../js/core/rng.js';
import { ITEMS } from '../js/data/items.js';

const navsFor = (s) => new Map(s.building.rooms.map((r) => [r.id, buildNav(r)]));
const run = (s, navs, seconds, rand = rng(1)) => {
  for (let t = 0; t < seconds; t += 0.1) { tickCustomers(s, navs, 0.1, rand); tickDay(s, 0.1); }
};

test('mornings are untimed and quiet until you open the shop', () => {
  const s = createState();
  run(s, navsFor(s), 60);
  assert.equal(s.day.phase, 'morning');
  assert.equal(s.customers.length, 0);
});

test('open -> evening -> close, with the light fading to twilight', () => {
  const s = createState();
  const navs = navsFor(s);
  s.spawnTimer = Infinity; // no visitors, just the clock
  assert.ok(openShop(s));
  assert.equal(twilightFor(s.day), 0);
  run(s, navs, DAY_LENGTH.open + 0.1);
  assert.equal(s.day.phase, 'evening');
  run(s, navs, DAY_LENGTH.evening / 2);
  assert.ok(Math.abs(twilightFor(s.day) - 0.5) < 0.05);
  let closed = null;
  const off = events.on('dayClosed', (e) => (closed = e));
  run(s, navs, DAY_LENGTH.evening);
  off();
  assert.equal(s.day.phase, 'close');
  assert.equal(closed.day, 1);
  assert.equal(twilightFor(s.day), 1);
});

test('an empty shop closes right after the short twilight', () => {
  const s = createState();
  const navs = navsFor(s);
  s.spawnTimer = Infinity;
  openShop(s);
  closeEarly(s);
  run(s, navs, DAY_LENGTH.evening - 0.5);
  assert.equal(s.day.phase, 'evening', 'twilight still showing');
  run(s, navs, 0.6);
  assert.equal(s.day.phase, 'close');
});

test('customers only arrive while the shop is open', () => {
  const s = createState();
  const navs = navsFor(s);
  openShop(s);
  s.spawnTimer = 0;
  run(s, navs, 0.2);
  assert.equal(s.customers.length, 1);
  s.day.phase = 'evening';
  s.spawnTimer = 0;
  run(s, navs, 0.2);
  assert.equal(s.customers.length, 1);
});

test('closing waits for the last customer to leave', () => {
  const s = createState();
  const navs = navsFor(s);
  s.building.rooms[0].fixtures.find((f) => f.slots).slots[4] = 'doll';
  s.day.phase = 'evening';
  s.day.time = DAY_LENGTH.evening;
  s.spawnTimer = Infinity;
  const c = spawnCustomer(s, rng(2));
  c.wants = ['doll'];
  run(s, navs, 20);
  assert.equal(s.day.phase, 'evening', 'still waiting on a customer in line');
  checkoutTap(s);
  checkoutTap(s);
  run(s, navs, 15);
  assert.equal(s.day.phase, 'close');
});

test("the day's tally counts sales, tips, items and wish notes; a new day starts fresh", () => {
  const s = createState();
  const navs = navsFor(s);
  s.building.rooms[0].fixtures.find((f) => f.slots).slots[4] = 'doll';
  openShop(s);
  s.spawnTimer = Infinity;
  const rand = rng(3);
  const buyer = spawnCustomer(s, rand);
  buyer.wants = ['doll'];
  const wisher = spawnCustomer(s, rand);
  wisher.wants = ['cottage'];
  run(s, navs, 20, rand);
  checkoutTap(s, rand);
  checkoutTap(s, rand);
  const st = s.day.stats;
  assert.equal(st.served, 1);
  assert.equal(st.coins, ITEMS.doll.price + st.tips);
  assert.deepEqual(st.sold, { doll: 1 });
  assert.deepEqual(st.wishes, ['cottage']);

  s.day.phase = 'close';
  startNextDay(s);
  assert.equal(s.day.number, 2);
  assert.equal(s.day.phase, 'morning');
  assert.equal(s.day.stats.served, 0);
});

test('you can close early; it goes to evening so the last customers still finish', () => {
  const s = createState();
  assert.equal(closeEarly(s), false, 'not before opening');
  openShop(s);
  assert.ok(closeEarly(s));
  assert.equal(s.day.phase, 'evening');
  assert.equal(s.day.time, 0);
});

test('sold out means empty shelves, no boxes waiting, nothing being carried', () => {
  const s = createState();
  assert.equal(soldOut(s), false, 'starter boxes are waiting');
  s.boxes = [];
  assert.equal(soldOut(s), true);
  s.building.rooms[0].fixtures.find((f) => f.slots).slots[0] = 'doll';
  assert.equal(soldOut(s), false);
});
