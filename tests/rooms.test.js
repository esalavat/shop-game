// Shelf rooms (GDD #58, §18 #8) and what they cost (GDD #65).

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createState } from '../js/sim/state.js';
import { buildNav } from '../js/sim/nav.js';
import { buildExpansion, buildRoom, buildStairwell, buildFloor, roomSpots, roomCost, stairCost, canBuildRooms, buildRegister } from '../js/sim/building.js';
import { spawnCustomer, tickCustomers, QUEUE_SPOTS } from '../js/sim/customers.js';
import { checkoutTap } from '../js/sim/checkout.js';
import { tickStockers } from '../js/sim/stocker.js';
import { tickKeeper } from '../js/sim/keeper.js';
import { dropBox } from '../js/sim/stock.js';
import { ROOM_COSTS, ROOM_EACH, ROOM_STYLES, STAIR_COSTS } from '../js/data/rooms.js';
import { ITEMS } from '../js/data/items.js';
import { rng } from '../js/core/rng.js';

const navsFor = (s) => new Map(s.building.rooms.map((r) => [r.id, buildNav(r)]));
const shelvesIn = (room) => room.fixtures.filter((f) => f.slots);

/** A shop with the Window Display and a shelf room on the right (`tea`: it gets tea sets below). */
function withTeaRoom() {
  const s = createState(0);
  s.coins = 10000;
  buildExpansion(s);
  const right = roomSpots(s).at(-1);
  const tea = buildRoom(s, right.col, right.floor);
  s.spawnTimer = Infinity;
  return { s, tea, shop: s.building.rooms[0], navs: navsFor(s) };
}

test('shelf rooms open after the Window Display, at either end, each in the next wallpaper', () => {
  const s = createState(0);
  s.coins = 10000;
  assert.equal(canBuildRooms(s), false);
  assert.equal(buildRoom(s, 1, 0), null);
  buildExpansion(s); // Window Display at col 1
  assert.deepEqual(roomSpots(s), [{ col: -1, floor: 0 }, { col: 2, floor: 0 }]);
  const before = s.coins;
  const a = buildRoom(s, -1, 0);
  assert.ok(a);
  assert.equal(a.type, 'room');
  assert.equal(s.coins, before - ROOM_COSTS[0]);
  assert.equal(shelvesIn(a).length, 3);
  assert.equal(buildRoom(s, 5, 0), null, 'only at a + spot');
  const b = buildRoom(s, 2, 0);
  assert.ok(b);
  assert.notEqual(a.style, b.style);
  assert.ok(ROOM_STYLES[b.style]);
});

test('rooms cost more the further out from the middle, sideways or up, so a squarish house is cheapest', () => {
  const s = createState(0);
  s.coins = 1e6;
  buildExpansion(s);                       // shop 0, display 1
  buildRoom(s, -1, 0);
  buildStairwell(s);                       // stairs 1, display 2
  // One shelf room built so far, so every spot costs ROOM_EACH more.
  assert.equal(roomCost(s, -1, 0), ROOM_COSTS[0] + ROOM_EACH, 'right beside the shop');
  assert.equal(roomCost(s, 2, 0), ROOM_COSTS[0] + ROOM_EACH, 'right beside the stairs');
  assert.equal(roomCost(s, -2, 0), ROOM_COSTS[1] + ROOM_EACH);
  assert.equal(roomCost(s, 4, 0), ROOM_COSTS[2] + ROOM_EACH);
  // Going up costs the same as going out (#75): the same ring, the same price...
  assert.equal(roomCost(s, 0, 2), roomCost(s, -2, 0));
  assert.equal(roomCost(s, 0, 3), roomCost(s, 4, 0));
  assert.equal(roomCost(s, 0, 3), roomCost(s, -3, 0));
  // ...and filling in the square is cheaper than going further out, either way.
  assert.ok(roomCost(s, -1, 1) < roomCost(s, -2, 0));
  assert.ok(roomCost(s, -2, 2) < roomCost(s, -3, 0));
  assert.ok(roomCost(s, -2, 2) < roomCost(s, -2, 3));
  s.coins = roomCost(s, -2, 0) - 1;
  assert.equal(buildRoom(s, -2, 0), null, 'not enough coins');
});

test('every room built makes every spot dearer, so the cheapest spot always costs more than before', () => {
  const s = createState(0);
  s.coins = 1e7;
  buildExpansion(s);
  buildRoom(s, -1, 0);
  buildStairwell(s);
  let last = 0;
  for (let i = 0; i < 30; i++) {
    if (i % 6 === 5) buildFloor(s);
    const spots = roomSpots(s);
    const cheapest = Math.min(...spots.map((p) => roomCost(s, p.col, p.floor)));
    assert.ok(cheapest > last, `room ${i}: ${cheapest} after ${last}`);
    last = cheapest;
    const p = spots.find((q) => roomCost(s, q.col, q.floor) === cheapest);
    assert.ok(buildRoom(s, p.col, p.floor));
  }
});

test('register rooms neither push spots further out nor add to room prices', () => {
  const s = createState(0);
  s.coins = 1e7;
  buildExpansion(s);
  buildRoom(s, -1, 0);
  buildStairwell(s);
  buildRoom(s, -2, 0);
  const prices = () => roomSpots(s).map((p) => roomCost(s, p.col, p.floor)).sort((a, b) => a - b);
  const before = prices();
  assert.ok(buildRegister(s));
  assert.deepEqual(prices(), before);
});

test('each staircase up costs more than the last, and opens a floor for rooms', () => {
  const s = createState(0);
  s.coins = 1e6;
  buildExpansion(s);
  buildRoom(s, -1, 0);
  assert.equal(stairCost(s), STAIR_COSTS[0]);
  buildStairwell(s);
  assert.equal(stairCost(s), STAIR_COSTS[1]);
  assert.ok(buildRoom(s, 0, 1), 'over the shop');
  assert.ok(buildRoom(s, -1, 1));
  assert.ok(!roomSpots(s).some((p) => p.floor === 2), 'no floor 2 yet');
  const coins = s.coins;
  const landing = buildFloor(s);
  assert.equal(coins - s.coins, STAIR_COSTS[1]);
  assert.equal(landing.floor, 2);
  assert.ok(stairCost(s) > STAIR_COSTS[1]);
  const up = roomSpots(s).filter((p) => p.floor === 2).map((p) => p.col).sort((a, b) => a - b);
  assert.deepEqual(up, [0], 'on top of rooms, next to the stairs');
  assert.ok(buildRoom(s, 0, 2));
  assert.ok(roomSpots(s).some((p) => p.floor === 2 && p.col === -1));
});

test('a customer walks over to another room for what they want and pays at the shop counter', () => {
  const { s, tea, shop, navs } = withTeaRoom();
  shelvesIn(tea)[0].slots[4] = 'teaset';
  s.keeper.x = 0; s.keeper.z = 0.3; // away from the counter
  const rand = rng(3);
  const c = spawnCustomer(s, rand);
  c.wants = ['teaset'];
  for (let t = 0; t < 40 && c.state !== 'queued'; t += 0.1) tickCustomers(s, navs, 0.1, rand);
  assert.deepEqual(c.basket, ['teaset']);
  assert.equal(c.state, 'queued');
  assert.equal(c.roomId, shop.id);
  assert.ok(Math.hypot(c.x - QUEUE_SPOTS[0].x, c.z - QUEUE_SPOTS[0].z) < 1e-6);
  // Ring them up: the price (plus a tip).
  s.keeper.x = -1.05; s.keeper.z = -0.42; s.keeper.path = [];
  for (let t = 0; t < 2 && !s.checkout; t += 0.1) tickCustomers(s, navs, 0.1, rand);
  const coins = s.coins;
  checkoutTap(s, rand);
  const sale = checkoutTap(s, () => 0);
  assert.equal(sale, 'sold');
  assert.equal(s.coins - coins, ITEMS.teaset.price + 1);
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

function beaWithTeaRoom() {
  const w = withTeaRoom();
  w.s.helpers.stocker = true;
  w.s.boxes = [];
  for (const room of [w.shop, w.tea]) for (const f of shelvesIn(room)) f.slots.fill('doll');
  return w;
}
const run = (s, navs, seconds) => { for (let t = 0; t < seconds; t += 0.1) { tickKeeper(s, 0.1); tickStockers(s, navs, 0.1); } };

test('Bea stocks shelves in other rooms too, walking over along the sidewalk', () => {
  const { s, tea, shop, navs } = beaWithTeaRoom();
  shelvesIn(tea)[2].slots.fill(null); // the only space is in the Tea Time room
  dropBox(s, 'chair', 3);
  run(s, navs, 40);
  assert.equal(shelvesIn(tea)[2].slots.filter((x) => x === 'chair').length, 3);
  assert.equal(s.stockers[0].roomId, shop.id, 'back to her spot in the shop');
  assert.equal(s.stockers[0].arriveRoom, null);
});

test('Bea takes a box to the emptiest shelf, wherever it is', () => {
  const { s, tea, shop, navs } = beaWithTeaRoom();
  shelvesIn(shop)[0].slots.fill(null, 0, 3);      // 3 free in the shop
  shelvesIn(tea)[0].slots.fill(null);             // 9 free in the other room
  dropBox(s, 'teaset', 3);
  run(s, navs, 40);
  assert.equal(shelvesIn(tea)[0].slots.filter((x) => x === 'teaset').length, 3);
});
