// The shop day: morning (untimed: deliveries arrive, stock up) -> open (customers come) ->
// evening (twilight; no new customers; when it's over, shoppers pay for what they have or go home)
// -> close (summary; order for tomorrow)
// -> next morning.

import { events } from '../core/events.js';
import { dropBox } from './stock.js';
import { ITEMS, boxCost } from '../data/items.js';

export const DAY_LENGTH = {
  open: 180,    // seconds of open hours
  evening: 10,  // seconds of twilight; then shoppers stop (sim/customers.js) and it closes once the last one has paid
};

export const MIDDAY = 0.5; // fraction of open hours when Pip's lunchtime delivery comes (upgrade)

export function emptyStats() {
  return { coins: 0, tips: 0, served: 0, hearts: 0, sold: {}, wishes: [], record: false };
}

function setPhase(state, phase) {
  state.day.phase = phase;
  state.day.time = 0;
  events.emit('phaseChanged', { phase, day: state.day.number });
}

export function openShop(state) {
  if (state.day.phase !== 'morning') return false;
  setPhase(state, 'open');
  return true;
}

/** End open hours now (e.g. sold out): straight to evening; the last customers still finish. */
export function closeEarly(state) {
  if (state.day.phase !== 'open') return false;
  setPhase(state, 'evening');
  return true;
}

/** Nothing left to sell: empty shelves, no boxes waiting, nothing in the shopkeeper's (or Bea's) hands. */
export function soldOut(state) {
  const shelvesEmpty = state.building.rooms.every((r) => r.fixtures.every((f) => !f.slots || f.slots.every((s) => !s)));
  const holding = (c) => !!(c?.carrying || c?.spare);
  return shelvesEmpty && state.boxes.length === 0 && !holding(state.keeper) && !holding(state.stocker);
}

/** Everyone left is on their way out (they keep walking off behind the closing summary). */
const allLeaving = (state) => state.customers.every((c) => c.state === 'leaving');

/** Advance the clock. Closing waits until the last customer has paid (or given up) and is heading home. */
export function tickDay(state, dt) {
  const d = state.day;
  if (d.phase === 'open') {
    const before = d.time;
    d.time += dt;
    // Pip's lunchtime delivery (upgrade): today's lunch orders arrive halfway through the day.
    if (before < DAY_LENGTH.open * MIDDAY && d.time >= DAY_LENGTH.open * MIDDAY) deliverLunch(state);
    if (d.time >= DAY_LENGTH.open) setPhase(state, 'evening');
  } else if (d.phase === 'evening') {
    d.time = Math.min(DAY_LENGTH.evening, d.time + dt);
    if (d.time >= DAY_LENGTH.evening && allLeaving(state)) { // the last ones pay first
      setPhase(state, 'close');
      recordBest(state);
      events.emit('dayClosed', { day: d.number, stats: d.stats });
    }
  }
}

/**
 * Best day for coins (GDD #48). Beating it marks today's stats as a record, but the first day
 * that earns anything just sets the bar (so Day 1 isn't a "record").
 */
export function recordBest(state) {
  const coins = state.day.stats.coins;
  state.day.stats.record = state.best.coins > 0 && coins > state.best.coins;
  state.best.coins = Math.max(state.best.coins, coins);
}

/** 0..1 through the current timed phase (1 when closed, 0 in the morning). */
export function phaseProgress(day) {
  if (day.phase === 'open') return Math.min(1, day.time / DAY_LENGTH.open);
  if (day.phase === 'evening') return Math.min(1, day.time / DAY_LENGTH.evening);
  return day.phase === 'close' ? 1 : 0;
}

/** How dark it is: daylight until evening, fading to twilight, twilight after closing. */
export function twilightFor(day) {
  if (day.phase === 'evening') return phaseProgress(day);
  return day.phase === 'close' ? 1 : 0;
}

export function startNextDay(state) {
  state.day.number++;
  state.day.stats = emptyStats();
  setPhase(state, 'morning');
  const delivered = deliverOrders(state);
  const rescued = rescueIfStuck(state);
  events.emit('dayStarted', { day: state.day.number, delivered, rescued });
}

/**
 * Nothing to sell, nothing on the way, and too few coins for even the cheapest box: the shop could
 * never earn again. Pip brings a free box of the cheapest item, "just because" (GDD #40).
 * Returns the item id, or null if the shop wasn't stuck.
 */
export function rescueIfStuck(state) {
  const cheapest = Object.keys(ITEMS).reduce((a, b) => (boxCost(b) < boxCost(a) ? b : a));
  if (!soldOut(state) || state.orders.length || state.coins >= boxCost(cheapest)) return null;
  dropBox(state, cheapest, ITEMS[cheapest].perBox);
  events.emit('boxesChanged');
  return cheapest;
}

/** Lunch orders that missed midday (the shop closed early) come the next morning instead. */
const dueInMorning = (o, day) => o.arrivesDay < day || (o.arrivesDay === day && !o.lunch);

function deliverLunch(state) {
  const delivered = deliverOrders(state, (o) => o.lunch && o.arrivesDay <= state.day.number);
  if (delivered.boxes) events.emit('lunchDelivery', { delivered });
}

/** Turn due orders into boxes on the doorstep. New kinds of items join the Collection. */
export function deliverOrders(state, isDue = (o) => dueInMorning(o, state.day.number)) {
  const due = state.orders.filter(isDue);
  if (!due.length) return { boxes: 0, discovered: [] };
  state.orders = state.orders.filter((o) => !due.includes(o));
  const discovered = [];
  for (const o of due) {
    dropBox(state, o.itemId, o.qty);
    if (!state.collection[o.itemId]) {
      state.collection[o.itemId] = true;
      discovered.push(o.itemId);
    }
  }
  events.emit('boxesChanged');
  return { boxes: due.length, discovered };
}

/** Keep today's tally for the closing summary. */
export function recordSale(state, { amount, tip, items }) {
  const s = state.day.stats;
  s.coins += amount + tip;
  s.tips += tip;
  s.served += 1;
  s.hearts += 1;
  for (const itemId of items) s.sold[itemId] = (s.sold[itemId] ?? 0) + 1;
}

export function recordWish(state, itemId) {
  state.day.stats.wishes.push(itemId);
}
