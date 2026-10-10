// Ringing customers up: when the first customer in line is waiting and the shopkeeper is behind
// the counter, their items go on the counter. Each tap scans one; the last tap rings the sale.
//
// Every register has a line, a checkout and a cashier (all live-only). The shop's live on state itself
// (state.queue / checkout / cashier, as always); each register room's (GDD #73) in
// state.registers[roomId], the same shape. registerOf() hands back whichever one a room has.

import { events } from '../core/events.js';
import { useSpot } from '../data/fixtures.js';
import { ITEMS } from '../data/items.js';
import { CUSTOMER } from '../data/customers.js';
import { addCoins } from './economy.js';
import { recordSale } from './day.js';
import { ribbonsForSale } from './decor.js';
import { hasUpgrade } from './upgrades.js';
import { notePagesOpen } from './catalog.js';
import { SCANNER } from '../data/upgrades.js';

const isRegisterRoom = (room) => room?.type === 'shop' || room?.type === 'register';

/** The rooms with a register, bottom up: the shop, then register rooms. */
export const registerRooms = (state) => state.building.rooms.filter(isRegisterRoom).sort((a, b) => a.floor - b.floor);

/** A room's register ({ queue, checkout, cashier }), or null if it has none. */
export function registerOf(state, roomId) {
  const room = state.building.rooms.find((r) => r.id === roomId);
  if (!isRegisterRoom(room)) return null;
  if (room.type === 'shop') return state;
  state.registers ??= {};
  return (state.registers[roomId] ??= { queue: [], checkout: null, cashier: null });
}

/** Where someone on this floor pays: the register on their floor, else the nearest one below. */
export function registerFor(state, floor) {
  return registerRooms(state).filter((r) => r.floor <= floor).at(-1) ?? registerRooms(state)[0];
}

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

const shopId = (state) => (state.building.rooms.find((r) => r.type === 'shop') ?? state.building.rooms[0]).id;

/** Start ringing up a customer at their register (customer.registerId; the shop's if unset). */
export function startCheckout(state, customer) {
  const roomId = customer.registerId ?? shopId(state);
  const reg = registerOf(state, roomId);
  reg.checkout = { roomId, customerId: customer.id, items: customer.basket.map((itemId) => ({ itemId, scanned: false })) };
  customer.state = 'paying';
  events.emit('checkoutStarted', { checkout: reg.checkout, customer });
}

/** Scan the next item at a register (the shop's by default). Returns how many are left to scan. */
export function scanNext(state, roomId = shopId(state)) {
  const c = registerOf(state, roomId)?.checkout;
  if (!c) return 0;
  const index = c.items.findIndex((i) => !i.scanned);
  if (index >= 0) {
    c.items[index].scanned = true;
    events.emit('scanned', { index, itemId: c.items[index].itemId, roomId });
  }
  return c.items.filter((i) => !i.scanned).length;
}

/** Ring up the sale. Tips only come when you ring them up yourself (not a cashier, `tip: false`). */
export function completeSale(state, rand = Math.random, { tip: tips = true, by = 'keeper', roomId = shopId(state) } = {}) {
  const reg = registerOf(state, roomId);
  const c = reg?.checkout;
  if (!c || c.items.some((i) => !i.scanned)) return null;
  const customer = state.customers.find((x) => x.id === c.customerId);
  const amount = c.items.reduce((sum, i) => sum + ITEMS[i.itemId].price, 0);
  const [lo, hi] = CUSTOMER.tip;
  const tip = tips ? Math.max(1, Math.round(amount * (lo + rand() * (hi - lo)))) : 0; // grows with what they bought (GDD #85)
  addCoins(state, amount + tip);
  state.hearts += 1;
  recordSale(state, { amount, tip, items: c.items.map((i) => i.itemId) });
  reg.checkout = null;
  events.emit('sale', { amount, tip, by, customerId: c.customerId, roomId });
  ribbonsForSale(state, customer, c.items.map((i) => i.itemId));
  for (const page of notePagesOpen(state)) events.emit('pageOpened', { page }); // enough Hearts for the next page (GDD #80)
  if (customer) {
    customer.basket = [];
    customer.takenFrom = [];
    customer.state = 'paid';
  }
  return { amount, tip };
}

/**
 * One tap at the counter the shopkeeper is behind: scan the next item (two with the Speedy Scanner),
 * or ring up when all are scanned.
 */
export function checkoutTap(state, rand) {
  const roomId = state.keeper.roomId;
  const c = registerOf(state, roomId)?.checkout;
  if (!c) return null;
  if (c.items.some((i) => !i.scanned)) {
    const n = hasUpgrade(state, 'scanner') ? SCANNER.perTap : 1;
    for (let i = 0; i < n; i++) scanNext(state, roomId);
    return 'scanned';
  }
  completeSale(state, rand, { roomId });
  return 'sold';
}
