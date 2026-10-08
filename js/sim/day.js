// Days. For now just "next day" + morning deliveries; the full
// morning -> open -> evening -> close cycle arrives in a later milestone.

import { events } from '../core/events.js';
import { dropBox } from './stock.js';

export function startNextDay(state) {
  state.day.number++;
  state.day.phase = 'morning';
  const delivered = deliverOrders(state);
  events.emit('dayStarted', { day: state.day.number, delivered });
}

/** Turn due orders into boxes on the shop floor. New kinds of items join the Collection. */
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
