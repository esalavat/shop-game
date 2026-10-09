// Delivery boxes and shelf stock: boxes land at the front of the shop, the shopkeeper
// picks one up, and carries it to a shelf where its items fill the free slots.

import { events } from '../core/events.js';
import { FIXTURES } from '../data/fixtures.js';
import { hasUpgrade } from './upgrades.js';

/**
 * Where Pip leaves delivery boxes: on the doorstep (the sidewalk just in front of the shop room,
 * room-local coordinates, below floor level). Extra boxes stack on top. They sit at the right end,
 * away from the counter, so a big delivery never hides the register (docs/ISSUES.md).
 */
export const BOX_SPOTS = [{ x: 0.66, z: 1.72 }, { x: 1.04, z: 1.72 }, { x: 1.42, z: 1.72 }, { x: 1.8, z: 1.72 }];
export const DOORSTEP_Y = -0.4; // sidewalk height relative to the shop floor
export const BOX_SIZE = 0.36;

export function newId(state, prefix) {
  state.nextId = (state.nextId ?? 1) + 1;
  return `${prefix}${state.nextId}`;
}

/** Spot index i maps to BOX_SPOTS[i % n], stacked layer floor(i / n). */
export function boxSpot(i) {
  const s = BOX_SPOTS[i % BOX_SPOTS.length];
  return { x: s.x, z: s.z, layer: Math.floor(i / BOX_SPOTS.length), y: DOORSTEP_Y };
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

/** Can she take another box? One in her hands, plus one more on the Stock Cart. */
export function canCarryMore(state) {
  const k = state.keeper;
  return !k.carrying || (hasUpgrade(state, 'cart') && !k.spare);
}

export function pickUpBox(state, boxId) {
  const k = state.keeper;
  const i = state.boxes.findIndex((b) => b.id === boxId);
  if (i < 0 || !canCarryMore(state)) return false;
  const box = state.boxes.splice(i, 1)[0];
  if (k.carrying) k.spare = box;
  else k.carrying = box;
  events.emit('boxesChanged');
  events.emit('boxPicked', { box, spare: k.spare === box });
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
  const free = freeSlots(fixture);
  if (!free.length) {
    events.emit('shelfFull', { fixtureId });
    return 0;
  }
  let total = 0;
  while (k.carrying && free.length) {
    const b = k.carrying;
    const slots = free.splice(0, b.qty);
    for (const slot of slots) fixture.slots[slot] = b.itemId;
    b.qty -= slots.length;
    total += slots.length;
    events.emit('stocked', { roomId: room.id, fixtureId, itemId: b.itemId, slots });
    if (b.qty > 0) break; // the shelf is full
    // Empty: the box on the cart (if any) comes up into her hands and keeps filling the shelf.
    k.carrying = k.spare;
    k.spare = null;
    events.emit('boxEmptied', { box: b });
  }
  return total;
}
