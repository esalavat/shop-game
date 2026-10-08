// The order book: buy a box of an item now; it arrives the next morning.

import { events } from '../core/events.js';
import { ITEMS, boxCost } from '../data/items.js';
import { addCoins } from './economy.js';
import { newId } from './stock.js';

export function canAfford(state, itemId) {
  return state.coins >= boxCost(itemId);
}

export function placeOrder(state, itemId) {
  if (!ITEMS[itemId] || !canAfford(state, itemId)) return null;
  addCoins(state, -boxCost(itemId));
  const order = { id: newId(state, 'o'), itemId, qty: ITEMS[itemId].perBox, arrivesDay: state.day.number + 1 };
  state.orders.push(order);
  events.emit('orderPlaced', { order });
  return order;
}
