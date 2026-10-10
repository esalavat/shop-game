// Stockers (GDD #51, #53, #72): Bea, then Theo and Juno, once hired. Each carries delivery boxes from
// the doorstep to the shelves and unpacks them, in the morning, during open hours and in the evening,
// filling the emptiest shelf in any room, walking over along the sidewalk or up the stairs
// (sim/route.js). Unlike Mia, they're saved (state.stockers, each with `who`: its HELPERS id), so a
// box in their hands is never lost on reload. They never fetch the same box.
//
// Each tick: walk; when she arrives, pause a moment, then do the job (pick up / unpack); when idle,
// plan the next job. Plans are re-checked on arrival, since the shopkeeper may have got there first.

import { HELPERS, SKATES_SPEED } from '../data/upgrades.js';
import { useSpot } from '../data/fixtures.js';
import { hasHelper, hasUpgrade } from './upgrades.js';
import { sellingRooms } from './building.js';
import { finishRoute, routeTo, walkRoute } from './route.js';
import { boxSpot, canCarryMore, freeSlots, pickUpBox, shopRoomId, stockShelf, DOORWAY_Z } from './stock.js';

/** Where Bea waits when there's nothing to do: by the right wall, out of the customers' way. */
export const STOCKER_WAIT = { x: 1.4, z: 0.7, face: 0 };
/** The stockers you can hire, in order (HELPERS ids); each waits a little further from the wall. */
export const STOCKERS = ['stocker', 'stocker2', 'stocker3'];
const waitSpot = (who) => ({ ...STOCKER_WAIT, x: STOCKER_WAIT.x - STOCKERS.indexOf(who) * 0.35 });
const WORKING = new Set(['morning', 'open', 'evening']);

export function createStocker(roomId, who = 'stocker') {
  const wait = waitSpot(who);
  return {
    who, roomId, x: wait.x, z: wait.z, facing: wait.face,
    path: [], arriveFacing: null, arriveRoom: null, legs: [], y: 0,
    carrying: null, spare: null, // boxes, like the shopkeeper's
    job: null,                    // { type: 'pickup', boxId } | { type: 'stock', fixtureId } on the way / pausing
    timer: 0,                     // the pause before doing the job
  };
}

/** Every shelf with space, in every room: [{ room, fixture }]. */
const shelvesWithRoom = (state) =>
  sellingRooms(state).flatMap((room) => room.fixtures.filter((f) => f.slots && freeSlots(f).length > 0).map((fixture) => ({ room, fixture })));

/** Where the box in her hands goes: the emptiest shelf (in the room she's in, on a tie). */
export function shelfFor(state, b) {
  const score = (s) => freeSlots(s.fixture).length * 2 + (s.room.id === b.roomId ? 1 : 0);
  return shelvesWithRoom(state).sort((x, y) => score(y) - score(x))[0] ?? null;
}

const onShelves = (state) => new Set(state.building.rooms.flatMap((r) => r.fixtures.flatMap((f) => f.slots ?? [])).filter(Boolean));

/**
 * Which doorstep box to fetch next: wished-for items first, then items that aren't on the shelves at
 * all, then the lowest box. Never the one the shopkeeper or another stocker is heading for.
 */
export function chooseBox(state, me = null) {
  const k = state.keeper;
  const taken = new Set([k.task?.type === 'pickup' ? k.task.boxId : null]);
  for (const o of state.stockers) if (o !== me && o.job?.type === 'pickup') taken.add(o.job.boxId);
  const wished = new Set(state.wishes.map((w) => w.itemId));
  const shelved = onShelves(state);
  const score = (b) => (wished.has(b.itemId) ? 0 : shelved.has(b.itemId) ? 2 : 1) * 1000 + b.spot;
  return state.boxes
    .filter((b) => !taken.has(b.id) && b.roomId === shopRoomId(state))
    .sort((a, b) => score(a) - score(b))[0] ?? null;
}

/** Walk to a spot in any room ({ roomId, x, z }), then do `job` there. */
function walk(state, navs, b, dest, face, job) {
  if (!routeTo(state, navs, b, dest)) return false;
  b.arriveFacing = face;
  b.job = job;
  return true;
}

/** Back to their spot by the shop's right wall, unless they're there. */
function goWait(state, navs, b) {
  const shopId = shopRoomId(state), wait = waitSpot(b.who);
  if (b.roomId === shopId && Math.hypot(b.x - wait.x, b.z - wait.z) <= 0.05) return;
  walk(state, navs, b, { roomId: shopId, x: wait.x, z: wait.z }, wait.face, null);
}

function plan(state, b, navs) {
  const space = shelvesWithRoom(state).reduce((n, s) => n + freeSlots(s.fixture).length, 0);
  const held = (b.carrying?.qty ?? 0) + (b.spare?.qty ?? 0);
  // Fetch a box if there's shelf space for it (and a free hand, or room on the Stock Cart).
  if (space > held && canCarryMore(state, b)) {
    const box = chooseBox(state, b);
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

export function tickStockers(state, navs, dt) {
  for (const who of STOCKERS) {
    if (hasHelper(state, who) && !state.stockers.some((b) => b.who === who)) state.stockers.push(createStocker(shopRoomId(state), who));
  }
  for (const b of state.stockers) tickStocker(state, navs, b, dt);
}

function tickStocker(state, navs, b, dt) {
  const H = HELPERS.stocker; // they all work at Bea's pace
  if (!navs.get(b.roomId)) return;

  if (b.path.length) {
    if (walkRoute(state, b, H.speed * (hasUpgrade(state, 'skates') ? SKATES_SPEED : 1), dt)) {
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
    if (job.type === 'pickup') pickUpBox(state, job.boxId, b, b.who); // gone already? they just re-plan
    else stockShelf(state, job.fixtureId, b, b.who);
    return;
  }
  if (WORKING.has(state.day.phase)) plan(state, b, navs);
  else goWait(state, navs, b);
}
