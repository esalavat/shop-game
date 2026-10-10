// Helpers (GDD §10, #36). Mia the cashier stands at the shop's register and rings customers up at a
// steady pace (no tips). When the shopkeeper comes to the counter, Mia steps aside and the player takes
// over. Each register room (GDD #73) has a cashier of its own who works the same way. Cashiers are
// live-only (the register's `cashier`, sim/checkout.js registerOf): on load they're back at the till.
// Ollie the greeter and Rosa the window dresser (GDD #72) just stand at the bonus spots (state.greeter,
// state.dresser, also live-only), giving the bonus your shopkeeper gives there.

import { useSpot } from '../data/fixtures.js';
import { HELPERS, SCANNER } from '../data/upgrades.js';
import { GREETER, SHOWOFF } from './route.js';
import { stepAlong } from './walker.js';
import { counterOf, keeperAtCounter, scanNext, completeSale, registerOf, registerRooms } from './checkout.js';
import { hasHelper, hasUpgrade } from './upgrades.js';
import { shopRoomId } from './stock.js';

const MIA_SPEED = 1.0;
const ASIDE = { dx: -0.42, dz: -0.1, face: Math.PI / 2 }; // beside the register, turned toward it

function spots(state, roomId) {
  const counter = counterOf(state, roomId);
  if (!counter) return null;
  const till = useSpot(counter);
  return { counter, till, aside: { x: till.x + ASIDE.dx, z: till.z + ASIDE.dz, face: ASIDE.face } };
}

/** Is the shopkeeper behind this counter, or on the way there? Then the cashier makes room. */
function keeperWantsTill(state, roomId, counter) {
  return (state.keeper.roomId === roomId && keeperAtCounter(state)) || state.keeper.fixtureId === counter.id;
}

/** True when a register's cashier (the shop's by default: Mia) is standing at the till, ready to serve. */
export function miaAtTill(state, roomId = shopRoomId(state)) {
  const m = registerOf(state, roomId)?.cashier;
  if (!m || m.path.length) return false;
  const s = spots(state, roomId);
  return !!s && !keeperWantsTill(state, roomId, s.counter) && Math.hypot(m.x - s.till.x, m.z - s.till.z) < 0.05;
}

/** Someone (the shopkeeper or the cashier) is at this register to ring the next customer up. */
export function cashierReady(state, roomId = shopRoomId(state)) {
  return (state.keeper.roomId === roomId && keeperAtCounter(state)) || miaAtTill(state, roomId);
}

/** Ollie stands out by the left corner, turned toward the door, so he doesn't hide the counter. */
const OLLIE = { x: GREETER.x - 1.3, z: GREETER.z, face: 0.6 };

/** Someone standing still at a spot (room-local), or null if not hired. */
function stander(state, id, roomId, spot) {
  if (!hasHelper(state, id) || !roomId) return null;
  const a = state[id];
  if (a?.roomId === roomId) return a;
  return { roomId, x: spot.x, z: spot.z, facing: spot.face, path: [] };
}

/** Ollie is hired: everyone walking in gets greeted, as if the shopkeeper were at the door. */
export const greeterOnDuty = (state) => !!state.greeter;
/** Rosa is hired and in the Window Display, showing off the Dream Dollhouse. */
export const dresserOnDuty = (state) => !!state.dresser;

export function tickHelpers(state, dt, rand = Math.random) {
  state.greeter = stander(state, 'greeter', shopRoomId(state), OLLIE);
  const display = state.building.rooms.find((r) => r.type === 'display' && r.floor === 0);
  state.dresser = stander(state, 'dresser', display?.id, SHOWOFF);
  // Mia at the shop once hired; register rooms come with their own cashier.
  for (const room of registerRooms(state)) {
    const reg = registerOf(state, room.id);
    if (room.type === 'shop' && !hasHelper(state, 'cashier')) reg.cashier = null;
    else tickCashier(state, room.id, reg, dt, rand);
  }
}

function tickCashier(state, roomId, reg, dt, rand) {
  const s = spots(state, roomId);
  if (!s) return;
  if (!reg.cashier) {
    reg.cashier = { roomId, x: s.till.x, z: s.till.z, facing: s.till.face, path: [], arriveFacing: s.till.face, serving: null, timer: 0 };
  }
  const m = reg.cashier;
  const H = HELPERS.cashier;
  const scanTime = H.scanTime * (hasUpgrade(state, 'scanner') ? SCANNER.helperSpeed : 1);

  // Step aside for the shopkeeper, or back to the register once she leaves.
  const target = keeperWantsTill(state, roomId, s.counter) ? s.aside : s.till;
  const end = m.path.at(-1) ?? m;
  if (Math.hypot(end.x - target.x, end.z - target.z) > 0.01) {
    m.path = [{ x: target.x, z: target.z }];
    m.arriveFacing = target.face;
  }
  stepAlong(m, MIA_SPEED, dt);
  if (!m.path.length) m.facing = m.arriveFacing;

  // Ring up whoever is at the counter, one item at a time.
  const c = reg.checkout;
  if (!c || !miaAtTill(state, roomId)) {
    m.serving = null;
    return;
  }
  if (m.serving !== c.customerId) {
    m.serving = c.customerId;
    m.timer = Math.max(m.timer, scanTime);
  }
  if ((m.timer -= dt) > 0) return;
  if (c.items.some((i) => !i.scanned)) {
    scanNext(state, roomId);
    m.timer = c.items.some((i) => !i.scanned) ? scanTime : H.ringTime;
  } else {
    completeSale(state, rand, { tip: false, by: 'mia', roomId });
    m.serving = null;
  }
}
