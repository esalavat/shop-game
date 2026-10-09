// The shopkeeper: walks where the player taps, and to furniture or boxes to use them.
// A walk can carry a `task` (pick up a box, stock a shelf) that runs when she arrives. She can also
// walk out to the street and into other ground-floor rooms (GDD #41, sim/route.js).

import { events } from '../core/events.js';
import { useSpot } from '../data/fixtures.js';
import { planRoute, startRoute, finishRoute, settleRoute, shopRoom, GREETER, SHOWOFF } from './route.js';
import { stepAlong } from './walker.js';
import { boxSpot, findFixture, DOORWAY_Z } from './stock.js';
import { performTask } from './tasks.js';
import { hasUpgrade } from './upgrades.js';
import { SHOES_SPEED } from '../data/upgrades.js';

export const KEEPER_SPEED = 1.7; // room units per second

export function createKeeper(roomId) {
  return {
    roomId, x: -1.05, z: -0.42, facing: Math.PI / 6, // behind the shop counter
    path: [], fixtureId: null, arriveFacing: null, task: null,
    carrying: null, // a box { id, itemId, qty } while she holds one
    spare: null,    // a second box on the Stock Cart, unpacked once the first is empty
    arriveRoom: null, // { roomId, offset, from } while walking to another room or the street (sim/route.js)
  };
}

/**
 * Walk to `dest`: a spot in a room ({ roomId, x, z }, room-local; roomId defaults to hers) or on the
 * street ({ street: true, x, z }, shop coordinates). `navs` maps roomId -> walk grid. Walks to another
 * room go out the front and along the sidewalk (sim/route.js).
 */
export function walkTo(state, navs, dest, { fixtureId = null, face = null, task = null } = {}) {
  const k = state.keeper;
  const entered = settleRoute(state, k);
  if (entered) events.emit('keeperEnteredRoom', { roomId: entered });
  const route = planRoute(state, navs, k, dest.street ? dest : { roomId: k.roomId, ...dest });
  if (!route) return false;
  startRoute(state, k, route); // to another room: shop coordinates on the way, the new room on arrival
  k.fixtureId = fixtureId;
  k.arriveFacing = face;
  k.task = task;
  if (!k.path.length) arrive(state); // already standing there
  return true;
}

export function walkToFixture(state, navs, fixture, task = null) {
  const roomId = findFixture(state, fixture.id)?.room.id ?? state.keeper.roomId;
  const spot = useSpot(fixture);
  if (!spot) return walkTo(state, navs, { roomId, x: fixture.x, z: fixture.z }, { task });
  return walkTo(state, navs, { roomId, x: spot.x, z: spot.z }, { fixtureId: fixture.id, face: spot.face, task });
}

export function walkToBox(state, navs, box) {
  const { x } = boxSpot(box.spot);
  return walkTo(state, navs, { roomId: box.roomId, x, z: DOORWAY_Z }, { face: 0, task: { type: 'pickup', boxId: box.id } });
}

/** Out to the greeter spot by the shop door (GDD #41). */
export function walkToGreeter(state, navs) {
  return walkTo(state, navs, { street: true, x: GREETER.x, z: GREETER.z }, { face: GREETER.face });
}

/** Over to the Window Display, beside the Dream Dollhouse, to show it off (GDD #41). */
export function walkToShowOff(state, navs) {
  const room = state.building.rooms.find((r) => r.type === 'display' && r.floor === 0);
  if (!room) return false;
  return walkTo(state, navs, { roomId: room.id, x: SHOWOFF.x, z: SHOWOFF.z }, { face: SHOWOFF.face });
}

/** Standing at the greeter spot, ready to say hello to whoever comes in. */
export function keeperGreeting(state) {
  const k = state.keeper;
  return !k.path.length && k.roomId === shopRoom(state).id && Math.hypot(k.x - GREETER.x, k.z - GREETER.z) < 0.1;
}

export function tickKeeper(state, dt) {
  const speed = KEEPER_SPEED * (hasUpgrade(state, 'shoes') ? SHOES_SPEED : 1);
  if (stepAlong(state.keeper, speed, dt)) arrive(state);
}

function arrive(state) {
  const k = state.keeper;
  if (finishRoute(k)) events.emit('keeperEnteredRoom', { roomId: k.roomId }); // walked over from another room
  if (k.arriveFacing !== null) k.facing = k.arriveFacing;
  const { fixtureId, task } = k;
  k.fixtureId = null;
  k.arriveFacing = null;
  k.task = null;
  events.emit('keeperArrived', { fixtureId, greeting: keeperGreeting(state) });
  performTask(state, task);
}
