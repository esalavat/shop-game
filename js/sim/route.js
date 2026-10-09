// Getting around the building (GDD #41, #58). Inside one room the walk grid (nav.js) finds the way.
// To another ground-floor room, or out onto the street, people walk out the front of their room,
// along the sidewalk, and in the front of the other room. Upstairs (GDD #58), they go up the spiral
// stairs in the Stairwell and through the doorways between upstairs rooms.
//
// A route is a list of legs. Each leg is walked in one room's coordinates (its `frame`) and ends in
// `arrive`: ground legs between rooms use the shop's frame (the street is in shop coordinates),
// upstairs legs the room they start in, and the climb the ground Stairwell's (with `y` rising up the
// stairs). Rooms sit (W + T) apart in x and (H + T) apart in y, so switching frames is just an offset.
// The shopkeeper, customers and Bea all walk this way (startRoute / walkRoute / finishRoute).

import { ROOM_SIZE } from '../data/rooms.js';
import { findPath } from './nav.js';
import { stepAlong } from './walker.js';
import { DOORSTEP_Y } from './stock.js';

/** The sidewalk, in shop-room coordinates: anything past `edgeZ` is outside, on the street. */
export const SIDEWALK = { edgeZ: 1.3, lane: 2.0, minZ: 1.6, maxZ: 2.1 };
/** Where each room type's front door is (room-local), just inside its open front. */
const DOOR = { shop: { x: 0.4, z: 1.1 }, other: { x: 0, z: 1.1 } };
/** The greeter spot: on the sidewalk by the shop door, left of it (boxes sit to the right). */
export const GREETER = { x: -0.15, z: 1.75, face: 0 };
/**
 * The show-off spot in the Window Display (room-local): just behind the Dream Dollhouse's left side,
 * so the dollhouse is in front of her and she never hides it (or stands behind a plant). The bonus
 * counts anywhere in the room; this is just the best place to stand.
 */
export const SHOWOFF = { x: -0.75, z: -0.55, face: 0 };
const STEP_DEPTH = 0.25; // the front step from a room's floor down to the sidewalk

/** Height of one floor: a room plus the slab above it. */
export const FLOOR_H = ROOM_SIZE.H + ROOM_SIZE.T;
/**
 * The spiral stairs in the Stairwell's back-left corner (room-local; fixtures `stairs` / `stairhole`):
 * one turn around the pole at `center`, walked at `radius`. People step on at `foot` downstairs and
 * off at the same spot upstairs.
 */
export const STAIRS = { center: { x: -1.1, z: -0.7 }, radius: 0.42, foot: { x: -0.25, z: -0.7 }, steps: 14 };
/** Doorways in the side walls between upstairs rooms: where people stand to go through (room-local, x = ±). */
export const DOORWAY = { x: ROOM_SIZE.W / 2 - 0.25, z: 0.25, w: 0.7, h: 1.9 };

export const shopRoom = (state) => state.building.rooms.find((r) => r.type === 'shop') ?? state.building.rooms[0];
export const doorOf = (room) => DOOR[room.type] ?? DOOR.other;

/** How far a room is from the shop room, along x. */
export function roomOffset(state, room) {
  return (room.col - shopRoom(state).col) * (ROOM_SIZE.W + ROOM_SIZE.T);
}

const roomById = (state, id) => state.building.rooms.find((r) => r.id === id);
const roomAt = (state, col, floor) => state.building.rooms.find((r) => r.col === col && r.floor === floor);
/** The two halves of the Stairwell (GDD #58), or null before it's built. */
export const stairwell = (state) => {
  const bottom = state.building.rooms.find((r) => r.type === 'stairs');
  const top = bottom && roomAt(state, bottom.col, 1);
  return top ? { bottom, top } : null;
};
/** Offsets from room `a`'s coordinates to room `b`'s. */
const dx = (a, b) => (a.col - b.col) * (ROOM_SIZE.W + ROOM_SIZE.T);
const dy = (a, b) => (a.floor - b.floor) * FLOOR_H;

/** Is this person (room-local x, z with a roomId) out on the street? */
export const onStreet = (state, p) => p.roomId === shopRoom(state).id && p.z > SIDEWALK.edgeZ;

/** Height above the floor at shop-local depth z (drops down the front step to the sidewalk). */
export const groundAt = (z) => DOORSTEP_Y * Math.min(1, Math.max(0, (z - SIDEWALK.edgeZ) / STEP_DEPTH));

/** The stretch of sidewalk in front of the building (shop x), so she never wanders off-screen. */
export function streetBounds(state) {
  const offs = state.building.rooms.filter((r) => r.floor === 0).map((r) => roomOffset(state, r));
  const half = ROOM_SIZE.W / 2 - 0.25;
  return { minX: Math.min(...offs) - half, maxX: Math.max(...offs) + half };
}

const shift = (pts, off) => pts.map((p) => ({ x: p.x + off, z: p.z }));

/** The way up the spiral, in the ground Stairwell's coordinates: on at the foot, one turn, off upstairs. */
function climbPath() {
  const { center: c, radius: r, foot } = STAIRS, n = 16;
  const pts = [];
  for (let i = 0; i <= n; i++) {
    const a = (i / n) * Math.PI * 2;
    pts.push({ x: c.x + r * Math.cos(a), z: c.z - r * Math.sin(a), y: (i / n) * FLOOR_H });
  }
  pts.push({ x: foot.x, z: foot.z, y: FLOOR_H });
  return pts;
}

const leg = (frame, path, arrive, climb = false) => ({ frame: frame.id, path, arrive: arrive.id, climb });

/**
 * Along the ground floor: from `at` ({ room, x, z } room-local, or { street: true, x, z } in shop
 * coordinates) to `to` (a ground room and a spot in it, or a street spot). Inside one room it's a walk
 * in that room; anywhere else it's out the front, along the sidewalk, and in the other front.
 */
function groundLeg(state, navs, at, toRoom, to, toStreet) {
  if (!at.street && !toStreet && at.room.id === toRoom.id) {
    const path = findPath(navs.get(toRoom.id), at, to);
    return path && leg(toRoom, path, toRoom);
  }
  const shop = shopRoom(state);
  const path = [];
  if (at.street) {
    path.push({ x: at.x, z: SIDEWALK.lane });
  } else {
    const off = roomOffset(state, at.room), door = doorOf(at.room);
    const inside = findPath(navs.get(at.room.id), at, door);
    if (!inside) return null;
    path.push(...shift(inside, off), { x: door.x + off, z: SIDEWALK.lane });
  }
  if (toStreet) {
    path.push({ x: to.x, z: SIDEWALK.lane }, { x: to.x, z: to.z });
    return leg(shop, path, shop);
  }
  const off = roomOffset(state, toRoom), door = doorOf(toRoom);
  const inside = findPath(navs.get(toRoom.id), door, to);
  if (!inside) return null;
  path.push({ x: door.x + off, z: SIDEWALK.lane }, { x: door.x + off, z: door.z }, ...shift(inside, off));
  return leg(shop, path, toRoom);
}

/** Upstairs: from `at` ({ room, x, z }) through the doorways to a spot in `toRoom`, in the first room's coordinates. */
function upperLeg(state, navs, at, toRoom, to) {
  const from = at.room, dir = Math.sign(toRoom.col - from.col);
  const path = [];
  let room = from, cur = { x: at.x, z: at.z };
  while (room.id !== toRoom.id) {
    const next = roomAt(state, room.col + dir, room.floor);
    if (!next) return null;
    const inside = findPath(navs.get(room.id), cur, { x: dir * DOORWAY.x, z: DOORWAY.z });
    if (!inside) return null;
    path.push(...shift(inside, dx(room, from)));
    cur = { x: -dir * DOORWAY.x, z: DOORWAY.z };
    path.push({ x: cur.x + dx(next, from), z: cur.z });
    room = next;
  }
  const inside = findPath(navs.get(toRoom.id), cur, to);
  if (!inside) return null;
  path.push(...shift(inside, dx(toRoom, from)));
  return leg(from, path, toRoom);
}

/**
 * Plan a walk from `from` ({ roomId, x, z }) to `dest`: a room spot ({ roomId, x, z }, room-local) or
 * a street spot ({ street: true, x, z }, shop coordinates). Returns { legs } (see the top of this
 * file), or null if there's no way there.
 */
export function planRoute(state, navs, from, dest) {
  const fromRoom = roomById(state, from.roomId);
  const toRoom = dest.street ? shopRoom(state) : roomById(state, dest.roomId);
  if (!fromRoom || !toRoom) return null;
  let at = onStreet(state, from) ? { street: true, x: from.x, z: from.z } : { room: fromRoom, x: from.x, z: from.z };
  const legs = [];
  const toFloor = dest.street ? 0 : toRoom.floor;
  if (fromRoom.floor !== toFloor) {
    const st = stairwell(state);
    if (!st || Math.max(fromRoom.floor, toFloor) > 1) return null; // one upstairs floor for now
    const { foot } = STAIRS, climb = climbPath();
    if (toFloor > 0) { // up: to the foot of the stairs, then round and up
      legs.push(groundLeg(state, navs, at, st.bottom, foot, false), leg(st.bottom, climb, st.top, true));
      at = { room: st.top, ...foot };
    } else { // down: across to the top of the stairs, then round and down
      legs.push(upperLeg(state, navs, at, st.top, foot), leg(st.bottom, climb.slice(0, -1).reverse().concat({ ...foot, y: 0 }), st.bottom, true));
      at = { room: st.bottom, ...foot };
    }
  }
  legs.push(toFloor > 0 ? upperLeg(state, navs, at, toRoom, dest) : groundLeg(state, navs, at, toRoom, dest, !!dest.street));
  return legs.every(Boolean) ? { legs } : null;
}

/** Start walking a leg: into its frame's coordinates, with `arriveRoom` saying where it ends. */
function beginLeg(state, agent, l, from) {
  const cur = roomById(state, agent.roomId), frame = roomById(state, l.frame), arrive = roomById(state, l.arrive);
  agent.x += dx(cur, frame);
  agent.y = (agent.y ?? 0) + dy(cur, frame);
  agent.roomId = frame.id;
  agent.path = l.path.map((p) => ({ ...p }));
  agent.arriveRoom = arrive.id === frame.id && from === arrive.id && !l.climb
    ? null
    : { roomId: arrive.id, offset: dx(arrive, frame), dy: dy(arrive, frame), from, climb: l.climb };
}

/** At the end of a leg: back into the room they've reached. */
function endLeg(agent) {
  const a = agent.arriveRoom;
  if (!a) return;
  agent.x -= a.offset;
  agent.y = Math.abs((agent.y ?? 0) - (a.dy ?? 0)) < 1e-6 ? 0 : (agent.y ?? 0) - (a.dy ?? 0);
  agent.roomId = a.roomId;
}

/** Done with this leg (or it's empty): on to the next one. True if there's more to walk. */
function nextLeg(state, agent) {
  while (!agent.path.length && agent.legs?.length) {
    const from = agent.arriveRoom?.from ?? agent.roomId;
    endLeg(agent);
    agent.arriveRoom = null;
    beginLeg(state, agent, agent.legs.shift(), from);
  }
  return agent.path.length > 0;
}

/** Climbing the stairs right now (they finish the climb before going anywhere else). */
export const onStairs = (agent) => !!agent.arriveRoom?.climb && agent.path.length > 0;

/** Where a new walk starts from: where they are, or the end of the stairs they're on. */
export function routeStart(agent) {
  if (!onStairs(agent)) return agent;
  const a = agent.arriveRoom, end = agent.path.at(-1);
  return { roomId: a.roomId, x: end.x - a.offset, z: end.z };
}

/**
 * Set someone (the shopkeeper, a customer, Bea: anything with roomId, x, z, path) off on a planned
 * route. Someone on the stairs finishes the climb first, then carries on (the route was planned from
 * its end, see routeStart).
 */
export function startRoute(state, agent, route) {
  if (onStairs(agent)) {
    agent.legs = route.legs;
    return;
  }
  agent.legs = route.legs.slice(1);
  beginLeg(state, agent, route.legs[0], agent.roomId);
  nextLeg(state, agent);
}

/** The path of the route's last leg (to add more walking at the very end). */
export const routeEndPath = (agent) => (agent.legs?.length ? agent.legs.at(-1).path : agent.path);

/** Where the route ends: { roomId, x, z, y } in the coordinates of the room it's walked in then. */
export function routeEnd(agent) {
  const l = agent.legs?.at(-1), p = (l ? l.path : agent.path).at(-1);
  return p && { roomId: l ? l.frame : agent.roomId, x: p.x, z: p.z, y: p.y ?? 0 };
}

/** Walk along the route. True on the step they reach the end of it (then call finishRoute). */
export function walkRoute(state, agent, speed, dt) {
  if (!stepAlong(agent, speed, dt)) return false;
  return !nextLeg(state, agent);
}

/** At the end of a route: back into the destination room's coordinates. True if they changed rooms. */
export function finishRoute(agent) {
  const a = agent.arriveRoom;
  agent.legs = [];
  if (!a) return false;
  endLeg(agent);
  agent.arriveRoom = null;
  return a.roomId !== a.from;
}

/**
 * Mid-walk between rooms they're in another room's coordinates. Before planning a new walk, put them
 * back in the room they're actually standing in (or leave them on the street). Someone on the stairs
 * stays on them (see routeStart). Returns the room they've just stepped into, if it's a different
 * one, else null.
 */
export function settleRoute(state, agent) {
  if (onStairs(agent)) return null;
  agent.legs = [];
  if (!agent.arriveRoom) return null;
  const from = agent.arriveRoom.from;
  agent.arriveRoom = null;
  if (onStreet(state, agent)) return null;
  const frame = roomById(state, agent.roomId);
  const half = (ROOM_SIZE.W + ROOM_SIZE.T) / 2;
  const room = state.building.rooms.find((r) => r.floor === frame.floor && Math.abs(agent.x - dx(r, frame)) <= half);
  if (!room) return null;
  agent.x -= dx(room, frame);
  agent.roomId = room.id;
  return room.id !== from ? room.id : null;
}

/** Plan and start a walk to `dest` (see planRoute), from wherever they are. False if there's no way. */
export function routeTo(state, navs, agent, dest) {
  settleRoute(state, agent);
  const route = planRoute(state, navs, routeStart(agent), dest);
  if (!route) return false;
  startRoute(state, agent, route);
  return true;
}
