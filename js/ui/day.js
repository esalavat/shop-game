// The day's controls: the toolbar day button (Open shop / clock / Summary) and the closing summary.

import { ITEMS } from '../data/items.js';
import { DAY_LENGTH, openShop, startNextDay } from '../sim/day.js';
import { events } from '../core/events.js';

const clock = (seconds) => {
  const s = Math.max(0, Math.ceil(seconds));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
};

export function createDayUI(state, thumbs, orderBook) {
  const button = document.getElementById('btn-day');
  const icon = button.querySelector('.tb-ico');
  const label = button.querySelector('.tb-label');
  const sheet = document.getElementById('summary');
  let shown = '';

  button.addEventListener('click', () => {
    if (state.day.phase === 'morning') openShop(state);
    else if (state.day.phase === 'close') showSummary();
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
      else if (d.phase === 'open') next = ['🕒', clock(DAY_LENGTH.open - d.time), 'passive'];
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
