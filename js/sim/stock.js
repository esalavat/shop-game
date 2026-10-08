// Delivery boxes and shelf stock: boxes land at the front of the shop, the shopkeeper
// picks one up, and carries it to a shelf where its items fill the free slots.

import { events } from '../core/events.js';
import { FIXTURES } from '../data/fixtures.js';

/** Where delivery boxes land in the shop room (room-local). Extra boxes stack on top. */
export const BOX_SPOTS = [
  { x: -0.9, z: 0.95 }, { x: -0.5, z: 0.95 }, { x: -0.1, z: 0.95 }, { x: 0.3, z: 0.95 }, { x: 0.1, z: 0.55 },
];
export const BOX_SIZE = 0.36;

export function newId(state, prefix) {
  state.nextId = (state.nextId ?? 1) + 1;
  return `${prefix}${state.nextId}`;
}

/** Spot index i maps to BOX_SPOTS[i % n], stacked layer floor(i / n). */
export function boxSpot(i) {
  const s = BOX_SPOTS[i % BOX_SPOTS.length];
  return { x: s.x, z: s.z, layer: Math.floor(i / BOX_SPOTS.length) };
}

export function shopRoomId(state) {
  return (state.building.rooms.find((r) => r.type === 'shop') ?? state.building.rooms[0]).id;
}

/** Put a box of items on the shop floor at the first free spot. */
export function dropBox(state, itemId, qty) {
  const roomId = shopRoomId(state);
  const used = new Set(state.boxes.filter((b) => b.roomId === roomId).map((b) => b.spot));
  let spot = 0;
  while (used.has(spot)) spot++;
  const box = { id: newId(state, 'b'), itemId, qty, roomId, spot };
  state.boxes.push(box);
  return box;
}

export function findFixture(state, fixtureId) {
  for (const room of state.building.rooms) {
    const f = room.fixtures.find((x) => x.id === fixtureId);
    if (f) return { room, fixture: f };
  }
  return null;
}

export function pickUpBox(state, boxId) {
  const k = state.keeper;
  const i = state.boxes.findIndex((b) => b.id === boxId);
  if (i < 0 || k.carrying) return false;
  k.carrying = state.boxes.splice(i, 1)[0];
  events.emit('boxesChanged');
  events.emit('boxPicked', { box: k.carrying });
  return true;
}

export function freeSlots(fixture) {
  return FIXTURES[fixture.kind].fillOrder.filter((i) => fixture.slots[i] === null);
}

/** Unpack the carried box onto a shelf. Returns how many items were placed. */
export function stockShelf(state, fixtureId) {
  const k = state.keeper;
  const found = findFixture(state, fixtureId);
  if (!k.carrying || !found?.fixture.slots) return 0;
  const { room, fixture } = found;
  const box = k.carrying;
  const free = freeSlots(fixture);
  if (!free.length) {
    events.emit('shelfFull', { fixtureId });
    return 0;
  }
  const placed = [];
  for (const slot of free) {
    if (box.qty === 0) break;
    fixture.slots[slot] = box.itemId;
    box.qty--;
    placed.push(slot);
  }
  events.emit('stocked', { roomId: room.id, fixtureId, itemId: box.itemId, slots: placed });
  if (box.qty === 0) {
    k.carrying = null;
    events.emit('boxEmptied', { box });
  }
  return placed.length;
}
