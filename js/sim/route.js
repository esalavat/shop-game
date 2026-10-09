// Getting around the building (GDD #41, #58). Inside one room the walk grid (nav.js) finds the way.
// To another room, or out onto the street, people walk out the front of their room, along the
// sidewalk, and in the front of the other room. The street uses the shop room's local coordinates,
// so a walk between rooms is planned entirely in shop coordinates and they only switch rooms when
// they arrive. The shopkeeper, customers and Bea all walk this way (startRoute / finishRoute).

import { ROOM_SIZE } from '../data/rooms.js';
import { findPath } from './nav.js';
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

export const shopRoom = (state) => state.building.rooms.find((r) => r.type === 'shop') ?? state.building.rooms[0];
export const doorOf = (room) => DOOR[room.type] ?? DOOR.other;

/** How far a ground-floor room is from the shop room, along x. */
export function roomOffset(state, room) {
  return (room.col - shopRoom(state).col) * (ROOM_SIZE.W + ROOM_SIZE.T);
}

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

const shift = (pts, dx) => pts.map((p) => ({ x: p.x + dx, z: p.z }));

/**
 * Plan a walk from `from` ({ roomId, x, z }) to `dest`: a room spot ({ roomId, x, z }, room-local) or
 * a street spot ({ street: true, x, z }, shop coordinates). Returns null if there's no way there, or
 * { path, fromOffset, arriveRoomId, arriveOffset }: if fromOffset/arriveRoomId say she changes rooms,
 * the path is in shop coordinates (shift her by fromOffset first, and by -arriveOffset on arrival).
 */
export function planRoute(state, navs, from, dest) {
  const shop = shopRoom(state);
  const fromStreet = onStreet(state, from);
  if (!dest.street && !fromStreet && dest.roomId === from.roomId) {
    const path = findPath(navs.get(from.roomId), from, dest);
    return path && { path, fromOffset: 0, arriveRoomId: from.roomId, arriveOffset: 0 };
  }

  const fromRoom = state.building.rooms.find((r) => r.id === from.roomId);
  const fromOffset = roomOffset(state, fromRoom);
  const path = [];
  if (fromStreet) {
    path.push({ x: from.x, z: SIDEWALK.lane });
  } else {
    const door = doorOf(fromRoom);
    const inside = findPath(navs.get(fromRoom.id), from, door);
    if (!inside) return null;
    path.push(...shift(inside, fromOffset), { x: door.x + fromOffset, z: SIDEWALK.lane });
  }

  if (dest.street) {
    path.push({ x: dest.x, z: SIDEWALK.lane }, { x: dest.x, z: dest.z });
    return { path, fromOffset, arriveRoomId: shop.id, arriveOffset: 0 };
  }
  const toRoom = state.building.rooms.find((r) => r.id === dest.roomId);
  if (!toRoom || toRoom.floor !== 0) return null; // no stairs yet
  const toOffset = roomOffset(state, toRoom);
  const door = doorOf(toRoom);
  const inside = findPath(navs.get(toRoom.id), door, dest);
  if (!inside) return null;
  path.push({ x: door.x + toOffset, z: SIDEWALK.lane }, { x: door.x + toOffset, z: door.z }, ...shift(inside, toOffset));
  return { path, fromOffset, arriveRoomId: toRoom.id, arriveOffset: toOffset };
}

/**
 * Set someone (the shopkeeper, a customer, Bea: anything with roomId, x, z, path) off on a planned
 * route. When it changes rooms they walk in shop coordinates, with `arriveRoom` saying where they'll be.
 */
export function startRoute(state, agent, route) {
  if (route.fromOffset || route.arriveRoomId !== agent.roomId) {
    agent.arriveRoom = { roomId: route.arriveRoomId, offset: route.arriveOffset, from: agent.roomId };
    agent.x += route.fromOffset;
    agent.roomId = shopRoom(state).id;
  } else {
    agent.arriveRoom = null;
  }
  agent.path = route.path;
}

/** At the end of a route: back into the destination room's coordinates. True if they changed rooms. */
export function finishRoute(agent) {
  const a = agent.arriveRoom;
  if (!a) return false;
  agent.x -= a.offset;
  agent.roomId = a.roomId;
  agent.arriveRoom = null;
  return a.roomId !== a.from;
}

/**
 * Mid-walk between rooms they're in shop coordinates. Before planning a new walk, put them back in
 * the room they're actually standing in (or leave them on the street). Returns the room they've just
 * stepped into, if it's a different one, else null.
 */
export function settleRoute(state, agent) {
  if (!agent.arriveRoom) return null;
  const from = agent.arriveRoom.from;
  agent.arriveRoom = null;
  if (onStreet(state, agent)) return null;
  const half = ROOM_SIZE.W / 2;
  const room = state.building.rooms.find((r) => r.floor === 0 && Math.abs(agent.x - roomOffset(state, r)) <= half);
  if (!room) return null;
  agent.x -= roomOffset(state, room);
  agent.roomId = room.id;
  return room.id !== from ? room.id : null;
}

/** Plan and start a walk to `dest` (see planRoute), from wherever they are. False if there's no way. */
export function routeTo(state, navs, agent, dest) {
  settleRoute(state, agent);
  const route = planRoute(state, navs, agent, dest);
  if (!route) return false;
  startRoute(state, agent, route);
  return true;
}
