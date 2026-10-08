// Building grid actions. Rooms sit on a (col, floor) grid that grows sideways and upward.

import { events } from '../core/events.js';
import { ROOM_TYPES } from '../data/rooms.js';
import { FIXTURES } from '../data/fixtures.js';

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
  const room = makeRoom(`r${Date.now().toString(36)}${state.building.rooms.length}`, type, col, floor);
  state.building.rooms.push(room);
  events.emit('buildingChanged', { room });
  return room;
}
