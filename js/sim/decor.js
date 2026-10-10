// The decoration shop (GDD #68): Ribbons 🎀 are earned by caring for customers and collecting, and
// spent on room styles. A bought style is owned in every room for good (state.decor.owned); what each
// room wears is room.decor (kind -> option id), missing kinds showing the room's defaults.

import { events } from '../core/events.js';
import { DECOR, RIBBONS, decorOption } from '../data/decor.js';
import { ITEMS, SETS } from '../data/items.js';
import { ROOM_TYPES } from '../data/rooms.js';

export function addRibbons(state, amount, why, detail = {}) {
  if (amount <= 0) return;
  state.ribbons += amount;
  state.day.stats.ribbons = (state.day.stats.ribbons ?? 0) + amount;
  events.emit('ribbons', { amount, why, total: state.ribbons, ...detail });
}

/** Ribbons a new game starts with: what its Collection would have earned (the starter items). */
export function ribbonsForCollection(collection) {
  const found = Object.keys(ITEMS).filter((id) => collection[id]);
  const themes = Object.keys(SETS).filter((set) => themeComplete(collection, set));
  return found.length * RIBBONS.newItem + themes.length * RIBBONS.theme;
}

const themeComplete = (collection, set) => Object.keys(ITEMS).filter((id) => ITEMS[id].set === set).every((id) => collection[id]);

/**
 * A sale rang up: each item someone wished for uses up its wish note (+1 each), and a window-peeker
 * buying what they pointed at earns one more.
 */
export function ribbonsForSale(state, customer, itemIds) {
  for (const itemId of itemIds) {
    const i = state.wishes.findIndex((w) => w.itemId === itemId);
    if (i < 0) continue;
    state.wishes.splice(i, 1);
    events.emit('wishGranted', { itemId, customerId: customer?.id });
    addRibbons(state, RIBBONS.wish, 'wish');
  }
  if (customer?.windowWant && itemIds.includes(customer.windowWant)) addRibbons(state, RIBBONS.window, 'window');
}

/** New Collection items (+2 each) and any themes they complete (+5 each). */
export function ribbonsForFinds(state, discovered) {
  if (!discovered.length) return;
  addRibbons(state, discovered.length * RIBBONS.newItem, 'find');
  const sets = new Set(discovered.map((id) => ITEMS[id].set));
  for (const set of sets) if (themeComplete(state.collection, set)) addRibbons(state, RIBBONS.theme, 'theme', { set });
}

/** The end-of-day gift: one Ribbon for every few happy customers. */
export function ribbonsForDay(state) {
  addRibbons(state, Math.floor(state.day.stats.served / RIBBONS.perHappy), 'day');
}

export function ownsDecor(state, kind, id) {
  const o = decorOption(kind, id);
  return !!o && (o.price === 0 || !!state.decor.owned[`${kind}:${id}`]);
}

/** Buy a style with Ribbons. Returns true if it's now yours. */
export function buyDecor(state, kind, id) {
  const o = decorOption(kind, id);
  if (!o || ownsDecor(state, kind, id) || state.ribbons < o.price) return false;
  state.ribbons -= o.price;
  state.decor.owned[`${kind}:${id}`] = true;
  events.emit('decorBought', { kind, id });
  return true;
}

/** Which kinds a room can wear: curtains need a window, the corner piece needs a plant spot. */
export function canStyle(room, kind) {
  if (!(kind in DECOR)) return false;
  if (kind === 'curtain') return !!ROOM_TYPES[room.type].window;
  if (kind === 'corner') return room.fixtures.some((f) => f.kind === 'plant');
  if (kind === 'rug') return room.fixtures.some((f) => f.kind === 'rug');
  return true;
}

/** Put an owned style on a room. */
export function styleRoom(state, roomId, kind, id) {
  const room = state.building.rooms.find((r) => r.id === roomId);
  if (!room || !ownsDecor(state, kind, id)) return false;
  room.decor = { ...room.decor, [kind]: id };
  events.emit('decorChanged', { roomId, kind, id });
  return true;
}
