// The Collection and the Dream Dollhouse: items unlock when first delivered (see day.js) and can be
// placed in the dollhouse's rooms for free. What's on show sets the shop's Sparkle, which brings
// more visitors and makes some of them stop at the window.

import { events } from '../core/events.js';
import { ITEMS } from '../data/items.js';
import { DOLLHOUSE_SLOTS, SPARKLE } from '../data/dollhouse.js';
import { ROOM_SIZE } from '../data/rooms.js';
import { collectionBonus } from './rewards.js';

export const slotById = (slotId) => DOLLHOUSE_SLOTS.find((s) => s.id === slotId);

export function fitsSlot(slotId, itemId) {
  return Boolean(ITEMS[itemId] && slotById(slotId)?.fits.includes(ITEMS[itemId].kind));
}

/** The Window Display room (where the Dream Dollhouse lives), or null before the first expansion. */
export const displayRoom = (state) => state.building.rooms.find((r) => r.type === 'display') ?? null;

export function sparkleFor(dollhouse) {
  const placed = DOLLHOUSE_SLOTS.map((s) => dollhouse.slots[s.id]).filter(Boolean);
  const total = placed.reduce((sum, id) => sum + (ITEMS[id]?.sparkle ?? 0), 0);
  return total + (placed.length === DOLLHOUSE_SLOTS.length ? SPARKLE.fullHouse : 0);
}

/** Put a Collection item in a dollhouse room (or `null` to empty it). Returns true if it changed. */
export function placeInDollhouse(state, slotId, itemId) {
  if (!displayRoom(state) || !slotById(slotId)) return false;
  if (itemId !== null && (!state.collection[itemId] || !fitsSlot(slotId, itemId))) return false;
  if ((state.dollhouse.slots[slotId] ?? null) === itemId) return false;
  const before = state.sparkle;
  if (itemId === null) delete state.dollhouse.slots[slotId];
  else state.dollhouse.slots[slotId] = itemId;
  state.sparkle = sparkleFor(state.dollhouse);
  events.emit('dollhouseChanged', { slotId, itemId, sparkle: state.sparkle, gained: state.sparkle - before });
  return true;
}

export const dollhouseItems = (state) => new Set(Object.values(state.dollhouse.slots).filter(Boolean));

/** How many times as often visitors arrive, thanks to Sparkle and the Collection bonus (GDD #70). */
export function trafficBoost(state) {
  return 1 + sparkleBoost(state.sparkle) + collectionBonus(state);
}

/** Extra visitors from Sparkle, e.g. 0.4 for +40%: always more with more Sparkle, a little less each time. */
export function sparkleBoost(sparkle) {
  return (SPARKLE.trafficMore * sparkle) / (sparkle + SPARKLE.trafficHalf);
}

/** Chance a new visitor stops at the window first (0 with nothing on show or no window). */
export function peekChance(state) {
  if (!state.sparkle || windowX(state) === null) return 0;
  const base = Math.min(SPARKLE.peekMax, SPARKLE.peekBase + state.sparkle * SPARKLE.peekPer);
  return showingOff(state) ? Math.min(SPARKLE.keeperPeekMax, base + SPARKLE.keeperPeek) : base;
}

/** Chance a window-peeker wants something from the dollhouse. */
export const peekWantChance = (state) => (showingOff(state) ? SPARKLE.keeperPeekWant : SPARKLE.peekWant);

/** The shopkeeper or Rosa the window dresser (GDD #72) is showing off the Dream Dollhouse. */
export const showingOff = (state) => keeperShowingOff(state) || !!state.dresser;

/** The shopkeeper is in the Window Display room, showing off the Dream Dollhouse (GDD #41). */
export const keeperShowingOff = (state) => {
  const room = displayRoom(state);
  return !!room && state.keeper.roomId === room.id;
};

/**
 * Where to stand to look in the window, as x in the shop room's local coordinates (the street runs
 * along the whole building). Null if there's no ground-floor Window Display.
 */
export function windowX(state) {
  const shop = state.building.rooms.find((r) => r.type === 'shop');
  const display = state.building.rooms.find((r) => r.type === 'display' && r.floor === 0);
  if (!shop || !display) return null;
  return (display.col - shop.col) * (ROOM_SIZE.W + ROOM_SIZE.T);
}
