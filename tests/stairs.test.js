// The Stairwell and upstairs rooms (GDD #58 step 2, docs/TECH.md §11.1).

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createState } from '../js/sim/state.js';
import { buildNav } from '../js/sim/nav.js';
import { buildExpansion, buildRoom, buildStairwell, buildFloor, canBuildStairwell, roomSpots, addRoom } from '../js/sim/building.js';
import { walkTo, walkToFixture, tickKeeper } from '../js/sim/keeper.js';
import { spawnCustomer, tickCustomers } from '../js/sim/customers.js';
import { tickHelpers } from '../js/sim/helpers.js';
import { tickStockers } from '../js/sim/stocker.js';
import { separate } from '../js/sim/crowd.js';
import { tickDay, openShop } from '../js/sim/day.js';
import { dropBox } from '../js/sim/stock.js';
import { FLOOR_H, STAIRS, routeTo, walkRoute, finishRoute, stairRoom } from '../js/sim/route.js';
import { STAIR_COSTS } from '../js/data/rooms.js';
import { events } from '../js/core/events.js';
import { rng } from '../js/core/rng.js';
import { ITEMS } from '../js/data/items.js';

const navsFor = (s) => new Map(s.building.rooms.map((r) => [r.id, buildNav(r)]));

/** A room, the shop, the Stairwell, the Window Display; upstairs, a room over the shop (and more to the left). */
function bigShop({ upstairs = ['fairy'] } = {}) {
  const s = createState(0);
  s.coins = 1e6;
  buildExpansion(s);
  buildRoom(s, roomSpots(s)[0].col, 0);
  const stairs = buildStairwell(s);
  const shopCol = s.building.rooms[0].col;
  const ups = upstairs.map((t, i) => buildRoom(s, shopCol - i, 1));
  return { s, stairs, top: stairRoom(s, 1), ups, navs: navsFor(s) };
}

const runKeeper = (s, seconds = 40) => { for (let t = 0; t < seconds && (t === 0 || s.keeper.path.length); t += 0.1) tickKeeper(s, 0.1); };

test('the Stairwell comes after the first room, costs 350, and always goes right next to the shop', () => {
  const s = createState(0);
  s.coins = 1e6;
  const display = buildExpansion(s);
  assert.ok(!canBuildStairwell(s));
  assert.equal(buildStairwell(s), null);
  const tea = buildRoom(s, roomSpots(s).at(-1).col, 0); // right of the Window Display
  assert.ok(canBuildStairwell(s));
  assert.ok(!roomSpots(s).some((p) => p.floor === 1), 'no upstairs spots before the stairs');
  const coins = s.coins;
  const bottom = buildStairwell(s);
  assert.equal(coins - s.coins, STAIR_COSTS[0]);
  assert.equal(bottom.col, 1);
  assert.equal(bottom.floor, 0);
  assert.equal(stairRoom(s, 1).col, 1);
  assert.equal(stairRoom(s, 1).type, 'landing');
  assert.equal(display.col, 2, 'the Window Display moves over one place');
  assert.equal(tea.col, 3);
  assert.equal(s.building.rooms[0].col, 0, 'the shop stays put');
  assert.ok(!canBuildStairwell(s), 'only one');
  assert.equal(buildStairwell(s), null);
});

test('someone walking to a room when the Stairwell goes in still gets there', () => {
  const s = createState(0);
  s.coins = 1e6;
  const display = buildExpansion(s);
  buildRoom(s, roomSpots(s)[0].col, 0);
  let navs = navsFor(s);
  assert.ok(walkTo(s, navs, { roomId: display.id, x: 0.9, z: -0.5 }));
  for (let i = 0; i < 40; i++) tickKeeper(s, 0.1); // out on the sidewalk
  assert.ok(s.keeper.arriveRoom);
  buildStairwell(s);
  navs = navsFor(s);
  runKeeper(s, 30);
  assert.equal(s.keeper.roomId, display.id);
  assert.ok(Math.hypot(s.keeper.x - 0.9, s.keeper.z + 0.5) < 1e-6);
});

test('upstairs + spots sit on top of ground rooms, next to the Stairwell top or another upstairs room', () => {
  const { s, top } = bigShop({ upstairs: [] });
  const up = () => roomSpots(s).filter((p) => p.floor === 1).map((p) => p.col).sort((a, b) => a - b);
  assert.deepEqual(up(), [top.col - 1, top.col + 1]); // over the shop and the Window Display
  assert.ok(buildRoom(s, top.col - 1, 1));
  assert.deepEqual(up(), [top.col - 2, top.col + 1]); // over Tea Time now too
  assert.ok(buildRoom(s, top.col - 2, 1));
  assert.deepEqual(up(), [top.col + 1], 'nothing past the end of the ground floor');
  assert.equal(addRoom(s, 'room', top.col - 3, 1), null, 'nothing floats');
  assert.ok(!roomSpots(s).some((p) => p.floor === 2), 'no floor 2 until its staircase is built');
});

test('she walks from the shop up the spiral stairs and through a doorway into an upstairs room', () => {
  const { s, ups: [fairy], navs } = bigShop();
  let maxY = 0, entered = null;
  const off = events.on('keeperEnteredRoom', (e) => (entered = e.roomId));
  assert.ok(walkTo(s, navs, { roomId: fairy.id, x: 0.3, z: 0.2 }));
  for (let t = 0; t < 60 && s.keeper.path.length; t += 0.1) { tickKeeper(s, 0.1); maxY = Math.max(maxY, s.keeper.y); }
  off();
  assert.equal(s.keeper.roomId, fairy.id);
  assert.ok(Math.hypot(s.keeper.x - 0.3, s.keeper.z - 0.2) < 1e-6);
  assert.equal(s.keeper.y, 0);
  assert.ok(Math.abs(maxY - FLOOR_H) < 1e-6, `climbed to ${maxY}`);
  assert.equal(entered, fairy.id);
  assert.deepEqual(s.keeper.legs, []);
});

test('and back down to a shop shelf', () => {
  const { s, ups: [fairy], navs } = bigShop();
  walkTo(s, navs, { roomId: fairy.id, x: 0.3, z: 0.2 });
  runKeeper(s, 60);
  const shelf = s.building.rooms[0].fixtures.find((f) => f.slots);
  let arrived = null;
  const off = events.on('keeperArrived', (e) => (arrived = e.fixtureId));
  assert.ok(walkToFixture(s, navs, shelf));
  runKeeper(s, 60);
  off();
  assert.equal(s.keeper.roomId, 'r1');
  assert.equal(arrived, shelf.id);
  assert.equal(s.keeper.y, 0);
});

test('changing her mind on the stairs: she finishes the climb, then heads for the new spot', () => {
  const { s, stairs, top, navs } = bigShop();
  walkTo(s, navs, { roomId: top.id, x: 0.5, z: 0.5 });
  for (let i = 0; i < 400 && !(s.keeper.y > FLOOR_H / 3); i++) tickKeeper(s, 0.05);
  assert.ok(s.keeper.y > 0 && s.keeper.roomId === stairs.id, 'on the stairs');
  assert.ok(walkTo(s, navs, { roomId: 'r1', x: 0.5, z: 0.5 }));
  let topped = false;
  for (let t = 0; t < 60 && s.keeper.path.length; t += 0.05) { tickKeeper(s, 0.05); if (s.keeper.roomId === top.id) topped = true; }
  assert.ok(topped, 'went up first');
  assert.equal(s.keeper.roomId, 'r1');
  assert.ok(Math.hypot(s.keeper.x - 0.5, s.keeper.z - 0.5) < 1e-6);
  assert.equal(s.keeper.y, 0);
});

test('changing her mind upstairs between rooms puts her in the room she is really in', () => {
  const { s, top, ups, navs } = bigShop({ upstairs: ['fairy', 'dolls'] });
  const fairy = ups[0];
  const far = ups[1];
  walkTo(s, navs, { roomId: top.id, x: 0.5, z: 0.5 });
  runKeeper(s, 60);
  walkTo(s, navs, { roomId: far.id, x: 0, z: 0 });
  // Run until she's in the middle room (still in the Stairwell top's coordinates), then send her back.
  for (let i = 0; i < 400 && !(s.keeper.x < -3.0 && s.keeper.x > -4.0); i++) tickKeeper(s, 0.05);
  walkTo(s, navs, { roomId: fairy.id, x: 0.8, z: 0.6 });
  assert.equal(s.keeper.roomId, fairy.id);
  runKeeper(s, 20);
  assert.equal(s.keeper.roomId, fairy.id);
  assert.ok(Math.hypot(s.keeper.x - 0.8, s.keeper.z - 0.6) < 1e-6);
});

test('anyone walking a route ends up with no legs left and on the floor', () => {
  const { s, ups: [fairy], navs } = bigShop();
  const agent = { roomId: 'r1', x: 0.5, z: 0.5, facing: 0, path: [], legs: [], y: 0, arriveRoom: null };
  assert.ok(routeTo(s, navs, agent, { roomId: fairy.id, x: 0, z: 0 }));
  let done = false;
  for (let t = 0; t < 60 && !done; t += 0.1) done = walkRoute(s, agent, 1.5, 0.1);
  assert.ok(done);
  assert.ok(finishRoute(agent));
  assert.equal(agent.roomId, fairy.id);
  assert.equal(agent.y, 0);
  // Out onto the street from upstairs.
  assert.ok(routeTo(s, navs, agent, { street: true, x: 0, z: 2.6 }));
  done = false;
  for (let t = 0; t < 60 && !done; t += 0.1) done = walkRoute(s, agent, 1.5, 0.1);
  finishRoute(agent);
  assert.equal(agent.roomId, 'r1');
  assert.ok(Math.abs(agent.z - 2.6) < 1e-6);
});

test('the stairs are off the walk grid, so nobody walks through them', () => {
  const { stairs, top, navs } = bigShop();
  for (const r of [stairs, top]) {
    const nav = navs.get(r.id);
    const c = Math.floor((STAIRS.center.x + nav.W / 2) / 0.1), row = Math.floor((STAIRS.center.z + nav.D / 2) / 0.1);
    assert.equal(nav.blocked[row * nav.cols + c], 1);
  }
});

const tickAll = (s, navs, rand) => {
  tickKeeper(s, 0.1); tickHelpers(s, 0.1, rand); tickStockers(s, navs, 0.1); tickCustomers(s, navs, 0.1, rand); separate(s, navs); tickDay(s, 0.1);
};

test('a customer buys something upstairs and pays at the counter downstairs', () => {
  const { s, ups: [fairy], navs } = bigShop();
  const rand = rng(7);
  fairy.fixtures.find((f) => f.slots).slots[4] = 'doll';
  s.helpers = { cashier: true }; // Mia rings them up
  s.keeper.x = 0.6; s.keeper.z = 0.6;
  openShop(s);
  s.spawnTimer = Infinity;
  const c = spawnCustomer(s, rand);
  c.wants = ['doll'];
  if (c.state === 'toWindow') c.windowWant = null;
  let wentUp = false, sold = null;
  const off = events.on('sale', (e) => (sold = e));
  for (let t = 0; t < 200 && !sold; t += 0.1) {
    tickAll(s, navs, rand);
    if (c.roomId === fairy.id) wentUp = true;
  }
  off();
  assert.ok(wentUp, 'went upstairs');
  assert.ok(sold, `never paid (${c.state})`);
  assert.equal(fairy.fixtures.find((f) => f.slots).slots[4], null);
  // ...and walks all the way out.
  for (let t = 0; t < 120 && s.customers.length; t += 0.1) tickAll(s, navs, rand);
  assert.equal(s.customers.length, 0);
});

test('Bea carries boxes up the stairs to an upstairs room', () => {
  const { s, ups: [fairy], navs } = bigShop();
  s.helpers = { stocker: true };
  s.boxes = [];
  for (const r of s.building.rooms) if (r.id !== fairy.id) for (const f of r.fixtures) f.slots?.fill('doll'); // only space is upstairs
  const fairyItem = 'teaset';
  dropBox(s, fairyItem, 3);
  let wentUp = false;
  for (let t = 0; t < 120 && (s.boxes.length || s.stockers[0]?.carrying); t += 0.1) {
    tickStockers(s, navs, 0.1);
    if (s.stockers[0].roomId === fairy.id) wentUp = true;
  }
  assert.ok(wentUp);
  assert.equal(fairy.fixtures.flatMap((f) => f.slots ?? []).filter((x) => x === fairyItem).length, 3);
});

for (const seed of [11, 2332, 77]) {
  test(`a busy day with upstairs rooms, Mia and Bea reaches closing time (seed ${seed})`, () => {
    const { s, navs } = bigShop({ upstairs: ['fairy', 'dolls'] });
    const rand = rng(seed);
    s.helpers = { cashier: true, stocker: true };
    s.upgrades = { cart: true };
    s.keeper.x = 0.6; s.keeper.z = 0.6;
    const ids = Object.keys(ITEMS);
    for (let i = 0; i < 10; i++) dropBox(s, ids[Math.floor(rand() * ids.length)], 3);
    for (const r of s.building.rooms) if (r.floor > 0) for (const f of r.fixtures) f.slots?.fill(ids[Math.floor(rand() * ids.length)], 3, 6); // something to go up for
    openShop(s);
    let t = 0, upstairs = 0;
    while (s.day.phase !== 'close' && t < 900) {
      tickAll(s, navs, rand);
      upstairs += s.customers.filter((c) => s.building.rooms.find((r) => r.id === c.roomId)?.floor === 1).length;
      t += 0.1;
    }
    assert.equal(s.day.phase, 'close', `still ${s.day.phase} with ${s.customers.length} customers: ${s.customers.map((c) => c.state).join(', ')}`);
    assert.ok(upstairs > 0, 'customers went upstairs');
  });
}

test('two floors up and back: round the stairs twice, through a doorway, and down again', () => {
  const { s, navs: _ } = bigShop();
  const shopCol = s.building.rooms[0].col;
  buildFloor(s);
  const high = buildRoom(s, shopCol, 2);
  assert.ok(high);
  const navs = navsFor(s);
  let maxY = 0, climbs = 0, wasOnStairs = false;
  assert.ok(walkTo(s, navs, { roomId: high.id, x: 0.2, z: 0.3 }));
  for (let t = 0; t < 80 && s.keeper.path.length; t += 0.05) {
    tickKeeper(s, 0.05);
    maxY = Math.max(maxY, s.keeper.y);
    const on = s.keeper.y > 0.01;
    if (on && !wasOnStairs) climbs++;
    wasOnStairs = on;
  }
  assert.equal(s.keeper.roomId, high.id);
  assert.equal(climbs, 2);
  assert.ok(Math.hypot(s.keeper.x - 0.2, s.keeper.z - 0.3) < 1e-6);
  assert.ok(walkTo(s, navs, { roomId: 'r1', x: 0.5, z: 0.5 }));
  runKeeper(s, 80);
  assert.equal(s.keeper.roomId, 'r1');
  assert.equal(s.keeper.y, 0);
  assert.deepEqual(s.keeper.legs, []);
});
