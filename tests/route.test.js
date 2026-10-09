import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createState } from '../js/sim/state.js';
import { buildNav } from '../js/sim/nav.js';
import { addRoom } from '../js/sim/building.js';
import { walkTo, walkToFixture, walkToGreeter, walkToShowOff, keeperGreeting, tickKeeper } from '../js/sim/keeper.js';
import { spawnCustomer, tickCustomers } from '../js/sim/customers.js';
import { peekChance, peekWantChance, keeperShowingOff } from '../js/sim/collection.js';
import { GREETER, SHOWOFF, SIDEWALK } from '../js/sim/route.js';
import { SPARKLE } from '../js/data/dollhouse.js';
import { CUSTOMER } from '../js/data/customers.js';
import { events } from '../js/core/events.js';
import { rng } from '../js/core/rng.js';

function withDisplay() {
  const s = createState();
  const display = addRoom(s, 'display', 1, 0);
  const navs = new Map(s.building.rooms.map((r) => [r.id, buildNav(r)]));
  return { s, display, navs };
}
const run = (s, seconds) => { for (let t = 0; t < seconds && (t === 0 || s.keeper.path.length); t += 0.1) tickKeeper(s, 0.1); };

test('she walks out the front, along the sidewalk, and into the Window Display', () => {
  const { s, display, navs } = withDisplay();
  let entered = null;
  const off = events.on('keeperEnteredRoom', (e) => (entered = e.roomId));
  assert.ok(walkTo(s, navs, { roomId: display.id, x: 0.9, z: -0.5 }));
  assert.ok(s.keeper.path.some((p) => p.z === SIDEWALK.lane), 'goes by the sidewalk');
  run(s, 20);
  off();
  assert.equal(s.keeper.roomId, display.id);
  assert.ok(Math.hypot(s.keeper.x - 0.9, s.keeper.z + 0.5) < 1e-6);
  assert.equal(entered, display.id);
  assert.ok(keeperShowingOff(s));
});

test('from the Window Display she can walk back to a shop shelf and use it', () => {
  const { s, display, navs } = withDisplay();
  walkTo(s, navs, { roomId: display.id, x: 0.9, z: -0.5 });
  run(s, 20);
  const shelf = s.building.rooms[0].fixtures.find((f) => f.slots);
  let arrived = null;
  const off = events.on('keeperArrived', (e) => (arrived = e.fixtureId));
  assert.ok(walkToFixture(s, navs, shelf));
  run(s, 20);
  off();
  assert.equal(s.keeper.roomId, 'r1');
  assert.equal(arrived, shelf.id);
  assert.ok(!keeperShowingOff(s));
});

test('changing her mind halfway puts her in the room she is really in', () => {
  const { s, display, navs } = withDisplay();
  walkTo(s, navs, { roomId: display.id, x: 0.9, z: -0.5 });
  // Run until she's inside the display room (still in shop coordinates), then send her back.
  for (let i = 0; i < 400 && !(s.keeper.z < 1 && s.keeper.x > 2); i++) tickKeeper(s, 0.05);
  walkTo(s, navs, { roomId: display.id, x: -0.9, z: -0.5 });
  assert.equal(s.keeper.roomId, display.id);
  assert.ok(!s.keeper.path.some((p) => p.z === SIDEWALK.lane), 'stays inside the room');
  run(s, 10);
  assert.ok(Math.hypot(s.keeper.x + 0.9, s.keeper.z + 0.5) < 1e-6);
});

test('she can wait at the greeter spot, and greeted customers often want one more thing', () => {
  const { s, navs } = withDisplay();
  assert.ok(walkToGreeter(s, navs));
  run(s, 10);
  assert.ok(keeperGreeting(s));
  assert.ok(Math.hypot(s.keeper.x - GREETER.x, s.keeper.z - GREETER.z) < 1e-6);

  const shelf = s.building.rooms[0].fixtures.find((f) => f.slots);
  shelf.slots.fill('doll');
  s.spawnTimer = Infinity;
  const rand = rng(4);
  let seconds = 0, greeted = 0;
  for (let i = 0; i < 40; i++) {
    const c = spawnCustomer(s, rand);
    c.state = 'arriving'; c.path = [{ x: 0.4, z: 1.1 }]; c.x = 0.4; c.z = 1.15; c.wants = ['doll'];
    tickCustomers(s, navs, 0.1, rand);
    if (c.greeted) greeted++;
    if (c.wants.length === 2) seconds++;
    s.customers = [];
  }
  assert.equal(greeted, 40);
  assert.ok(seconds > 40 * CUSTOMER.greetedSecondItem * 0.6, `${seconds} of 40 wanted a second thing`);
});

test('nobody is greeted when she is not at the door', () => {
  const { s, navs } = withDisplay();
  const rand = rng(5);
  const c = spawnCustomer(s, rand);
  c.state = 'arriving'; c.path = [{ x: 0.4, z: 1.1 }]; c.x = 0.4; c.z = 1.15;
  tickCustomers(s, navs, 0.1, rand);
  assert.ok(!c.greeted);
});

test('showing off the dollhouse draws more window-peekers who want what they saw', () => {
  const { s, display, navs } = withDisplay();
  s.sparkle = 10;
  const before = peekChance(s);
  assert.equal(peekWantChance(s), SPARKLE.peekWant);
  walkTo(s, navs, { roomId: display.id, x: 0.9, z: -0.5 });
  run(s, 20);
  assert.ok(peekChance(s) > before);
  assert.equal(peekWantChance(s), SPARKLE.keeperPeekWant);
});

test('the show-off spot beside the dollhouse is reachable, and she faces the camera there', () => {
  const { s, display, navs } = withDisplay();
  assert.ok(walkToShowOff(s, navs));
  run(s, 20);
  assert.equal(s.keeper.roomId, display.id);
  assert.ok(Math.hypot(s.keeper.x - SHOWOFF.x, s.keeper.z - SHOWOFF.z) < 1e-6);
  assert.equal(s.keeper.facing, 0);
  assert.ok(keeperShowingOff(s));
});
