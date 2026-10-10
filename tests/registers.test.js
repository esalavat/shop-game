import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createState } from '../js/sim/state.js';
import { buildNav } from '../js/sim/nav.js';
import { buildExpansion, buildRoom, buildStairwell, buildFloor, buildRegister, nextRegisterFloor, registerCost, hasRoom } from '../js/sim/building.js';
import { registerOf, registerFor, registerRooms, checkoutTap } from '../js/sim/checkout.js';
import { tickHelpers, cashierReady } from '../js/sim/helpers.js';
import { spawnCustomer, tickCustomers } from '../js/sim/customers.js';
import { REGISTER_COST, REGISTER_COST_STEP } from '../js/data/rooms.js';

const at = (s, col, floor) => s.building.rooms.find((r) => r.col === col && r.floor === floor);
const supported = (s) => s.building.rooms.every((r) => r.floor === 0 || hasRoom(s, r.col, r.floor - 1));

/** A shop with the Window Display, a shelf room, the Stairwell and `floors` floors. */
function bigShop(floors = 2) {
  const s = createState();
  s.coins = 100000;
  buildExpansion(s);
  assert.ok(buildRoom(s, -1, 0)); // left of the shop
  assert.ok(buildStairwell(s));
  for (let f = 2; f < floors; f++) assert.ok(buildFloor(s));
  return s;
}

test('register rooms need the stairs, go straight above the shop, one per floor, each dearer (GDD #73)', () => {
  const s = createState();
  s.coins = 100000;
  assert.equal(nextRegisterFloor(s), null);
  const big = bigShop(3);
  const shop = big.building.rooms.find((r) => r.type === 'shop');
  assert.equal(nextRegisterFloor(big), 1);
  assert.equal(registerCost(big), REGISTER_COST);
  const first = buildRegister(big);
  assert.deepEqual([first.col, first.floor, first.type], [shop.col, 1, 'register']);
  assert.equal(registerCost(big), REGISTER_COST + REGISTER_COST_STEP);
  const second = buildRegister(big);
  assert.deepEqual([second.col, second.floor], [shop.col, 2]);
  assert.equal(nextRegisterFloor(big), null, 'no floor 4 yet');
  assert.equal(buildRegister(big), null);
  assert.deepEqual(registerRooms(big).map((r) => r.floor), [0, 1, 2]);
});

test('rooms in the way move over; one that would float goes to the nearest safe spot, stock and all', () => {
  const s = bigShop(2);
  const shop = s.building.rooms.find((r) => r.type === 'shop');
  // Upstairs: a room above the shop and one above the left room.
  const above = buildRoom(s, shop.col, 1);
  const aboveLeft = buildRoom(s, shop.col - 1, 1);
  above.fixtures.find((f) => f.slots).slots[0] = 'teddy';
  buildRegister(s);
  assert.equal(at(s, shop.col, 1).type, 'register');
  assert.equal(above.col, shop.col - 1, 'moved one place left');
  assert.equal(above.floor, 1);
  assert.notDeepEqual([aboveLeft.col, aboveLeft.floor], [shop.col - 2, 1], 'nothing under there, so it went somewhere safe');
  assert.ok(supported(s), 'nothing floats');
  assert.equal(new Set(s.building.rooms.map((r) => `${r.col},${r.floor}`)).size, s.building.rooms.length, 'no two rooms in one spot');
  assert.equal(above.fixtures.find((f) => f.slots).slots[0], 'teddy');
});

test('customers upstairs pay at the register on their floor, with its own cashier', () => {
  const s = bigShop(2);
  const reg = buildRegister(s);
  assert.equal(registerFor(s, 1).id, reg.id);
  assert.equal(registerFor(s, 0).type, 'shop');
  tickHelpers(s, 0.1);
  assert.ok(registerOf(s, reg.id).cashier, 'comes with a cashier');
  assert.equal(registerOf(s, s.building.rooms.find((r) => r.type === 'shop').id).cashier, null, 'Mia is still a hire');
  assert.ok(cashierReady(s, reg.id));
  s.keeper.x = 1; s.keeper.z = 0.6; // away from the shop's counter
  assert.ok(!cashierReady(s), 'nobody at the shop register');
});

test('a customer who shopped upstairs lines up and pays up there, and the cashier rings them up', () => {
  const s = bigShop(2);
  const reg = buildRegister(s);
  const navs = new Map(s.building.rooms.map((r) => [r.id, buildNav(r)]));
  const shelf = reg.fixtures.find((f) => f.slots);
  shelf.slots.fill('teddy', 0, 3);
  s.day.phase = 'open';
  const c = spawnCustomer(s, () => 0.5);
  c.wants = ['teddy'];
  const coins = s.coins;
  let paidUpstairs = false;
  for (let t = 0; t < 120 && s.customers.length; t += 0.1) {
    tickHelpers(s, 0.1);
    tickCustomers(s, navs, 0.1, () => 0.5);
    if (registerOf(s, reg.id).checkout?.customerId === c.id) paidUpstairs = true;
  }
  assert.ok(paidUpstairs, 'checked out at the upstairs register');
  assert.ok(s.coins > coins);
});

test('the shopkeeper behind an upstairs counter rings up that register', () => {
  const s = bigShop(2);
  const reg = buildRegister(s);
  const r = registerOf(s, reg.id);
  r.checkout = { roomId: reg.id, customerId: 'x', items: [{ itemId: 'teddy', scanned: false }] };
  const counter = reg.fixtures.find((f) => f.kind === 'counter');
  s.keeper.roomId = reg.id;
  s.keeper.x = counter.x; s.keeper.z = counter.z - 0.52; s.keeper.path = [];
  assert.equal(checkoutTap(s), 'scanned');
  assert.equal(checkoutTap(s, () => 0), 'sold');
  assert.equal(r.checkout, null);
});
