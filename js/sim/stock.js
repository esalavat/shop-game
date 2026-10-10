// Delivery boxes and shelf stock: boxes land at the front of the shop, the shopkeeper (or Bea the
// stocker, sim/stocker.js) picks one up, and carries it to a shelf where its items fill the free slots.
// A "carrier" is anyone with { carrying, spare }; events say `by: 'keeper'` or the stocker's HELPERS id
// ('stocker' for Bea, 'stocker2', 'stocker3'; GDD #72).

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
export const DOORWAY_Z = 1.1; // where you stand inside the shop to lean out and grab a doorstep box

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

/**
 * Boxes fall into gaps: when a box leaves the bottom of a stack, the ones above it drop down a layer
 * (docs/ISSUES.md: they used to float). Returns true if anything moved.
 */
export function settleBoxes(state) {
  const n = BOX_SPOTS.length;
  let moved = false, again = true;
  while (again) {
    again = false;
    for (const b of state.boxes) {
      if (b.spot < n) continue;
      if (state.boxes.some((o) => o.roomId === b.roomId && o.spot === b.spot - n)) continue;
      b.spot -= n;
      moved = again = true;
    }
  }
  return moved;
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

/** Can they take another box? One in their hands, plus one more on the Stock Cart. */
export function canCarryMore(state, carrier = state.keeper) {
  return !carrier.carrying || (hasUpgrade(state, 'cart') && !carrier.spare);
}

export function pickUpBox(state, boxId, carrier = state.keeper, by = 'keeper') {
  const k = carrier;
  const i = state.boxes.findIndex((b) => b.id === boxId);
  if (i < 0 || !canCarryMore(state, k)) return false;
  const box = state.boxes.splice(i, 1)[0];
  if (k.carrying) k.spare = box;
  else k.carrying = box;
  settleBoxes(state);
  events.emit('boxesChanged');
  events.emit('boxPicked', { box, spare: k.spare === box, by });
  return true;
}

export function freeSlots(fixture) {
  return FIXTURES[fixture.kind].fillOrder.filter((i) => fixture.slots[i] === null);
}

/** Unpack the carried box onto a shelf. Returns how many items were placed. */
export function stockShelf(state, fixtureId, carrier = state.keeper, by = 'keeper') {
  const k = carrier;
  const found = findFixture(state, fixtureId);
  if (!k.carrying || !found?.fixture.slots) return 0;
  const { room, fixture } = found;
  const free = freeSlots(fixture);
  if (!free.length) {
    if (by === 'keeper') events.emit('shelfFull', { fixtureId });
    return 0;
  }
  let total = 0;
  while (k.carrying && free.length) {
    const b = k.carrying;
    const slots = free.splice(0, b.qty);
    for (const slot of slots) fixture.slots[slot] = b.itemId;
    b.qty -= slots.length;
    total += slots.length;
    events.emit('stocked', { roomId: room.id, fixtureId, itemId: b.itemId, slots, by });
    if (b.qty > 0) break; // the shelf is full
    // Empty: the box on the cart (if any) comes up into their hands and keeps filling the shelf.
    k.carrying = k.spare;
    k.spare = null;
    events.emit('boxEmptied', { box: b, by });
  }
  return total;
}

/**
 * How many of an item you have (GDD #71): on the shelves in every room, in boxes (on the doorstep or
 * in someone's hands), and on order. For the order book, so it's easy to stock evenly.
 */
export function stockCount(state, itemId) {
  let shelf = 0;
  for (const room of state.building.rooms) {
    for (const f of room.fixtures) if (f.slots) shelf += f.slots.filter((s) => s === itemId).length;
  }
  const boxes = [...state.boxes, state.keeper.carrying, state.keeper.spare, ...state.stockers.flatMap((b) => [b.carrying, b.spare])];
  const boxed = boxes.filter((b) => b?.itemId === itemId).reduce((n, b) => n + b.qty, 0);
  const coming = state.orders.filter((o) => o.itemId === itemId).reduce((n, o) => n + o.qty, 0);
  return { shelf, boxed, coming };
}
