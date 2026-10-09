import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createState } from '../js/sim/state.js';
import { buildNav } from '../js/sim/nav.js';
import { openShop, tickDay, startNextDay, twilightFor, closeEarly, closeNow, soldOut, rescueIfStuck, recordBest, emptyStats, DAY_LENGTH } from '../js/sim/day.js';
import { tickCustomers, spawnCustomer, sendEveryoneHome } from '../js/sim/customers.js';
import { checkoutTap } from '../js/sim/checkout.js';
import { events } from '../js/core/events.js';
import { rng } from '../js/core/rng.js';
import { ITEMS } from '../js/data/items.js';

/** Skip the window-peeking: walk straight in through the shop door. */
const headStraightIn = (c) => { c.state = 'arriving'; c.path = [{ x: 0.4, z: 2.25 }, { x: 0.4, z: 1.1 }]; c.arriveRoom = null; c.arriveFacing = null; };
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

test('closing waits for the last customer in line to pay, not for them to walk off-screen', () => {
  const s = createState();
  const navs = navsFor(s);
  s.building.rooms[0].fixtures.find((f) => f.slots).slots[4] = 'doll';
  s.day.phase = 'evening';
  s.spawnTimer = Infinity;
  const c = spawnCustomer(s, rng(2));
  c.wants = ['doll'];
  if (c.state === 'toWindow') headStraightIn(c);
  run(s, navs, 30);
  assert.equal(c.state, 'paying'); // at the counter, waiting to be rung up
  assert.equal(s.day.phase, 'evening', 'still waiting on a customer in line');
  checkoutTap(s);
  checkoutTap(s);
  run(s, navs, 0.3);
  assert.equal(s.day.phase, 'close');
  assert.equal(s.customers.length, 1, 'still walking away behind the summary');
  run(s, navs, 30);
  assert.equal(s.customers.length, 0);
});

test('when the evening is over, shoppers stop: with something they go to the counter, without they go home', () => {
  const s = createState();
  const navs = navsFor(s);
  const shelf = s.building.rooms[0].fixtures.find((f) => f.slots);
  shelf.slots[4] = 'doll';
  s.spawnTimer = Infinity;
  openShop(s);
  closeEarly(s);
  const rand = rng(5);
  const holding = spawnCustomer(s, rand), empty = spawnCustomer(s, rand);
  for (const c of [holding, empty]) {
    c.state = 'browsing'; c.timer = 999; c.path = []; c.arriveRoom = null;
    c.roomId = 'r1'; c.x = 0.6; c.z = 0; c.wants = ['cottage', 'lamp'];
  }
  holding.basket = ['teaset'];
  run(s, navs, DAY_LENGTH.evening - 0.5, rand);
  assert.equal(holding.state, 'browsing', 'still shopping during the twilight');
  run(s, navs, 1, rand);
  assert.equal(empty.state, 'leaving');
  assert.ok(['toQueue', 'queued'].includes(holding.state), holding.state);
  assert.deepEqual(holding.wants, []);
  run(s, navs, 10, rand);
  assert.equal(s.day.phase, 'evening');
  checkoutTap(s, rand);
  checkoutTap(s, rand);
  run(s, navs, 0.3, rand);
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

test("Pip's rescue box: stuck with nothing to sell and no coins, a free box arrives next morning", () => {
  const s = createState();
  s.boxes = [];
  s.coins = 5;
  s.day.phase = 'close';
  startNextDay(s);
  assert.equal(s.boxes.length, 1);
  assert.equal(s.boxes[0].itemId, 'teaset');
  assert.equal(s.boxes[0].qty, 3);
});

test('no rescue box when there is stock, an order, or enough coins', () => {
  const s = createState();
  s.coins = 0;
  assert.equal(rescueIfStuck(s), null); // starter boxes still waiting
  s.boxes = [];
  s.building.rooms[0].fixtures.find((f) => f.slots).slots[0] = 'doll';
  assert.equal(rescueIfStuck(s), null); // something on the shelf
  s.building.rooms[0].fixtures.find((f) => f.slots).slots[0] = null;
  s.orders = [{ id: 'o1', itemId: 'doll', qty: 3, arrivesDay: 2 }];
  assert.equal(rescueIfStuck(s), null); // on the way
  s.orders = [];
  s.coins = 18;
  assert.equal(rescueIfStuck(s), null); // can afford a tea set box
  s.coins = 17;
  assert.equal(rescueIfStuck(s), 'teaset');
});

test('beating your best day for coins is a record; the first day only sets the bar', () => {
  const s = createState(0);
  const close = (coins) => {
    s.day.stats.coins = coins;
    recordBest(s);
    const record = s.day.stats.record;
    s.day.stats = emptyStats();
    return record;
  };
  assert.equal(close(30), false); // first day: sets the bar
  assert.equal(s.best.coins, 30);
  assert.equal(close(20), false);
  assert.equal(close(30), false); // a tie isn't a record
  assert.equal(close(45), true);
  assert.equal(s.best.coins, 45);
});

test('closing now in the evening sends everyone home and puts what they held back on the shelves', () => {
  const s = createState();
  const navs = navsFor(s);
  const [a, b] = s.building.rooms[0].fixtures.filter((f) => f.slots);
  a.slots[4] = 'doll';
  b.slots[0] = 'lamp';
  s.spawnTimer = Infinity;
  openShop(s);
  const rand = rng(8);
  const buyer = spawnCustomer(s, rand), browser = spawnCustomer(s, rand);
  buyer.wants = ['doll'];
  if (buyer.state === 'toWindow') headStraightIn(buyer);
  browser.wants = ['lamp'];
  if (browser.state === 'toWindow') headStraightIn(browser);
  run(s, navs, 30, rand);
  assert.equal(a.slots[4], null, 'taken');
  assert.ok(s.checkout, 'someone is at the register');
  assert.equal(closeNow(s), false, 'only in the evening');
  closeEarly(s);
  b.slots[0] = 'chair'; // someone restocked the lamp's slot meanwhile
  const coins = s.coins;
  sendEveryoneHome(s);
  assert.ok(closeNow(s));
  assert.equal(s.day.phase, 'close');
  assert.equal(s.customers.length, 0);
  assert.equal(s.checkout, null);
  assert.deepEqual(s.queue, []);
  assert.equal(s.coins, coins, 'nobody paid');
  assert.equal(a.slots[4], 'doll', 'back in its own slot');
  const shelved = s.building.rooms[0].fixtures.flatMap((f) => f.slots ?? []);
  assert.ok(shelved.includes('lamp'), 'back on a shelf, just not its own slot');
});
