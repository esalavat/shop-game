// The shopkeeper: walks where the player taps, and to furniture to use it.

import { events } from '../core/events.js';
import { FIXTURES } from '../data/fixtures.js';
import { findPath } from './nav.js';

export const KEEPER_SPEED = 1.7; // room units per second

export function createKeeper(roomId) {
  return { roomId, x: 1.05, z: -0.48, facing: 0, path: [], fixtureId: null, arriveFacing: null };
}

export function walkTo(state, nav, x, z, { fixtureId = null, face = null } = {}) {
  const k = state.keeper;
  const path = findPath(nav, k, { x, z });
  if (!path) return false;
  k.path = path;
  k.fixtureId = fixtureId;
  k.arriveFacing = face;
  return true;
}

export function walkToFixture(state, nav, fixture) {
  const use = FIXTURES[fixture.kind].use;
  if (!use) return walkTo(state, nav, fixture.x, fixture.z);
  return walkTo(state, nav, fixture.x + use.dx, fixture.z + use.dz, { fixtureId: fixture.id, face: use.face });
}

export function tickKeeper(state, dt) {
  const k = state.keeper;
  if (!k.path.length) return;
  let step = KEEPER_SPEED * dt;
  while (step > 0 && k.path.length) {
    const p = k.path[0];
    const dx = p.x - k.x, dz = p.z - k.z, d = Math.hypot(dx, dz);
    if (d > 1e-4) k.facing = Math.atan2(dx, dz);
    if (d <= step) {
      k.x = p.x;
      k.z = p.z;
      step -= d;
      k.path.shift();
    } else {
      k.x += (dx / d) * step;
      k.z += (dz / d) * step;
      step = 0;
    }
  }
  if (!k.path.length) {
    if (k.arriveFacing !== null) k.facing = k.arriveFacing;
    events.emit('keeperArrived', { fixtureId: k.fixtureId });
    k.fixtureId = null;
    k.arriveFacing = null;
  }
}
