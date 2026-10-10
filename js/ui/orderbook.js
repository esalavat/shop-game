// The order book: a bottom sheet of item cards showing the box cost, the sell price per item, and the
// profit for the box (GDD #54). Ordering a box spends coins now;
// the box arrives the next morning (or at lunchtime, with the Lunchtime Delivery upgrade).
// Items sit on catalog pages (tabs); fancier pages open as you collect (GDD #66). A page that isn't
// open yet shows its items as silhouettes, except ones you've already found.

import { ITEMS, PAGES, boxCost, boxProfit } from '../data/items.js';
import { placeOrder, canAfford, lunchDeliveryOpen } from '../sim/orders.js';
import { canOrder, foundCount, openPageCount, toNextPage } from '../sim/catalog.js';
import { events } from '../core/events.js';

export function createOrderBook(state, thumbs) {
  const sheet = document.getElementById('orderbook');
  const list = sheet.querySelector('.cards');
  const pending = sheet.querySelector('.pending');
  const tabs = sheet.querySelector('.page-tabs');
  const lockNote = sheet.querySelector('.page-lock');
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

  events.on('coins', refresh);
  events.on('orderPlaced', refresh);
  events.on('dayStarted', refresh);
  events.on('phaseChanged', refresh);
  events.on('lunchDelivery', refresh);
  events.on('pageOpened', ({ page }) => { shown = page; refresh(); });
  sheet.querySelector('.close').addEventListener('click', () => close());
  sheet.addEventListener('click', (e) => { if (e.target === sheet) close(); });

  function open() {
    // Start on the newest page you haven't looked at yet, if there is one.
    const fresh = PAGES.findIndex((p, i) => i < openPageCount(state) && !seen.has(i));
    if (fresh >= 0) shown = fresh;
    refresh();
    sheet.hidden = false;
  }
  function close() { sheet.hidden = true; }
  return { open, close, get isOpen() { return !sheet.hidden; } };
}
