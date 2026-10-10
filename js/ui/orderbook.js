// The order book: a bottom sheet of item cards showing the box cost, the sell price per item, and the
// profit for the box (GDD #54). Ordering a box spends coins now;
// the box arrives the next morning (or at lunchtime, with the Lunchtime Delivery upgrade).
// Items sit on catalog pages (tabs); fancier pages open as you collect (GDD #66). A page that isn't
// open yet shows its items as silhouettes, except ones you've already found.
// Each item you've found shows how many you have (GDD #71): on the shelves, in boxes, and on the way.

import { ITEMS, PAGES, boxCost, boxProfit } from '../data/items.js';
import { placeOrder, canAfford, lunchDeliveryOpen } from '../sim/orders.js';
import { canOrder, foundCount, openPageCount, toNextPage } from '../sim/catalog.js';
import { stockCount } from '../sim/stock.js';
import { events } from '../core/events.js';

export function createOrderBook(state, thumbs) {
  const sheet = document.getElementById('orderbook');
  const list = sheet.querySelector('.cards');
  const pending = sheet.querySelector('.pending');
  const tabs = sheet.querySelector('.page-tabs');
  const lockNote = sheet.querySelector('.page-lock');
  const legend = sheet.querySelector('.stock-legend');
  const cards = new Map();
  let shown = 0; // which page is showing
  // Pages opened while you play get a "new" dot until you look at them.
  const seen = new Set(PAGES.map((p, i) => i).filter((i) => i < openPageCount(state)));

  const tabButtons = PAGES.map((p, i) => {
    const b = document.createElement('button');
    b.className = 'page-tab';
    b.addEventListener('click', () => { shown = i; refresh(); });
    tabs.append(b);
    return b;
  });

  for (const [id, item] of Object.entries(ITEMS)) {
    const card = document.createElement('div');
    card.className = 'card';
    card.dataset.page = item.page;
    card.innerHTML = `
      <img alt="" src="${thumbs.get(id)}">
      <div class="card-name">${item.name}</div>
      <div class="card-sub">Box of ${item.perBox}</div>
      <div class="card-sub">Sells for 🪙 ${item.price} each</div>
      <div class="card-profit">+🪙 ${boxProfit(id)} profit</div>
      <div class="card-have"></div>
      <button class="buy"><span aria-hidden="true">🪙</span> ${boxCost(id)}</button>`;
    card.querySelector('.buy').addEventListener('click', () => placeOrder(state, id));
    list.append(card);
    cards.set(id, card);
  }

  function refresh() {
    const open = openPageCount(state);
    if (shown < open) seen.add(shown);
    tabButtons.forEach((b, i) => {
      b.innerHTML = `<span aria-hidden="true">${i < open ? PAGES[i].icon : '🔒'}</span> ${PAGES[i].name}`;
      b.classList.toggle('on', i === shown);
      b.classList.toggle('locked', i >= open);
      b.classList.toggle('new', i < open && !seen.has(i));
    });
    const next = toNextPage(state);
    lockNote.hidden = shown < open;
    legend.hidden = shown >= open;
    if (shown >= open) {
      const need = PAGES[shown].opensAt - foundCount(state);
      lockNote.textContent = shown === next?.page
        ? `Find ${need} more treasure${need > 1 ? 's' : ''} for your Collection to open this page ✨`
        : `Opens after ${PAGES[shown - 1].name}. Keep collecting! ✨`;
    }
    for (const [id, card] of cards) {
      card.hidden = ITEMS[id].page !== shown;
      const orderable = canOrder(state, id);
      card.classList.toggle('locked', !orderable);
      card.querySelector('.buy').disabled = !orderable || !canAfford(state, id);
      showStock(card.querySelector('.card-have'), id);
    }
    if (!state.orders.length) {
      pending.textContent = `Pick something lovely — Pip brings it ${lunchDeliveryOpen(state) ? 'at lunchtime 🥪' : 'tomorrow morning'}.`;
      return;
    }
    const list = (orders) => {
      const counts = {};
      for (const o of orders) counts[o.itemId] = (counts[o.itemId] ?? 0) + 1;
      return Object.entries(counts).map(([id, n]) => `${ITEMS[id].name}${n > 1 ? ` ×${n}` : ''}`).join(', ');
    };
    const lunch = state.orders.filter((o) => o.lunch && o.arrivesDay === state.day.number && state.day.phase !== 'evening' && state.day.phase !== 'close');
    const later = state.orders.filter((o) => !lunch.includes(o));
    pending.textContent = [lunch.length && `Arriving at lunchtime: ${list(lunch)}`, later.length && `Arriving tomorrow: ${list(later)}`].filter(Boolean).join(' · ');
  }

  /** Chips like "🏪 4  📦 3  🚚 3" (the legend is at the top of the book), or "None in the shop!". Only for items you've found. */
  function showStock(el, id) {
    el.hidden = !state.collection[id];
    if (el.hidden) return;
    const { shelf, boxed, coming } = stockCount(state, id);
    const chips = [['🏪', shelf], ['📦', boxed], ['🚚', coming]].filter(([, n]) => n).map(([icon, n]) => `<span>${icon} ${n}</span>`);
    el.classList.toggle('none', !shelf && !boxed);
    el.innerHTML = !shelf && !boxed ? `None in the shop!${coming ? ` <span>🚚 ${coming}</span>` : ''}` : chips.join('');
  }

  events.on('coins', refresh);
  events.on('orderPlaced', refresh);
  events.on('dayStarted', refresh);
  events.on('phaseChanged', refresh);
  events.on('lunchDelivery', refresh);
  // Sales and Bea's stocking go on while the book is open.
  for (const name of ['shelvesChanged', 'boxesChanged', 'itemTaken', 'stocked']) events.on(name, () => { if (!sheet.hidden) refresh(); });
  events.on('pageOpened', ({ page }) => { shown = page; refresh(); });
  // Closed by the player (✕ or the backdrop): go back to wherever they came from.
  let onClose = null;
  const closeByPlayer = () => { const back = onClose; close(); back?.(); };
  sheet.querySelector('.close').addEventListener('click', closeByPlayer);
  sheet.addEventListener('click', (e) => { if (e.target === sheet) closeByPlayer(); });

  /** `then` runs when the player closes the book (e.g. back to the day summary). */
  function open({ then = null } = {}) {
    onClose = then;
    // Start on the newest page you haven't looked at yet, if there is one.
    const fresh = PAGES.findIndex((p, i) => i < openPageCount(state) && !seen.has(i));
    if (fresh >= 0) shown = fresh;
    refresh();
    sheet.hidden = false;
  }
  function close() { sheet.hidden = true; onClose = null; }
  return { open, close, get isOpen() { return !sheet.hidden; } };
}
