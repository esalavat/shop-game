// Building grid actions. Rooms sit on a (col, floor) grid that grows sideways and upward.

import { events } from '../core/events.js';
import { ROOM_TYPES, ROOM_SIZE, ROOM_STYLES, ROOM_COSTS, ROOM_COST_STEP, ROOM_FLOOR_MARKUP, STAIR_COSTS, STAIR_COST_STEP } from '../data/rooms.js';
import { FIXTURES } from '../data/fixtures.js';
import { EXPANSIONS } from '../data/dollhouse.js';
import { addCoins } from './economy.js';
import { newId } from './stock.js';
import { fitShelves } from './upgrades.js';

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

/** A shelf room (GDD §18 #8), in the next wallpaper along (ROOM_STYLES). */
function makeShelfRoom(state, col, floor) {
  const n = state.building.rooms.filter((r) => r.type === 'room').length;
  return { ...makeRoom(newId(state, 'r'), 'room', col, floor), style: n % ROOM_STYLES.length };
}

export function addRoom(state, type, col, floor) {
  if (hasRoom(state, col, floor)) return null;
  if (floor > 0 && !hasRoom(state, col, floor - 1)) return null; // nothing floats
  const room = type === 'room' ? makeShelfRoom(state, col, floor) : makeRoom(newId(state, 'r'), type, col, floor);
  state.building.rooms.push(room);
  fitShelves(state);
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
// Shelf rooms, the Stairwell and more floors (GDD #58, #64, §18 #8): Grow -> Build a room -> tap a +
// spot. Rooms cost more the further they are from the middle; each staircase up costs more.
// ---------------------------------------------------------------------------

/** Rooms with shelves, where customers shop (the shop, shelf rooms, the Stairwell). */
export const sellingRooms = (state) => state.building.rooms.filter((r) => r.fixtures.some((f) => f.slots));
export const isShelfRoom = (room) => room.type === 'room';
const shopOf = (state) => state.building.rooms.find((r) => r.type === 'shop') ?? state.building.rooms[0];

/** Shelf rooms open up once the Window Display is built (it stays the first milestone). */
export const canBuildRooms = (state) => state.building.rooms.some((r) => r.type === 'display');

export const hasStairwell = (state) => state.building.rooms.some((r) => r.type === 'stairs');
/** The Stairwell opens up once a shelf room is built; there's only one. */
export const canBuildStairwell = (state) => !hasStairwell(state) && state.building.rooms.some(isShelfRoom);

/** The Stairwell's room on each floor, bottom up (empty before it's built). */
export function stairRooms(state) {
  const bottom = state.building.rooms.find((r) => r.type === 'stairs');
  const out = [];
  for (let r = bottom; r; r = state.building.rooms.find((x) => x.col === bottom.col && x.floor === out.length)) out.push(r);
  return out;
}

/** How many columns out from the middle of the building (the shop and the Stairwell) a column is. */
export function distanceOut(state, col) {
  const lo = shopOf(state).col, hi = stairRooms(state)[0]?.col ?? lo;
  return col < lo ? lo - col : col > hi ? col - hi : 0;
}

/** What a shelf room costs at a spot: by its ring around the middle, plus a bit more per floor up (GDD #65). */
export function roomCost(state, col, floor = 0) {
  const ring = Math.max(1, distanceOut(state, col), floor);
  const base = ring <= ROOM_COSTS.length ? ROOM_COSTS[ring - 1] : ROOM_COSTS.at(-1) + ROOM_COST_STEP * (ring - ROOM_COSTS.length);
  return Math.round((base * (1 + ROOM_FLOOR_MARKUP * floor)) / 10) * 10;
}

/**
 * Where a new room can go: either end of the ground floor, and on any floor the Stairwell reaches,
 * on top of a room (never floating) next to the Stairwell or another room on that floor.
 */
export function roomSpots(state) {
  const rooms = state.building.rooms;
  const cols = rooms.filter((r) => r.floor === 0).map((r) => r.col);
  const spots = [{ col: Math.min(...cols) - 1, floor: 0 }, { col: Math.max(...cols) + 1, floor: 0 }];
  for (const r of rooms) {
    const f = r.floor + 1;
    if (!hasStairwell(state) || hasRoom(state, r.col, f)) continue;
    if (hasRoom(state, r.col - 1, f) || hasRoom(state, r.col + 1, f)) spots.push({ col: r.col, floor: f });
  }
  return spots;
}

/** Build a shelf room at a + spot. Returns the room, or null if it can't be built. */
export function buildRoom(state, col, floor) {
  if (!canBuildRooms(state)) return null;
  if (!roomSpots(state).some((p) => p.col === col && p.floor === floor)) return null;
  const cost = roomCost(state, col, floor);
  if (state.coins < cost) return null;
  const room = addRoom(state, 'room', col, floor);
  if (!room) return null;
  addCoins(state, -cost);
  events.emit('expanded', { room });
  return room;
}

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
  const people = [state.keeper, ...state.stockers, state.cashier, ...(state.customers ?? [])].filter(Boolean);
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
  const col = shopOf(state).col + 1;
  insertColumn(state, col);
  const bottom = makeRoom(newId(state, 'r'), 'stairs', col, 0);
  const top = makeRoom(newId(state, 'r'), 'landing', col, 1);
  state.building.rooms.push(bottom, top);
  fitShelves(state);
  events.emit('buildingChanged', { room: bottom });
  return bottom;
}

/** What the next staircase costs: the Stairwell itself first, then each new floor up. */
export function stairCost(state) {
  const i = Math.max(0, stairRooms(state).length - 1);
  return i < STAIR_COSTS.length ? STAIR_COSTS[i] : STAIR_COSTS.at(-1) + STAIR_COST_STEP * (i - STAIR_COSTS.length + 1);
}

/**
 * Build the Stairwell (GDD #58, #64): always right of the shop. The Window Display and any rooms on
 * that side move over one place. Returns its ground room, or null.
 */
export function buildStairwell(state) {
  if (!canBuildStairwell(state)) return null;
  const cost = stairCost(state);
  if (state.coins < cost) return null;
  const room = addStairwell(state);
  addCoins(state, -cost);
  events.emit('expanded', { room });
  return room;
}

/** Another floor (GDD §18 #8): the stairs go on up from the top landing to a new one. No cost here. */
export function addFloor(state) {
  const top = stairRooms(state).at(-1);
  if (!top || top.floor === 0) return null;
  top.fixtures.push({ id: `${top.id}-f${top.fixtures.length}`, kind: 'stairs', x: -1.1, z: -0.7 });
  const room = makeRoom(newId(state, 'r'), 'landing', top.col, top.floor + 1);
  state.building.rooms.push(room);
  fitShelves(state);
  events.emit('buildingChanged', { room });
  return room;
}

/** Buy the next floor up. Returns the new landing, or null. */
export function buildFloor(state) {
  if (!hasStairwell(state)) return null;
  const cost = stairCost(state);
  if (state.coins < cost) return null;
  const room = addFloor(state);
  if (!room) return null;
  addCoins(state, -cost);
  events.emit('expanded', { room });
  return room;
}
