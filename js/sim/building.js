// Building grid actions. Rooms sit on a (col, floor) grid that grows sideways and upward.

import { events } from '../core/events.js';
import { ROOM_TYPES, THEME_ROOMS, THEME_ROOM_COSTS } from '../data/rooms.js';
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

/** Where a new room can go: either end of the ground floor (upstairs comes with the Stairwell). */
export function roomSpots(state) {
  const cols = state.building.rooms.filter((r) => r.floor === 0).map((r) => r.col);
  return [{ col: Math.min(...cols) - 1, floor: 0 }, { col: Math.max(...cols) + 1, floor: 0 }];
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
