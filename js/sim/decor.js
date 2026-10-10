// The decoration shop (GDD #68): Ribbons 🎀 are earned by caring for customers and collecting, and
// spent on room styles. A bought style is owned in every room for good (state.decor.owned); what each
// room wears is room.decor (kind -> option id), missing kinds showing the room's defaults.
// Decorating opens with the first shelf room (GDD #86): until then there are no Ribbons at all, and when it
// opens the Collection's one-time Ribbons (every item and theme found so far) are paid in one go.
// A theme's reward style (#69) is only ever a reward: it can't be bought with Ribbons (#86).

import { events } from '../core/events.js';
import { DECOR, RIBBONS, THEME_STYLES, decorOption } from '../data/decor.js';
import { ITEMS, SETS, baseOf } from '../data/items.js';
import { ROOM_TYPES } from '../data/rooms.js';

export function addRibbons(state, amount, why, detail = {}) {
  if (amount <= 0 || !state.decorOpen) return; // no Ribbons before decorating opens (GDD #86)
  state.ribbons += amount;
  state.day.stats.ribbons = (state.day.stats.ribbons ?? 0) + amount;
  events.emit('ribbons', { amount, why, total: state.ribbons, ...detail });
}

/** The one-time Ribbons a Collection has earned: every item found and every theme complete. */
export function ribbonsForCollection(collection) {
  const found = Object.keys(ITEMS).filter((id) => collection[id]);
  const themes = Object.keys(SETS).filter((set) => themeComplete(collection, set));
  return found.length * RIBBONS.newItem + themes.length * RIBBONS.theme;
}

export const themeComplete = (collection, set) => Object.keys(ITEMS).filter((id) => ITEMS[id].set === set).every((id) => collection[id]);

/**
 * A sale rang up: each item someone wished for uses up its wish note (+1 each), and a window-peeker
 * buying what they pointed at earns one more.
 */
export function ribbonsForSale(state, customer, itemIds) {
  for (const itemId of itemIds) {
    const i = state.wishes.findIndex((w) => baseOf(w.itemId) === baseOf(itemId)); // any color grants it (GDD #78)
    if (i < 0) continue;
    state.wishes.splice(i, 1);
    events.emit('wishGranted', { itemId, customerId: customer?.id });
    addRibbons(state, RIBBONS.wish, 'wish');
  }
  if (customer?.windowWant && itemIds.some((id) => baseOf(id) === baseOf(customer.windowWant))) addRibbons(state, RIBBONS.window, 'window');
}

/**
 * New Collection items (+1 each) and any themes they complete (+3 each). A complete theme is announced
 * (`themeDone`) even before decorating opens; its room style waits for you either way.
 */
export function ribbonsForFinds(state, discovered) {
  if (!discovered.length) return;
  addRibbons(state, discovered.length * RIBBONS.newItem, 'find');
  const sets = new Set(discovered.map((id) => ITEMS[id].set));
  for (const set of sets) {
    if (!themeComplete(state.collection, set)) continue;
    const [kind, id] = THEME_STYLES[set];
    const bought = !!state.decor.owned[`${kind}:${id}`];
    const ribbons = state.decorOpen ? RIBBONS.theme : 0;
    addRibbons(state, ribbons, 'theme', { set });
    events.emit('themeDone', { set, ribbons, style: bought || !state.decorOpen ? null : { kind, id } });
  }
}

/**
 * Open decorating (GDD #86), when the first shelf room is built: Ribbons start, beginning with every
 * one-time Ribbon the Collection has earned so far. Returns true if it just opened.
 */
export function openDecor(state) {
  if (state.decorOpen) return false;
  state.decorOpen = true;
  const ribbons = ribbonsForCollection(state.collection);
  addRibbons(state, ribbons, 'open');
  events.emit('decorOpened', { ribbons });
  return true;
}

/** The end-of-day gift: one Ribbon for every few happy customers. */
export function ribbonsForDay(state) {
  addRibbons(state, Math.floor(state.day.stats.served / RIBBONS.perHappy), 'day');
}

/** The theme whose completion gives this style (GDD #69), or null. */
export function rewardTheme(kind, id) {
  return Object.keys(THEME_STYLES).find((set) => THEME_STYLES[set][0] === kind && THEME_STYLES[set][1] === id) ?? null;
}

/** Free, bought, or a complete theme's reward (worked out from the Collection, so no save change). */
export function ownsDecor(state, kind, id) {
  const o = decorOption(kind, id);
  if (!o) return false;
  if (o.price === 0 || state.decor.owned[`${kind}:${id}`]) return true;
  const set = rewardTheme(kind, id);
  return !!set && themeComplete(state.collection, set);
}

/** Buy a style with Ribbons. Theme reward styles can't be bought (GDD #86). Returns true if it's now yours. */
export function buyDecor(state, kind, id) {
  const o = decorOption(kind, id);
  if (!o || rewardTheme(kind, id) || ownsDecor(state, kind, id) || state.ribbons < o.price) return false;
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
