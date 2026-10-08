// Building grid actions. Rooms sit on a (col, floor) grid that grows sideways and upward.

import { events } from '../core/events.js';

export const hasRoom = (state, col, floor) =>
  state.building.rooms.some((r) => r.col === col && r.floor === floor);

export function addRoom(state, type, col, floor) {
  if (hasRoom(state, col, floor)) return null;
  if (floor > 0 && !hasRoom(state, col, floor - 1)) return null; // nothing floats
  const room = { id: `r${Date.now().toString(36)}${state.building.rooms.length}`, type, col, floor };
  state.building.rooms.push(room);
  events.emit('buildingChanged', { room });
  return room;
}
