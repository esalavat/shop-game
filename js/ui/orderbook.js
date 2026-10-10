// The order book: a bottom sheet of item cards showing the box cost, the sell price per item, and the
// profit for the box (GDD #54). Ordering a box spends coins now;
// the box arrives the next morning (or at lunchtime, with the Lunchtime Delivery upgrade).
// Items sit on catalog pages (tabs); fancier pages open as you collect (GDD #66). A page that isn't
// open yet shows its items as silhouettes, except ones you've already found.
// Each item you've found shows how many you have (GDD #71): on the shelves, in boxes, and on the way.
// Color rounds (GDD #77): each card is one item with a dot per color; tap a dot to see that color's
// prices and stock. A tab is a page of every round (Starter has the Starter page's Bright colors too).

import { ITEMS, PAGES, STEPS, boxCost, boxProfit, colorsOf, stepOf } from '../data/items.js';
import { placeOrder, canAfford, lunchDeliveryOpen } from '../sim/orders.js';
import { canOrder, needFor, openPageCount, toNextPage } from '../sim/catalog.js';
import { stockCount } from '../sim/stock.js';
import { events } from '../core/events.js';

const fmt = new Intl.NumberFormat();
const coins = (n) => fmt.format(n);

export function createOrderBook(state, thumbs) {
  const sheet = document.getElementById('orderbook');
  const list = sheet.querySelector('.cards');
  const pending = sheet.querySelector('.pending');
  const tabs = sheet.querySelector('.page-tabs');
  const lockNote = sheet.querySelector('.page-lock');
  const legend = sheet.querySelector('.stock-legend');
  const cards = new Map(); // round-1 item id -> card
  const pick = new Map();  // round-1 item id -> the color showing, once you've tapped a dot
  let shown = 0; // which tab (page) is showing
  // Steps (pages of each round) opened while you play get a "new" dot on their tab until you look.
  const seen = new Set(STEPS.map((p, i) => i).filter((i) => i < openPageCount(state)));
  const unseenOn = (page) => STEPS.some((p, i) => p.page === page && i < openPageCount(state) && !seen.has(i));

  const tabButtons = PAGES.map((p, i) => {
    const b = document.createElement('button');
    b.className = 'page-tab';
    b.addEventListener('click', () => { shown = i; refresh(); });
    tabs.append(b);
    return b;
  });

  for (const [base, item] of Object.entries(ITEMS)) {
    if (item.round) continue;
    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = `
      <img alt="">
      <div class="card-name"></div>
      <div class="card-dots">${colorsOf(base).map((id) => `<button class="dot" data-id="${id}" style="--dot:${ITEMS[id].color}" aria-label="${ITEMS[id].name}"></button>`).join('')}</div>
      <div class="card-sub">Box of ${item.perBox}</div>
      <div class="card-sub card-price"></div>
      <div class="card-profit"></div>
      <div class="card-lock"></div>
      <div class="card-have"></div>
      <button class="buy"></button>`;
    card.querySelector('.buy').addEventListener('click', () => placeOrder(state, showing(base)));
    card.querySelector('.card-dots').addEventListener('click', (e) => {
      const dot = e.target.closest('.dot');
      if (!dot) return;
      pick.set(base, dot.dataset.id);
      refresh();
    });
    list.append(card);
    cards.set(base, card);
  }

  /** The color a card shows: the one you tapped, or else the newest you can order. */
  const showing = (base) => pick.get(base) ?? colorsOf(base).findLast((id) => canOrder(state, id)) ?? base;

  function refresh() {
    const open = openPageCount(state); // steps open; tab i's first round is step i
    if (shown < open) STEPS.forEach((p, i) => { if (p.page === shown && i < open) seen.add(i); });
    tabButtons.forEach((b, i) => {
      b.innerHTML = `<span aria-hidden="true">${i < open ? PAGES[i].icon : '🔒'}</span> ${PAGES[i].name}`;
      b.classList.toggle('on', i === shown);
      b.classList.toggle('locked', i >= open);
      b.classList.toggle('new', i < open && unseenOn(i));
    });
    const next = toNextPage(state);
    lockNote.hidden = shown < open;
    legend.hidden = shown >= open;
    if (shown >= open) {
      const need = needFor(state, shown);
      lockNote.textContent = shown === next?.page
        ? `Find ${need} more treasure${need > 1 ? 's' : ''} for your Collection to open this page ✨`
        : `Opens after ${PAGES[shown - 1].name}. Keep collecting! ✨`;
    }
    for (const [base, card] of cards) {
      card.hidden = ITEMS[base].page !== shown;
      if (card.hidden) continue;
      const id = showing(base), item = ITEMS[id];
      const orderable = canOrder(state, id);
      card.classList.toggle('locked', !orderable);
      card.querySelector('img').src = thumbs.get(id);
      card.querySelector('.card-name').textContent = item.name;
      card.querySelector('.card-price').textContent = `Sells for 🪙 ${coins(item.price)} each`;
      card.querySelector('.card-profit').textContent = `+🪙 ${coins(boxProfit(id))} profit`;
      card.querySelector('.buy').innerHTML = `<span aria-hidden="true">🪙</span> ${coins(boxCost(id))}`;
      card.querySelector('.buy').disabled = !orderable || !canAfford(state, id);
      const lock = card.querySelector('.card-lock');
      lock.hidden = orderable || shown >= open;
      if (!lock.hidden) {
        const need = needFor(state, stepOf(id));
        lock.textContent = `🔒 Find ${need} more treasure${need > 1 ? 's' : ''} to open this color`;
      }
      for (const dot of card.querySelectorAll('.dot')) {
        const can = canOrder(state, dot.dataset.id);
        dot.classList.toggle('on', dot.dataset.id === id);
        dot.classList.toggle('locked', !can);
        dot.classList.toggle('new', can && !state.collection[dot.dataset.id]); // a color you haven't found yet
      }
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
  events.on('pageOpened', ({ page }) => {
    shown = STEPS[page].page;
    for (const id of Object.keys(ITEMS)) if (stepOf(id) === page) pick.delete(ITEMS[id].base); // show the new colors
    refresh();
  });
  // Closed by the player (✕ or the backdrop): go back to wherever they came from.
  let onClose = null;
  const closeByPlayer = () => { const back = onClose; close(); back?.(); };
  sheet.querySelector('.close').addEventListener('click', closeByPlayer);
  sheet.addEventListener('click', (e) => { if (e.target === sheet) closeByPlayer(); });

  /** `then` runs when the player closes the book (e.g. back to the day summary). */
  function open({ then = null } = {}) {
    onClose = then;
    // Start on the newest page you haven't looked at yet, if there is one.
    const fresh = PAGES.findIndex((p, i) => i < openPageCount(state) && unseenOn(i));
    if (fresh >= 0) shown = fresh;
    refresh();
    sheet.hidden = false;
  }
  function close() { sheet.hidden = true; onClose = null; }
  return { open, close, get isOpen() { return !sheet.hidden; } };
}
