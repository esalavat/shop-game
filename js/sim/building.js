// Building grid actions. Rooms sit on a (col, floor) grid that grows sideways and upward.

import { events } from '../core/events.js';
import { ROOM_TYPES, ROOM_SIZE, THEME_ROOMS, THEME_ROOM_COSTS, STAIRWELL_COST, TOP_FLOOR } from '../data/rooms.js';
import { FIXTURES } from '../data/fixtures.js';
import { EXPANSIONS } from '../data/dollhouse.js';
import { addCoins } from './economy.js';
import { newId } from './stock.js';

export const hasRoom = (state, col, floor) =>
  state.building.rooms.some((r) => r.col === col && r.floor === floor);

/** The starting furniture for a room type, with ids unique to the room. */
export function defaultFixtures(type, roomId) {
  return ROOM_TYPES[type].fixtures.map((f, i) => withSlots({ id: `${roomId}-f${i}`, ...f }));
}

/** Give a fixture empty item slots if its kind has any (shelves). */
export function withSlots(f) {
  const n = FIXTURES[f.kind].slots;
  return n && !f.slots ? { ...f, slots: Array(n).fill(null) } : f;
}

export function makeRoom(id, type, col, floor) {
  return { id, type, col, floor, fixtures: defaultFixtures(type, id) };
}

export function addRoom(state, type, col, floor) {
  if (hasRoom(state, col, floor)) return null;
  if (floor > 0 && !hasRoom(state, col, floor - 1)) return null; // nothing floats
  if (floor > TOP_FLOOR) return null;
  const room = makeRoom(newId(state, 'r'), type, col, floor);
  state.building.rooms.push(room);
  events.emit('buildingChanged', { room });
  return room;
}

/** The next expansion the shop can buy ({ type, cost }), or null when there are none left. */
export function nextExpansion(state) {
  return EXPANSIONS.find((e) => !state.building.rooms.some((r) => r.type === e.type)) ?? null;
}

/** Buy the next expansion: a new ground-floor room on the right end of the shop. */
export function buildExpansion(state) {
  const next = nextExpansion(state);
  if (!next || state.coins < next.cost) return null;
  const col = Math.max(...state.building.rooms.filter((r) => r.floor === 0).map((r) => r.col)) + 1;
  addCoins(state, -next.cost);
  const room = addRoom(state, next.type, col, 0);
  events.emit('expanded', { room });
  return room;
}

// ---------------------------------------------------------------------------
// Theme rooms (GDD #58): Grow -> Build a room -> pick a theme -> tap a + spot.
// ---------------------------------------------------------------------------

export const isThemeRoom = (room) => !!ROOM_TYPES[room.type]?.theme;
/** Rooms with shelves, where customers shop (the shop and the theme rooms). */
export const sellingRooms = (state) => state.building.rooms.filter((r) => r.fixtures.some((f) => f.slots));
/** The theme room for an item's Collection theme, if it's been built. */
export const themeRoomFor = (state, theme) => state.building.rooms.find((r) => ROOM_TYPES[r.type]?.theme === theme) ?? null;

/** Theme rooms open up once the Window Display is built (it stays the first milestone). */
export const canBuildThemeRooms = (state) => state.building.rooms.some((r) => r.type === 'display');

/** Themes not built yet. One room per theme. */
export const themesLeft = (state) => THEME_ROOMS.filter((t) => !state.building.rooms.some((r) => r.type === t));

/** What the next theme room costs. */
export function themeRoomCost(state) {
  const built = state.building.rooms.filter(isThemeRoom).length;
  return THEME_ROOM_COSTS[Math.min(built, THEME_ROOM_COSTS.length - 1)];
}

/**
 * Where a new room can go: either end of the ground floor, and once the Stairwell is built, upstairs
 * on top of a ground room (never floating) next to the Stairwell's top or another upstairs room (GDD #58).
 */
export function roomSpots(state) {
  const rooms = state.building.rooms;
  const cols = rooms.filter((r) => r.floor === 0).map((r) => r.col);
  const spots = [{ col: Math.min(...cols) - 1, floor: 0 }, { col: Math.max(...cols) + 1, floor: 0 }];
  if (!hasStairwell(state)) return spots;
  for (const r of rooms) {
    if (r.floor !== 0 || hasRoom(state, r.col, 1)) continue;
    if (hasRoom(state, r.col - 1, 1) || hasRoom(state, r.col + 1, 1)) spots.push({ col: r.col, floor: 1 });
  }
  return spots;
}

export const hasStairwell = (state) => state.building.rooms.some((r) => r.type === 'stairs');
/** The Stairwell opens up once a theme room is built; there's only one. */
export const canBuildStairwell = (state) => !hasStairwell(state) && state.building.rooms.some(isThemeRoom);

/**
 * Make room for a new column at `col`: every room from there on moves one place to the right, and
 * anyone walking between rooms keeps going to the same place (their paths are in some room's
 * coordinates, so points past the gap shift along with the rooms). Ground floor only (there's
 * nothing upstairs before the Stairwell).
 */
function insertColumn(state, col) {
  const S = ROOM_SIZE.W + ROOM_SIZE.T;
  const oldCol = new Map(state.building.rooms.map((r) => [r.id, r.col]));
  for (const r of state.building.rooms) if (r.col >= col) r.col += 1;
  const gap = (col - 0.5) * S; // the wall the new column opens up, in building x
  const move = (p, frame) => {
    const w = p.x + oldCol.get(frame) * S;
    if (w > gap) p.x += S;
    p.x -= (state.building.rooms.find((r) => r.id === frame).col - oldCol.get(frame)) * S;
  };
  const people = [state.keeper, state.stocker, state.cashier, ...(state.customers ?? [])].filter(Boolean);
  for (const a of people) {
    if (!oldCol.has(a.roomId)) continue;
    if (a.arriveRoom || a.legs?.length) { // walking in another room's coordinates
      move(a, a.roomId);
      for (const p of a.path) move(p, a.roomId);
      for (const l of a.legs ?? []) for (const p of l.path) move(p, l.frame);
      if (a.arriveRoom) {
        const arrive = state.building.rooms.find((r) => r.id === a.arriveRoom.roomId);
        const frame = state.building.rooms.find((r) => r.id === a.roomId);
        a.arriveRoom.offset = (arrive.col - frame.col) * S;
      }
    }
  }
}

/** Both halves of the Stairwell, right next to the shop (no cost; buildStairwell charges for it). */
export function addStairwell(state) {
  const shop = state.building.rooms.find((r) => r.type === 'shop') ?? state.building.rooms[0];
  const col = shop.col + 1;
  insertColumn(state, col);
  const bottom = makeRoom(newId(state, 'r'), 'stairs', col, 0);
  const top = makeRoom(newId(state, 'r'), 'landing', col, 1);
  state.building.rooms.push(bottom, top);
  events.emit('buildingChanged', { room: bottom });
  return bottom;
}

/**
 * Build the Stairwell (GDD #58, #64): always right of the shop. The Window Display and any rooms on
 * that side move over one place. Returns its ground room, or null.
 */
export function buildStairwell(state) {
  if (!canBuildStairwell(state) || state.coins < STAIRWELL_COST) return null;
  const room = addStairwell(state);
  addCoins(state, -STAIRWELL_COST);
  events.emit('expanded', { room });
  return room;
}

/** Build a theme room at a + spot. Returns the room, or null if it can't be built. */
export function buildThemeRoom(state, type, col, floor) {
  if (!canBuildThemeRooms(state) || !themesLeft(state).includes(type)) return null;
  if (!roomSpots(state).some((p) => p.col === col && p.floor === floor)) return null;
  const cost = themeRoomCost(state);
  if (state.coins < cost) return null;
  const room = addRoom(state, type, col, floor);
  if (!room) return null;
  addCoins(state, -cost);
  events.emit('expanded', { room });
  return room;
}
