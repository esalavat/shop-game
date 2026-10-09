// Bea the stocker (GDD #51, #53): once hired, she carries delivery boxes from the doorstep to the
// shelves and unpacks them, in the morning, during open hours and in the evening. She stays in the
// shop room. Unlike Mia, she's saved (state.stocker), so a box in her hands is never lost on reload.
//
// Each tick: walk; when she arrives, pause a moment, then do the job (pick up / unpack); when idle,
// plan the next job. Plans are re-checked on arrival, since the shopkeeper may have got there first.

import { HELPERS } from '../data/upgrades.js';
import { FIXTURES, useSpot } from '../data/fixtures.js';
import { findPath } from './nav.js';
import { stepAlong } from './walker.js';
import { hasHelper } from './upgrades.js';
import { boxSpot, canCarryMore, freeSlots, pickUpBox, shopRoomId, stockShelf, DOORWAY_Z } from './stock.js';

/** Where she waits when there's nothing to do: by the right wall, out of the customers' way. */
export const STOCKER_WAIT = { x: 1.4, z: 0.7, face: 0 };
const WORKING = new Set(['morning', 'open', 'evening']);

export function createStocker(roomId) {
  return {
    roomId, x: STOCKER_WAIT.x, z: STOCKER_WAIT.z, facing: STOCKER_WAIT.face,
    path: [], arriveFacing: null,
    carrying: null, spare: null, // boxes, like the shopkeeper's
    job: null,                    // { type: 'pickup', boxId } | { type: 'stock', fixtureId } on the way / pausing
    timer: 0,                     // the pause before doing the job
  };
}

const shelvesWithRoom = (state, roomId) =>
  (state.building.rooms.find((r) => r.id === roomId)?.fixtures ?? [])
    .filter((f) => FIXTURES[f.kind].slots && freeSlots(f).length > 0)
    .sort((a, b) => freeSlots(b).length - freeSlots(a).length);

const onShelves = (state) => new Set(state.building.rooms.flatMap((r) => r.fixtures.flatMap((f) => f.slots ?? [])).filter(Boolean));

/**
 * Which doorstep box to fetch next: wished-for items first, then items that aren't on the shelves at
 * all, then the lowest box. Never the one the shopkeeper is walking to.
 */
export function chooseBox(state) {
  const k = state.keeper;
  const taken = k.task?.type === 'pickup' ? k.task.boxId : null;
  const wished = new Set(state.wishes.map((w) => w.itemId));
  const shelved = onShelves(state);
  const score = (b) => (wished.has(b.itemId) ? 0 : shelved.has(b.itemId) ? 2 : 1) * 1000 + b.spot;
  return state.boxes
    .filter((b) => b.id !== taken && b.roomId === shopRoomId(state))
    .sort((a, b) => score(a) - score(b))[0] ?? null;
}

function walk(b, nav, to, face, job) {
  const path = findPath(nav, b, to);
  if (!path) return false;
  b.path = path;
  b.arriveFacing = face;
  b.job = job;
  return true;
}

function plan(state, b, nav, H) {
  const shelves = shelvesWithRoom(state, b.roomId);
  const room = shelves.reduce((n, f) => n + freeSlots(f).length, 0);
  const held = (b.carrying?.qty ?? 0) + (b.spare?.qty ?? 0);
  // Fetch a box if there's shelf space for it (and a free hand, or room on the Stock Cart).
  if (room > held && canCarryMore(state, b)) {
    const box = chooseBox(state);
    if (box && walk(b, nav, { x: boxSpot(box.spot).x, z: DOORWAY_Z }, 0, { type: 'pickup', boxId: box.id })) return;
  }
  if (b.carrying && shelves.length) {
    const spot = useSpot(shelves[0]);
    if (walk(b, nav, spot, spot.face, { type: 'stock', fixtureId: shelves[0].id })) return;
  }
  // Nothing to do: wait by the wall (holding a box if every shelf is full).
  if (Math.hypot(b.x - STOCKER_WAIT.x, b.z - STOCKER_WAIT.z) > 0.05) walk(b, nav, STOCKER_WAIT, STOCKER_WAIT.face, null);
}

export function tickStocker(state, navs, dt) {
  if (!hasHelper(state, 'stocker')) return;
  const H = HELPERS.stocker;
  const roomId = shopRoomId(state);
  const nav = navs.get(roomId);
  if (!state.stocker) state.stocker = createStocker(roomId);
  const b = state.stocker;
  if (!nav) return;

  if (b.path.length) {
    if (stepAlong(b, H.speed, dt)) {
      if (b.arriveFacing !== null) b.facing = b.arriveFacing;
      b.timer = b.job ? H.pause : 0;
    }
    return;
  }
  if (b.job) {
    if ((b.timer -= dt) > 0) return;
    const job = b.job;
    b.job = null;
    if (job.type === 'pickup') pickUpBox(state, job.boxId, b, 'stocker'); // gone already? she just re-plans
    else stockShelf(state, job.fixtureId, b, 'stocker');
    return;
  }
  if (WORKING.has(state.day.phase)) plan(state, b, nav, H);
  else if (Math.hypot(b.x - STOCKER_WAIT.x, b.z - STOCKER_WAIT.z) > 0.05) walk(b, nav, STOCKER_WAIT, STOCKER_WAIT.face, null);
}
