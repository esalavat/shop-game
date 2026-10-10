import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createState } from '../js/sim/state.js';
import { buildNav } from '../js/sim/nav.js';
import { spawnCustomer, tickCustomers } from '../js/sim/customers.js';
import { tickHelpers, miaAtTill } from '../js/sim/helpers.js';
import { tickKeeper, walkToFixture } from '../js/sim/keeper.js';
import { buyUpgrade, hireHelper, hasUpgrade } from '../js/sim/upgrades.js';
import { pickUpBox, stockShelf, canCarryMore } from '../js/sim/stock.js';
import { placeOrder } from '../js/sim/orders.js';
import { openShop, tickDay, startNextDay, DAY_LENGTH, closeEarly } from '../js/sim/day.js';
import { UPGRADES, HELPERS } from '../js/data/upgrades.js';
import { rng } from '../js/core/rng.js';

const shelvesOf = (s) => s.building.rooms[0].fixtures.filter((f) => f.slots);
const counterOf = (s) => s.building.rooms[0].fixtures.find((f) => f.kind === 'counter');

test('upgrades and helpers cost coins once and can only be bought once', () => {
  const s = createState();
  s.hearts = 9999; // past every rung of the ladder (GDD #83)
  s.coins = 1000;
  assert.ok(buyUpgrade(s, 'shoes'));
  assert.equal(s.coins, 1000 - UPGRADES.shoes.cost);
  assert.equal(buyUpgrade(s, 'shoes'), false);
  assert.ok(hireHelper(s, 'cashier'));
  assert.equal(hireHelper(s, 'cashier'), false);
  assert.equal(s.coins, 1000 - UPGRADES.shoes.cost - HELPERS.cashier.cost);
  s.coins = 0;
  assert.equal(buyUpgrade(s, 'cart'), false);
  assert.ok(!hasUpgrade(s, 'cart'));
});

test('without the Stock Cart she carries one box; with it, two, and the second keeps filling the shelf', () => {
  const s = createState();
  s.hearts = 9999; // past every rung of the ladder (GDD #83)
  const [a, b] = s.boxes;
  assert.ok(pickUpBox(s, a.id));
  assert.equal(canCarryMore(s), false);
  s.upgrades.cart = true;
  assert.ok(pickUpBox(s, b.id));
  assert.equal(canCarryMore(s), false);
  const shelf = shelvesOf(s)[0];
  assert.equal(stockShelf(s, shelf.id), 6);
  assert.equal(s.keeper.carrying, null);
  assert.equal(s.keeper.spare, null);
  assert.equal(shelf.slots.filter((x) => x === 'teaset').length, 3);
  assert.equal(shelf.slots.filter((x) => x === 'chair').length, 3);
});

test('a full shelf leaves the spare box on the cart', () => {
  const s = createState();
  s.hearts = 9999; // past every rung of the ladder (GDD #83)
  s.upgrades.cart = true;
  const [a, b] = s.boxes;
  pickUpBox(s, a.id);
  pickUpBox(s, b.id);
  const shelf = shelvesOf(s)[0];
  shelf.slots.fill('doll');
  shelf.slots[0] = shelf.slots[1] = shelf.slots[2] = shelf.slots[3] = null;
  assert.equal(stockShelf(s, shelf.id), 4);
  assert.equal(s.keeper.carrying.itemId, 'chair');
  assert.equal(s.keeper.carrying.qty, 2);
  assert.equal(s.keeper.spare, null);
});

test('Comfy Shoes make the shopkeeper quicker', () => {
  const time = (shoes) => {
    const s = createState();
    s.hearts = 9999; // past every rung of the ladder (GDD #83)
    if (shoes) s.upgrades.shoes = true;
    walkToFixture(s, new Map([['r1', buildNav(s.building.rooms[0])]]), shelvesOf(s)[1]);
    let t = 0;
    while (s.keeper.path.length && t < 20) { tickKeeper(s, 0.1); t += 0.1; }
    return t;
  };
  assert.ok(time(true) < time(false) * 0.8);
});

test('Lunchtime Delivery: orders before midday arrive halfway through the day', () => {
  const s = createState();
  s.hearts = 9999; // past every rung of the ladder (GDD #83)
  s.upgrades.lunch = true;
  s.coins = 500;
  placeOrder(s, 'teddy'); // morning
  openShop(s);
  s.day.time = DAY_LENGTH.open * 0.4;
  placeOrder(s, 'nightlight');
  s.day.time = DAY_LENGTH.open * 0.6;
  placeOrder(s, 'lamp'); // too late for lunch
  const before = s.boxes.length;
  s.day.time = DAY_LENGTH.open * 0.4;
  tickDay(s, DAY_LENGTH.open * 0.2);
  assert.equal(s.boxes.length, before + 2);
  assert.deepEqual(s.orders.map((o) => o.itemId), ['lamp']);
  assert.ok(s.collection.teddy && s.collection.nightlight);
});

test('without the upgrade, or closing before midday, orders come the next morning', () => {
  const s = createState();
  s.hearts = 9999; // past every rung of the ladder (GDD #83)
  s.coins = 500;
  placeOrder(s, 'teddy');
  assert.equal(s.orders[0].arrivesDay, 2);
  s.upgrades.lunch = true;
  placeOrder(s, 'nightlight');
  openShop(s);
  closeEarly(s);
  tickDay(s, 10);
  startNextDay(s);
  assert.equal(s.orders.length, 0);
  assert.ok(s.boxes.some((b) => b.itemId === 'nightlight') && s.boxes.some((b) => b.itemId === 'teddy'));
});

function cashierShop() {
  const s = createState();
  s.hearts = 9999; // past every rung of the ladder (GDD #83)
  s.spawnTimer = Infinity;
  s.helpers.cashier = true;
  s.day.phase = 'open';
  s.keeper.x = 0; s.keeper.z = 0.3; // away from the counter
  const navs = new Map(s.building.rooms.map((r) => [r.id, buildNav(r)]));
  shelvesOf(s)[0].slots[4] = 'doll';
  return { s, navs };
}
const runShop = (s, navs, seconds, rand) => {
  for (let t = 0; t < seconds; t += 0.1) {
    tickKeeper(s, 0.1);
    tickHelpers(s, 0.1, rand);
    tickCustomers(s, navs, 0.1, rand);
  }
};

test('Mia rings customers up on her own, without tips', () => {
  const { s, navs } = cashierShop();
  const rand = rng(2);
  const c = spawnCustomer(s, rand);
  c.wants = ['doll'];
  const coins = s.coins;
  runShop(s, navs, 25, rand);
  assert.equal(s.coins, coins + 20);
  assert.equal(s.hearts, 9999 + 1);
  assert.equal(s.day.stats.tips, 0);
});

test('Mia steps aside when the shopkeeper comes to the counter, and back when she leaves', () => {
  const { s, navs } = cashierShop();
  runShop(s, navs, 1);
  assert.ok(miaAtTill(s));
  walkToFixture(s, navs, counterOf(s));
  assert.equal(miaAtTill(s), false);
  runShop(s, navs, 3);
  const m = s.cashier;
  assert.ok(Math.hypot(m.x - s.keeper.x, m.z - s.keeper.z) > 0.3);
  walkToFixture(s, navs, shelvesOf(s)[1]);
  runShop(s, navs, 3);
  assert.ok(miaAtTill(s));
});

test('no Mia until she is hired', () => {
  const s = createState();
  s.hearts = 9999; // past every rung of the ladder (GDD #83)
  tickHelpers(s, 0.1);
  assert.equal(s.cashier, null);
  assert.equal(miaAtTill(s), false);
});

test('Ollie the greeter greets everyone walking in; Rosa needs the Window Display (GDD #72)', async () => {
  const { tickHelpers, greeterOnDuty, dresserOnDuty } = await import('../js/sim/helpers.js');
  const { showingOff } = await import('../js/sim/collection.js');
  const { hireHelper } = await import('../js/sim/upgrades.js');
  const { buildExpansion } = await import('../js/sim/building.js');
  const s = createState();
  s.hearts = 9999; // past every rung of the ladder (GDD #83)
  s.coins = 1e5;
  tickHelpers(s, 0.1);
  assert.ok(!greeterOnDuty(s));
  assert.ok(hireHelper(s, 'greeter'));
  tickHelpers(s, 0.1);
  assert.ok(greeterOnDuty(s));
  assert.equal(hireHelper(s, 'dresser'), false, 'no Window Display yet');
  assert.ok(buildExpansion(s));
  assert.ok(hireHelper(s, 'dresser'));
  tickHelpers(s, 0.1);
  assert.ok(dresserOnDuty(s) && showingOff(s));
});

test('Speedy Scanner scans two per tap; Gift Wrap doubles tips', async () => {
  const { startCheckout, checkoutTap } = await import('../js/sim/checkout.js');
  const s = createState();
  s.hearts = 9999; // past every rung of the ladder (GDD #83)
  const customer = { id: 'c1', basket: ['teaset', 'teaset', 'chair'], state: 'waiting' };
  s.customers.push(customer);
  s.upgrades.scanner = true;
  s.upgrades.giftwrap = true;
  startCheckout(s, customer);
  checkoutTap(s);
  assert.equal(s.checkout.items.filter((i) => i.scanned).length, 2);
  checkoutTap(s);
  const coins = s.coins;
  checkoutTap(s, () => 0); // the smallest tip, doubled
  assert.equal(s.coins, coins + 10 + 10 + 14 + 2);
});

test('Tall Shelves give every shelf, old and new, a top row filled last (GDD #72)', async () => {
  const { buyUpgrade } = await import('../js/sim/upgrades.js');
  const { buildRoom, roomSpots, buildExpansion } = await import('../js/sim/building.js');
  const { freeSlots } = await import('../js/sim/stock.js');
  const s = createState();
  s.hearts = 9999; // past every rung of the ladder (GDD #83)
  s.coins = 5000;
  const shelves = () => s.building.rooms.flatMap((r) => r.fixtures.filter((f) => f.slots));
  assert.ok(shelves().every((f) => f.slots.length === 9));
  assert.ok(buyUpgrade(s, 'tall'));
  assert.ok(shelves().every((f) => f.slots.length === 12));
  assert.deepEqual(freeSlots(shelves()[0]).slice(-3), [9, 10, 11]);
  buildExpansion(s);
  const spot = roomSpots(s)[0];
  assert.ok(buildRoom(s, spot.col, spot.floor));
  assert.ok(shelves().every((f) => f.slots.length === 12));
});

test('helpers and upgrades come as a ladder: each appears at more Hearts and costs more (GDD #83)', async () => {
  const { LADDER, ladder, canHire } = await import('../js/sim/upgrades.js');
  for (let i = 1; i < LADDER.length; i++) {
    assert.ok(LADDER[i].hearts > LADDER[i - 1].hearts, `${LADDER[i].id} needs more Hearts than ${LADDER[i - 1].id}`);
    assert.ok(LADDER[i].cost >= LADDER[i - 1].cost * 1.3, `${LADDER[i].id} costs well over ${LADDER[i - 1].id}`);
  }
  const s = createState();
  s.coins = 1e6;
  let l = ladder(s);
  assert.deepEqual(l.available.map((r) => r.id), ['cart']);
  assert.equal(l.next.id, 'shoes');
  assert.deepEqual(l.next.why, { hearts: UPGRADES.shoes.hearts });
  assert.equal(hireHelper(s, 'cashier'), false, 'not enough happy customers yet');
  s.hearts = HELPERS.cashier.hearts;
  assert.ok(canHire(s, 'cashier'));
  assert.ok(buyUpgrade(s, 'cart'));
  l = ladder(s);
  assert.deepEqual(l.available.map((r) => r.id), ['shoes', 'cashier']);
  assert.deepEqual(l.owned.map((r) => r.id), ['cart']);
  assert.equal(l.next.id, 'giftwrap');
  // Rosa needs the Window Display as well as her Hearts: the teaser says so, and later rungs still come.
  s.hearts = HELPERS.dresser.hearts;
  l = ladder(s);
  assert.equal(l.next.id, 'skates', 'Roller Skates wait for a stocker');
  assert.deepEqual(l.next.why, { needs: 'stocker' });
  assert.ok(!l.available.some((r) => r.id === 'dresser'));
  assert.ok(l.available.some((r) => r.id === 'tall'));
});
