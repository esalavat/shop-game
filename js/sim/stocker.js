// Bea the stocker (GDD #51, #53): once hired, she carries delivery boxes from the doorstep to the
// shelves and unpacks them, in the morning, during open hours and in the evening. She fills the
// emptiest shelf in any room, walking over along the sidewalk (sim/route.js); with Sorting Smarts
// (GDD #60) each box goes to its matching theme room when that has space. Unlike Mia, she's saved
// (state.stocker), so a box in her hands is never lost on reload.
//
// Each tick: walk; when she arrives, pause a moment, then do the job (pick up / unpack); when idle,
// plan the next job. Plans are re-checked on arrival, since the shopkeeper may have got there first.

import { HELPERS } from '../data/upgrades.js';
import { useSpot } from '../data/fixtures.js';
import { ITEMS } from '../data/items.js';
import { stepAlong } from './walker.js';
import { hasHelper, hasUpgrade } from './upgrades.js';
import { sellingRooms, themeRoomFor } from './building.js';
import { finishRoute, routeTo } from './route.js';
import { boxSpot, canCarryMore, freeSlots, pickUpBox, shopRoomId, stockShelf, DOORWAY_Z } from './stock.js';

/** Where she waits when there's nothing to do: by the right wall, out of the customers' way. */
export const STOCKER_WAIT = { x: 1.4, z: 0.7, face: 0 };
const WORKING = new Set(['morning', 'open', 'evening']);

export function createStocker(roomId) {
  return {
    roomId, x: STOCKER_WAIT.x, z: STOCKER_WAIT.z, facing: STOCKER_WAIT.face,
    path: [], arriveFacing: null, arriveRoom: null,
    carrying: null, spare: null, // boxes, like the shopkeeper's
    job: null,                    // { type: 'pickup', boxId } | { type: 'stock', fixtureId } on the way / pausing
    timer: 0,                     // the pause before doing the job
  };
}

/** Every shelf with space, in every room: [{ room, fixture }]. */
const shelvesWithRoom = (state) =>
  sellingRooms(state).flatMap((room) => room.fixtures.filter((f) => f.slots && freeSlots(f).length > 0).map((fixture) => ({ room, fixture })));

/**
 * Where the box in her hands goes: the emptiest shelf (in the room she's in, on a tie). With Sorting
 * Smarts, the matching theme room's emptiest shelf first, if it has space.
 */
export function shelfFor(state, b) {
  let pool = shelvesWithRoom(state);
  if (b.carrying && hasUpgrade(state, 'sorting')) {
    const theme = themeRoomFor(state, ITEMS[b.carrying.itemId].set);
    const mine = theme ? pool.filter((s) => s.room.id === theme.id) : [];
    if (mine.length) pool = mine;
  }
  const score = (s) => freeSlots(s.fixture).length * 2 + (s.room.id === b.roomId ? 1 : 0);
  return pool.sort((x, y) => score(y) - score(x))[0] ?? null;
}

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

/** Walk to a spot in any room ({ roomId, x, z }), then do `job` there. */
function walk(state, navs, b, dest, face, job) {
  if (!routeTo(state, navs, b, dest)) return false;
  b.arriveFacing = face;
  b.job = job;
  return true;
}

/** Back to her spot by the shop's right wall, unless she's there. */
function goWait(state, navs, b) {
  const shopId = shopRoomId(state);
  if (b.roomId === shopId && Math.hypot(b.x - STOCKER_WAIT.x, b.z - STOCKER_WAIT.z) <= 0.05) return;
  walk(state, navs, b, { roomId: shopId, x: STOCKER_WAIT.x, z: STOCKER_WAIT.z }, STOCKER_WAIT.face, null);
}

function plan(state, b, navs) {
  const space = shelvesWithRoom(state).reduce((n, s) => n + freeSlots(s.fixture).length, 0);
  const held = (b.carrying?.qty ?? 0) + (b.spare?.qty ?? 0);
  // Fetch a box if there's shelf space for it (and a free hand, or room on the Stock Cart).
  if (space > held && canCarryMore(state, b)) {
    const box = chooseBox(state);
    if (box && walk(state, navs, b, { roomId: box.roomId, x: boxSpot(box.spot).x, z: DOORWAY_Z }, 0, { type: 'pickup', boxId: box.id })) return;
  }
  const target = b.carrying && shelfFor(state, b);
  if (target) {
    const spot = useSpot(target.fixture);
    if (walk(state, navs, b, { roomId: target.room.id, x: spot.x, z: spot.z }, spot.face, { type: 'stock', fixtureId: target.fixture.id })) return;
  }
  // Nothing to do: wait by the wall (holding a box if every shelf is full).
  goWait(state, navs, b);
}

export function tickStocker(state, navs, dt) {
  if (!hasHelper(state, 'stocker')) return;
  const H = HELPERS.stocker;
  if (!state.stocker) state.stocker = createStocker(shopRoomId(state));
  const b = state.stocker;
  if (!navs.get(b.roomId)) return;

  if (b.path.length) {
    if (stepAlong(b, H.speed, dt)) {
      finishRoute(b); // walked over from another room
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
  if (WORKING.has(state.day.phase)) plan(state, b, navs);
  else goWait(state, navs, b);
}
