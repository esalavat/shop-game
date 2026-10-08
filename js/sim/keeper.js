// The shopkeeper: walks where the player taps, and to furniture or boxes to use them.
// A walk can carry a `task` (pick up a box, stock a shelf) that runs when she arrives.

import { events } from '../core/events.js';
import { FIXTURES } from '../data/fixtures.js';
import { findPath } from './nav.js';
import { stepAlong } from './walker.js';
import { boxSpot } from './stock.js';
import { performTask } from './tasks.js';

export const KEEPER_SPEED = 1.7; // room units per second
const DOORWAY_Z = 1.1; // she leans out from the front edge of the shop to grab doorstep boxes

export function createKeeper(roomId) {
  return {
    roomId, x: -1.05, z: -0.52, facing: 0,
    path: [], fixtureId: null, arriveFacing: null, task: null,
    carrying: null, // a box { id, itemId, qty } while she holds one
  };
}

export function walkTo(state, nav, x, z, { fixtureId = null, face = null, task = null } = {}) {
  const k = state.keeper;
  const path = findPath(nav, k, { x, z });
  if (!path) return false;
  k.path = path;
  k.fixtureId = fixtureId;
  k.arriveFacing = face;
  k.task = task;
  if (!path.length) arrive(state); // already standing there
  return true;
}

export function walkToFixture(state, nav, fixture, task = null) {
  const use = FIXTURES[fixture.kind].use;
  if (!use) return walkTo(state, nav, fixture.x, fixture.z, { task });
  return walkTo(state, nav, fixture.x + use.dx, fixture.z + use.dz, { fixtureId: fixture.id, face: use.face, task });
}

export function walkToBox(state, nav, box) {
  const { x } = boxSpot(box.spot);
  return walkTo(state, nav, x, DOORWAY_Z, { face: 0, task: { type: 'pickup', boxId: box.id } });
}

export function tickKeeper(state, dt) {
  if (stepAlong(state.keeper, KEEPER_SPEED, dt)) arrive(state);
}

function arrive(state) {
  const k = state.keeper;
  if (k.arriveFacing !== null) k.facing = k.arriveFacing;
  const { fixtureId, task } = k;
  k.fixtureId = null;
  k.arriveFacing = null;
  k.task = null;
  events.emit('keeperArrived', { fixtureId });
  performTask(state, task);
}
