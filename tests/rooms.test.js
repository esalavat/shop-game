// Theme rooms (GDD #58) and Sorting Smarts (GDD #60).

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createState } from '../js/sim/state.js';
import { buildNav } from '../js/sim/nav.js';
import { buildExpansion, buildThemeRoom, roomSpots, themeRoomCost, themesLeft, canBuildThemeRooms } from '../js/sim/building.js';
import { spawnCustomer, tickCustomers, QUEUE_SPOTS } from '../js/sim/customers.js';
import { checkoutTap } from '../js/sim/checkout.js';
import { tickStocker } from '../js/sim/stocker.js';
import { tickKeeper } from '../js/sim/keeper.js';
import { dropBox } from '../js/sim/stock.js';
import { THEME_ROOM_COSTS } from '../js/data/rooms.js';
import { ITEMS } from '../js/data/items.js';
import { rng } from '../js/core/rng.js';

const navsFor = (s) => new Map(s.building.rooms.map((r) => [r.id, buildNav(r)]));
const shelvesIn = (room) => room.fixtures.filter((f) => f.slots);

/** A shop with the Window Display and a Tea Time room on the right. */
function withTeaRoom() {
  const s = createState(0);
  s.coins = 10000;
  buildExpansion(s);
  const right = roomSpots(s).at(-1);
  const tea = buildThemeRoom(s, 'tea', right.col, right.floor);
  s.spawnTimer = Infinity;
  return { s, tea, shop: s.building.rooms[0], navs: navsFor(s) };
}

test('theme rooms open after the Window Display, at either end, and cost more each time', () => {
  const s = createState(0);
  s.coins = 10000;
  assert.equal(canBuildThemeRooms(s), false);
  assert.equal(buildThemeRoom(s, 'tea', 1, 0), null);
  buildExpansion(s); // Window Display at col 1
  assert.deepEqual(roomSpots(s), [{ col: -1, floor: 0 }, { col: 2, floor: 0 }]);
  assert.equal(themeRoomCost(s), THEME_ROOM_COSTS[0]);
  const before = s.coins;
  const tea = buildThemeRoom(s, 'tea', -1, 0);
  assert.ok(tea);
  assert.equal(s.coins, before - THEME_ROOM_COSTS[0]);
  assert.equal(shelvesIn(tea).length, 3);
  assert.equal(themeRoomCost(s), THEME_ROOM_COSTS[1]);
  assert.ok(!themesLeft(s).includes('tea'));
  assert.equal(buildThemeRoom(s, 'tea', 2, 0), null, 'one room per theme');
  assert.equal(buildThemeRoom(s, 'fairy', 5, 0), null, 'only at a + spot');
  assert.ok(buildThemeRoom(s, 'fairy', 2, 0));
});

test('a customer walks over to the theme room, earns the theme bonus, and pays at the shop counter', () => {
  const { s, tea, shop, navs } = withTeaRoom();
  shelvesIn(tea)[0].slots[4] = 'teaset';
  s.keeper.x = 0; s.keeper.z = 0.3; // away from the counter
  const rand = rng(3);
  const c = spawnCustomer(s, rand);
  c.wants = ['teaset'];
  for (let t = 0; t < 40 && c.state !== 'queued'; t += 0.1) tickCustomers(s, navs, 0.1, rand);
  assert.deepEqual(c.basket, ['teaset']);
  assert.equal(c.bonus, Math.ceil(ITEMS.teaset.price * 0.25));
  assert.equal(c.state, 'queued');
  assert.equal(c.roomId, shop.id);
  assert.ok(Math.hypot(c.x - QUEUE_SPOTS[0].x, c.z - QUEUE_SPOTS[0].z) < 1e-6);
  // Ring them up: the price plus the theme bonus (plus a tip).
  s.keeper.x = -1.05; s.keeper.z = -0.42; s.keeper.path = [];
  for (let t = 0; t < 2 && !s.checkout; t += 0.1) tickCustomers(s, navs, 0.1, rand);
  const coins = s.coins, bonus = c.bonus;
  checkoutTap(s, rand);
  const sale = checkoutTap(s, () => 0);
  assert.equal(sale, 'sold');
  assert.equal(s.coins - coins, ITEMS.teaset.price + bonus + 1);
});

test('items from another theme earn no bonus in a theme room', () => {
  const { s, tea, navs } = withTeaRoom();
  shelvesIn(tea)[0].slots[4] = 'doll';
  const rand = rng(4);
  const c = spawnCustomer(s, rand);
  c.wants = ['doll'];
  for (let t = 0; t < 40 && !c.basket.length; t += 0.1) tickCustomers(s, navs, 0.1, rand);
  assert.deepEqual(c.basket, ['doll']);
  assert.equal(c.bonus, 0);
});

test('customers leave from the room they are in, off the end of the street', () => {
  const { s, tea, navs } = withTeaRoom();
  const rand = rng(5);
  shelvesIn(tea)[0].slots[4] = 'teaset';
  const c = spawnCustomer(s, rand);
  c.wants = ['teaset', 'cottage']; // the cottage isn't anywhere: a wish, then pay, then go
  let left = false;
  const off = () => { left = true; };
  for (let t = 0; t < 80 && !left; t += 0.1) {
    tickCustomers(s, navs, 0.1, rand);
    if (s.checkout) { s.keeper.x = -1.05; s.keeper.z = -0.42; s.keeper.path = []; checkoutTap(s, rand); checkoutTap(s, rand); }
    if (!s.customers.includes(c)) off();
  }
  assert.ok(left);
  assert.ok(s.wishes.some((w) => w.itemId === 'cottage'));
});

function beaWithTeaRoom(sorting) {
  const w = withTeaRoom();
  w.s.helpers.stocker = true;
  if (sorting) w.s.upgrades.sorting = true;
  w.s.boxes = [];
  for (const room of [w.shop, w.tea]) for (const f of shelvesIn(room)) f.slots.fill('doll');
  return w;
}
const run = (s, navs, seconds) => { for (let t = 0; t < seconds; t += 0.1) { tickKeeper(s, 0.1); tickStocker(s, navs, 0.1); } };

test('Bea stocks shelves in other rooms too, walking over along the sidewalk', () => {
  const { s, tea, shop, navs } = beaWithTeaRoom(false);
  shelvesIn(tea)[2].slots.fill(null); // the only space is in the Tea Time room
  dropBox(s, 'chair', 3);
  run(s, navs, 40);
  assert.equal(shelvesIn(tea)[2].slots.filter((x) => x === 'chair').length, 3);
  assert.equal(s.stocker.roomId, shop.id, 'back to her spot in the shop');
  assert.equal(s.stocker.arriveRoom, null);
});

test('with Sorting Smarts Bea takes a box to its theme room; without it, to the emptiest shelf', () => {
  for (const sorting of [false, true]) {
    const { s, tea, shop, navs } = beaWithTeaRoom(sorting);
    shelvesIn(shop)[0].slots.fill(null);            // 9 free in the shop
    shelvesIn(tea)[0].slots.fill(null, 0, 3);       // 3 free in Tea Time
    dropBox(s, 'teaset', 3);
    run(s, navs, 40);
    const inTea = shelvesIn(tea)[0].slots.filter((x) => x === 'teaset').length;
    assert.equal(inTea, sorting ? 3 : 0, sorting ? 'sorted into Tea Time' : 'emptiest shelf (the shop)');
  }
});
