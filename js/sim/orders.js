// The order book: buy a box of an item now; it arrives the next morning, or at lunchtime today
// with the Lunchtime Delivery upgrade if it's still before midday.

import { events } from '../core/events.js';
import { ITEMS, boxCost } from '../data/items.js';
import { addCoins } from './economy.js';
import { newId } from './stock.js';
import { hasUpgrade } from './upgrades.js';
import { DAY_LENGTH, MIDDAY } from './day.js';
import { canOrder } from './catalog.js';

export function canAfford(state, itemId) {
  return state.coins >= boxCost(itemId);
}

/** Would an order placed now come at lunchtime today? (Morning, or the first half of open hours.) */
export function lunchDeliveryOpen(state) {
  const { phase, time } = state.day;
  return hasUpgrade(state, 'lunch') && (phase === 'morning' || (phase === 'open' && time < DAY_LENGTH.open * MIDDAY));
}

export function placeOrder(state, itemId) {
  if (!canOrder(state, itemId) || !canAfford(state, itemId)) return null;
  addCoins(state, -boxCost(itemId));
  const lunch = lunchDeliveryOpen(state);
  const order = { id: newId(state, 'o'), itemId, qty: ITEMS[itemId].perBox, arrivesDay: state.day.number + (lunch ? 0 : 1) };
  if (lunch) order.lunch = true;
  state.orders.push(order);
  events.emit('orderPlaced', { order });
  return order;
}
