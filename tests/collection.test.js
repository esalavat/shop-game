import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createState } from '../js/sim/state.js';
import { buildExpansion, nextExpansion } from '../js/sim/building.js';
import { placeInDollhouse, fitsSlot, sparkleFor, trafficBoost, peekChance, windowX } from '../js/sim/collection.js';
import { spawnCustomer, tickCustomers, ENTRY } from '../js/sim/customers.js';
import { buildNav } from '../js/sim/nav.js';
import { DOLLHOUSE_SLOTS, EXPANSIONS, SPARKLE } from '../js/data/dollhouse.js';
import { ITEMS } from '../js/data/items.js';
import { ROOM_SIZE } from '../js/data/rooms.js';
import { rng } from '../js/core/rng.js';

const withDisplay = () => {
  const s = createState();
  s.coins = 500;
  buildExpansion(s);
  return s;
};

test('the first expansion builds the Window Display right of the shop and costs coins', () => {
  const s = createState();
  assert.equal(buildExpansion(s), null, 'too expensive at the start');
  s.coins = EXPANSIONS[0].cost + 7;
  const room = buildExpansion(s);
  assert.equal(room.type, 'display');
  assert.deepEqual([room.col, room.floor], [1, 0]);
  assert.equal(s.coins, 7);
  assert.equal(nextExpansion(s), null);
  assert.equal(buildExpansion(s), null, 'only once');
  assert.ok(room.fixtures.some((f) => f.kind === 'pedestal'));
});

test('every item fits at least one dollhouse room, and the starter items fit right away', () => {
  for (const id of Object.keys(ITEMS)) assert.ok(DOLLHOUSE_SLOTS.some((sl) => fitsSlot(sl.id, id)), id);
  assert.ok(fitsSlot('tearoom', 'teaset'));
  assert.ok(fitsSlot('parlor', 'chair'));
  assert.ok(!fitsSlot('bedroom', 'teaset'));
});

test('placing needs the Window Display, a found item, and a slot it fits', () => {
  const s = createState();
  assert.equal(placeInDollhouse(s, 'tearoom', 'teaset'), false, 'no window yet');
  s.coins = 500;
  buildExpansion(s);
  assert.equal(placeInDollhouse(s, 'bedroom', 'bed'), false, 'not in the Collection');
  assert.equal(placeInDollhouse(s, 'bedroom', 'teaset'), false, "doesn't fit");
  assert.equal(placeInDollhouse(s, 'tearoom', 'teaset'), true);
  assert.equal(s.dollhouse.slots.tearoom, 'teaset');
  assert.equal(s.sparkle, ITEMS.teaset.sparkle);
});

test('one item can fill several rooms; emptying a room takes its Sparkle away', () => {
  const s = withDisplay();
  placeInDollhouse(s, 'parlor', 'chair');
  placeInDollhouse(s, 'tearoom', 'chair');
  assert.equal(s.sparkle, 2 * ITEMS.chair.sparkle);
  placeInDollhouse(s, 'parlor', null);
  assert.equal(s.sparkle, ITEMS.chair.sparkle);
  assert.equal(s.dollhouse.slots.parlor, undefined);
});

test('a fully decorated house gets bonus Sparkle', () => {
  const slots = { bedroom: 'bed', playroom: 'cottage', parlor: 'chair', tearoom: 'teaset' };
  const sum = ['bed', 'cottage', 'chair', 'teaset'].reduce((n, id) => n + ITEMS[id].sparkle, 0);
  assert.equal(sparkleFor({ slots }), sum + SPARKLE.fullHouse);
  delete slots.bedroom;
  assert.equal(sparkleFor({ slots }), sum - ITEMS.bed.sparkle);
});

test('Sparkle always brings visitors more often, a little less each time (§18 #10)', () => {
  const s = withDisplay();
  s.collection = {}; // no Collection bonus (GDD #70)
  assert.equal(trafficBoost(s), 1);
  let last = 1, lastGain = Infinity;
  for (const sparkle of [30, 60, 90, 120, 150, 180]) {
    s.sparkle = sparkle;
    const gain = trafficBoost(s) - last;
    assert.ok(gain > 0 && gain < lastGain, `Sparkle ${sparkle}`);
    last = trafficBoost(s); lastGain = gain;
  }
  s.sparkle = 1e6;
  assert.ok(trafficBoost(s) < 1 + SPARKLE.trafficMore);
});

test('nobody stops at the window until something is on show', () => {
  const s = createState();
  s.sparkle = 20;
  assert.equal(peekChance(s), 0, 'no window');
  s.coins = 500;
  buildExpansion(s);
  s.sparkle = 0;
  assert.equal(peekChance(s), 0, 'empty dollhouse');
  placeInDollhouse(s, 'tearoom', 'teaset');
  assert.ok(peekChance(s) > 0);
  assert.equal(windowX(s), ROOM_SIZE.W + ROOM_SIZE.T);
});

test('a window-peeker looks in the window, then comes into the shop', () => {
  const s = withDisplay();
  placeInDollhouse(s, 'tearoom', 'teaset');
  s.sparkle = 1000; // always peek
  s.spawnTimer = Infinity;
  const navs = new Map(s.building.rooms.map((r) => [r.id, buildNav(r)]));
  const rand = rng(3);
  let c;
  for (let i = 0; i < 20 && c?.state !== 'toWindow'; i++) { s.customers = []; c = spawnCustomer(s, rand); }
  assert.equal(c.state, 'toWindow');
  const peeks = [];
  for (let t = 0; t < 30 && c.state !== 'entering'; t += 0.1) {
    tickCustomers(s, navs, 0.1, rand);
    if (c.state === 'peeking') peeks.push({ x: c.x, facing: c.facing });
  }
  assert.ok(peeks.length > 0, 'stopped at the window');
  const off = Math.abs(peeks[0].x - windowX(s));
  assert.ok(off >= SPARKLE.peekOffset[0] && off <= SPARKLE.peekOffset[1], 'beside the dollhouse, not in front of it');
  assert.equal(Math.sign(peeks[0].x - windowX(s)), c.side, 'on the side they came from');
  assert.equal(peeks[0].facing, Math.PI);
  assert.equal(c.state, 'entering');
  assert.ok(Math.hypot(c.x - ENTRY.x, c.z - ENTRY.z) < 1e-6);
});

test('window-peekers sometimes want what they saw in the dollhouse', () => {
  const s = withDisplay();
  placeInDollhouse(s, 'parlor', 'chair');
  s.sparkle = 1000;
  const rand = rng(5);
  let wanted = 0;
  for (let i = 0; i < 60; i++) {
    s.customers = [];
    const c = spawnCustomer(s, rand);
    if (c.windowWant) { wanted++; assert.equal(c.wants[0], 'chair'); }
  }
  assert.ok(wanted > 10 && wanted < 50);
});
