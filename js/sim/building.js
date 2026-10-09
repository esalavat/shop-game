// Building grid actions. Rooms sit on a (col, floor) grid that grows sideways and upward.

import { events } from '../core/events.js';
import { ROOM_TYPES } from '../data/rooms.js';
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
