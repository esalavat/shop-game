// The shopkeeper: walks where the player taps, and to furniture or boxes to use them.
// A walk can carry a `task` (pick up a box, stock a shelf) that runs when she arrives.

import { events } from '../core/events.js';
import { useSpot } from '../data/fixtures.js';
import { findPath } from './nav.js';
import { stepAlong } from './walker.js';
import { boxSpot } from './stock.js';
import { performTask } from './tasks.js';
import { hasUpgrade } from './upgrades.js';
import { SHOES_SPEED } from '../data/upgrades.js';

export const KEEPER_SPEED = 1.7; // room units per second
const DOORWAY_Z = 1.1; // she leans out from the front edge of the shop to grab doorstep boxes

export function createKeeper(roomId) {
  return {
    roomId, x: -1.05, z: -0.42, facing: Math.PI / 6, // behind the shop counter
    path: [], fixtureId: null, arriveFacing: null, task: null,
    carrying: null, // a box { id, itemId, qty } while she holds one
    spare: null,    // a second box on the Stock Cart, unpacked once the first is empty
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
  const spot = useSpot(fixture);
  if (!spot) return walkTo(state, nav, fixture.x, fixture.z, { task });
  return walkTo(state, nav, spot.x, spot.z, { fixtureId: fixture.id, face: spot.face, task });
}

export function walkToBox(state, nav, box) {
  const { x } = boxSpot(box.spot);
  return walkTo(state, nav, x, DOORWAY_Z, { face: 0, task: { type: 'pickup', boxId: box.id } });
}

export function tickKeeper(state, dt) {
  const speed = KEEPER_SPEED * (hasUpgrade(state, 'shoes') ? SHOES_SPEED : 1);
  if (stepAlong(state.keeper, speed, dt)) arrive(state);
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
