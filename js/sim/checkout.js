// Ringing customers up: when the first customer in line is waiting and the shopkeeper is behind
// the counter, their items go on the counter. Each tap scans one; the last tap rings the sale.

import { events } from '../core/events.js';
import { useSpot } from '../data/fixtures.js';
import { ITEMS } from '../data/items.js';
import { CUSTOMER } from '../data/customers.js';
import { addCoins } from './economy.js';
import { recordSale } from './day.js';

export function counterOf(state, roomId) {
  return state.building.rooms.find((r) => r.id === roomId)?.fixtures.find((f) => f.kind === 'counter') ?? null;
}

/** True when the shopkeeper is standing still at her spot behind the counter. */
export function keeperAtCounter(state) {
  const k = state.keeper;
  const counter = counterOf(state, k.roomId);
  if (!counter || k.path.length) return false;
  const spot = useSpot(counter);
  return Math.hypot(k.x - spot.x, k.z - spot.z) < 0.1;
}

export function startCheckout(state, customer) {
  state.checkout = { customerId: customer.id, items: customer.basket.map((itemId) => ({ itemId, scanned: false })) };
  customer.state = 'paying';
  events.emit('checkoutStarted', { checkout: state.checkout, customer });
}

/** Scan the next item. Returns how many are left to scan. */
export function scanNext(state) {
  const c = state.checkout;
  if (!c) return 0;
  const index = c.items.findIndex((i) => !i.scanned);
  if (index >= 0) {
    c.items[index].scanned = true;
    events.emit('scanned', { index, itemId: c.items[index].itemId });
  }
  return c.items.filter((i) => !i.scanned).length;
}

/** Ring up the sale. Tips only come when you ring them up yourself (not Mia, `tip: false`). */
export function completeSale(state, rand = Math.random, { tip: tips = true, by = 'keeper' } = {}) {
  const c = state.checkout;
  if (!c || c.items.some((i) => !i.scanned)) return null;
  const customer = state.customers.find((x) => x.id === c.customerId);
  const amount = c.items.reduce((sum, i) => sum + ITEMS[i.itemId].price, 0);
  const [lo, hi] = CUSTOMER.tip;
  const tip = tips ? lo + Math.floor(rand() * (hi - lo + 1)) : 0;
  addCoins(state, amount + tip);
  state.hearts += 1;
  recordSale(state, { amount, tip, items: c.items.map((i) => i.itemId) });
  state.checkout = null;
  events.emit('sale', { amount, tip, by, customerId: c.customerId });
  if (customer) {
    customer.basket = [];
    customer.takenFrom = [];
    customer.state = 'paid';
  }
  return { amount, tip };
}

/** One tap at the counter during checkout: scan the next item, or ring up when all are scanned. */
export function checkoutTap(state, rand) {
  if (!state.checkout) return null;
  if (state.checkout.items.some((i) => !i.scanned)) {
    scanNext(state);
    return 'scanned';
  }
  completeSale(state, rand);
  return 'sold';
}
