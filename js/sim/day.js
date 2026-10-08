// The shop day: morning (untimed: deliveries arrive, stock up) -> open (customers come) ->
// evening (twilight; no new customers, the last ones finish) -> close (summary; order for tomorrow)
// -> next morning.

import { events } from '../core/events.js';
import { dropBox } from './stock.js';

export const DAY_LENGTH = {
  open: 180,    // seconds of open hours
  evening: 25,  // seconds of twilight before closing
};

export function emptyStats() {
  return { coins: 0, tips: 0, served: 0, hearts: 0, sold: {}, wishes: [] };
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

/** Advance the clock. Closing waits until the last customer has gone home. */
export function tickDay(state, dt) {
  const d = state.day;
  if (d.phase === 'open') {
    d.time += dt;
    if (d.time >= DAY_LENGTH.open) setPhase(state, 'evening');
  } else if (d.phase === 'evening') {
    d.time = Math.min(DAY_LENGTH.evening, d.time + dt);
    if (d.time >= DAY_LENGTH.evening && state.customers.length === 0) {
      setPhase(state, 'close');
      events.emit('dayClosed', { day: d.number, stats: d.stats });
    }
  }
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
  events.emit('dayStarted', { day: state.day.number, delivered });
}

/** Turn due orders into boxes on the doorstep. New kinds of items join the Collection. */
export function deliverOrders(state) {
  const due = state.orders.filter((o) => o.arrivesDay <= state.day.number);
  if (!due.length) return { boxes: 0, discovered: [] };
  state.orders = state.orders.filter((o) => o.arrivesDay > state.day.number);
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
