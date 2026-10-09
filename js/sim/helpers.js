// Helpers (GDD §10, #36). Mia the cashier stands at the register and rings customers up at a steady
// pace (no tips). When the shopkeeper comes to the counter, Mia steps aside and the player takes over.
// Her position is live-only (state.cashier, in TRANSIENT): on load she's simply back at the register.

import { useSpot } from '../data/fixtures.js';
import { HELPERS } from '../data/upgrades.js';
import { stepAlong } from './walker.js';
import { counterOf, keeperAtCounter, scanNext, completeSale } from './checkout.js';
import { hasHelper } from './upgrades.js';
import { shopRoomId } from './stock.js';

const MIA_SPEED = 1.0;
const ASIDE = { dx: -0.42, dz: -0.1, face: Math.PI / 2 }; // beside the register, turned toward it

function spots(state) {
  const counter = counterOf(state, shopRoomId(state));
  if (!counter) return null;
  const till = useSpot(counter);
  return { counter, till, aside: { x: till.x + ASIDE.dx, z: till.z + ASIDE.dz, face: ASIDE.face } };
}

/** Is the shopkeeper behind the counter, or on her way there? Then Mia makes room. */
function keeperWantsTill(state, counter) {
  return keeperAtCounter(state) || state.keeper.fixtureId === counter.id;
}

/** True when Mia is standing at the register, ready to serve. */
export function miaAtTill(state) {
  const m = state.cashier;
  if (!m || m.path.length) return false;
  const s = spots(state);
  return !!s && !keeperWantsTill(state, s.counter) && Math.hypot(m.x - s.till.x, m.z - s.till.z) < 0.05;
}

/** Someone (the shopkeeper or Mia) is at the register to ring the next customer up. */
export function cashierReady(state) {
  return keeperAtCounter(state) || miaAtTill(state);
}

export function tickHelpers(state, dt, rand = Math.random) {
  if (!hasHelper(state, 'cashier')) {
    state.cashier = null;
    return;
  }
  const s = spots(state);
  if (!s) return;
  const roomId = shopRoomId(state);
  if (!state.cashier) {
    state.cashier = { roomId, x: s.till.x, z: s.till.z, facing: s.till.face, path: [], arriveFacing: s.till.face, serving: null, timer: 0 };
  }
  const m = state.cashier;
  const H = HELPERS.cashier;

  // Step aside for the shopkeeper, or back to the register once she leaves.
  const target = keeperWantsTill(state, s.counter) ? s.aside : s.till;
  const end = m.path.at(-1) ?? m;
  if (Math.hypot(end.x - target.x, end.z - target.z) > 0.01) {
    m.path = [{ x: target.x, z: target.z }];
    m.arriveFacing = target.face;
  }
  stepAlong(m, MIA_SPEED, dt);
  if (!m.path.length) m.facing = m.arriveFacing;

  // Ring up whoever is at the counter, one item at a time.
  const c = state.checkout;
  if (!c || !miaAtTill(state)) {
    m.serving = null;
    return;
  }
  if (m.serving !== c.customerId) {
    m.serving = c.customerId;
    m.timer = Math.max(m.timer, H.scanTime);
  }
  if ((m.timer -= dt) > 0) return;
  if (c.items.some((i) => !i.scanned)) {
    scanNext(state);
    m.timer = c.items.some((i) => !i.scanned) ? H.scanTime : H.ringTime;
  } else {
    completeSale(state, rand, { tip: false, by: 'mia' });
    m.serving = null;
  }
}
