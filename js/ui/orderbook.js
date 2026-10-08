// The order book: a bottom sheet of item cards. Ordering a box spends coins now;
// the box arrives the next morning.

import { ITEMS, boxCost } from '../data/items.js';
import { placeOrder, canAfford } from '../sim/orders.js';
import { events } from '../core/events.js';

export function createOrderBook(state, thumbs) {
  const sheet = document.getElementById('orderbook');
  const list = sheet.querySelector('.cards');
  const pending = sheet.querySelector('.pending');
  const cards = new Map();

  for (const [id, item] of Object.entries(ITEMS)) {
    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = `
      <img alt="" src="${thumbs.get(id)}">
      <div class="card-name">${item.name}</div>
      <div class="card-sub">Box of ${item.perBox}</div>
      <button class="buy"><span aria-hidden="true">🪙</span> ${boxCost(id)}</button>`;
    card.querySelector('.buy').addEventListener('click', () => placeOrder(state, id));
    list.append(card);
    cards.set(id, card);
  }

  function refresh() {
    for (const [id, card] of cards) card.querySelector('.buy').disabled = !canAfford(state, id);
    if (!state.orders.length) {
      pending.textContent = 'Pick something lovely — Pip brings it tomorrow morning.';
      return;
    }
    const counts = {};
    for (const o of state.orders) counts[o.itemId] = (counts[o.itemId] ?? 0) + 1;
    const parts = Object.entries(counts).map(([id, n]) => `${ITEMS[id].name}${n > 1 ? ` ×${n}` : ''}`);
    pending.textContent = `Arriving tomorrow: ${parts.join(', ')}`;
  }

  events.on('coins', refresh);
  events.on('orderPlaced', refresh);
  events.on('dayStarted', refresh);
  sheet.querySelector('.close').addEventListener('click', () => close());
  sheet.addEventListener('click', (e) => { if (e.target === sheet) close(); });

  function open() { refresh(); sheet.hidden = false; }
  function close() { sheet.hidden = true; }
  return { open, close, get isOpen() { return !sheet.hidden; } };
}
