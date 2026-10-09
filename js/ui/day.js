// The day's controls: the toolbar day button (Open shop / Close / Summary) and
// the closing summary.

import { ITEMS } from '../data/items.js';
import { openShop, startNextDay, closeEarly, soldOut } from '../sim/day.js';
import { events } from '../core/events.js';

const CONFIRM_MS = 3000; // how long "Tap again to close" waits for the second tap

export function createDayUI(state, thumbs, orderBook, toast) {
  const button = document.getElementById('btn-day');
  const icon = button.querySelector('.tb-ico');
  const label = button.querySelector('.tb-label');
  const sheet = document.getElementById('summary');
  let shown = '';
  let armedUntil = 0;     // close-early confirm window
  let toldSoldOut = 0;    // day number we last said "sold out" on

  button.addEventListener('click', () => {
    const phase = state.day.phase;
    if (phase === 'morning') openShop(state);
    else if (phase === 'close') showSummary();
    else if (phase === 'open') {
      // Sold out: one tap closes. Otherwise ask for a second tap so it can't happen by accident.
      if (soldOut(state) || performance.now() < armedUntil) closeEarly(state);
      else armedUntil = performance.now() + CONFIRM_MS;
    }
  });

  function showSummary() {
    const d = state.day, st = d.stats;
    sheet.querySelector('.summary-title').textContent = `Day ${d.number} is done! 🌙`;
    sheet.querySelector('.summary-stats').innerHTML = [
      ['🪙', st.coins, 'coins earned'],
      ['🛍️', st.served, 'happy customers'],
      ['❤️', st.hearts, 'hearts'],
      ['💝', st.tips, 'in tips'],
    ].map(([ico, n, what]) => `<div class="stat"><b>${ico} ${n}</b><span>${what}</span></div>`).join('');

    const row = (counts) => `<div class="thumb-row">${Object.entries(counts)
      .map(([id, n]) => `<div class="thumb" title="${ITEMS[id].name}"><img alt="${ITEMS[id].name}" src="${thumbs.get(id)}">${n > 1 ? `<i>×${n}</i>` : ''}</div>`)
      .join('')}</div>`;
    const wished = {};
    for (const id of st.wishes) wished[id] = (wished[id] ?? 0) + 1;
    sheet.querySelector('.summary-sold').innerHTML = Object.keys(st.sold).length ? `Sold today${row(st.sold)}` : '';
    sheet.querySelector('.summary-wishes').innerHTML = st.wishes.length ? `💭 Customers wished for${row(wished)}` : '';
    sheet.querySelector('.summary-next').textContent = `Start Day ${d.number + 1} ☀️`;
    sheet.hidden = false;
  }

  sheet.querySelector('.close').addEventListener('click', () => (sheet.hidden = true));
  sheet.querySelector('.summary-order').addEventListener('click', () => { sheet.hidden = true; orderBook.open(); });
  sheet.querySelector('.summary-next').addEventListener('click', () => { sheet.hidden = true; startNextDay(state); });
  events.on('dayClosed', showSummary);

  return {
    /** If the game was saved after closing, show the summary again on load. */
    resume() { if (state.day.phase === 'close') showSummary(); },

    update() {
      const d = state.day;
      let next;
      if (d.phase === 'morning') next = ['☀️', 'Open shop', 'primary'];
      else if (d.phase === 'open') {
        const out = soldOut(state);
        if (out && toldSoldOut !== d.number) {
          toldSoldOut = d.number;
          toast('Sold out! 🎉 Close up early whenever you like.');
        }
        if (out) next = ['🌙', 'Close early', 'primary'];
        else if (performance.now() < armedUntil) next = ['🌙', 'Tap again to close', 'primary'];
        else next = ['🕒', 'Close', 'passive']; // no digital time: the HUD bar shows how much day is left
      }
      else if (d.phase === 'evening') next = ['🌙', 'Closing soon', 'passive'];
      else next = ['📋', 'Day summary', ''];
      const key = next.join('|');
      if (key === shown) return;
      shown = key;
      [icon.textContent, label.textContent] = next;
      button.className = next[2];
    },
  };
}
