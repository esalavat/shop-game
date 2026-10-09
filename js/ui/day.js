// The day's controls: the toolbar day button (Open shop / Close / Summary) and
// the closing summary, which counts the day's numbers up and celebrates a record day (GDD #48).

import { ITEMS } from '../data/items.js';
import { openShop, startNextDay, closeEarly, soldOut } from '../sim/day.js';
import { events } from '../core/events.js';
import { confetti } from './confetti.js';

const CONFIRM_MS = 3000; // how long "Tap again to close" waits for the second tap
const COUNT_MS = 450;    // how long each number takes to count up in the summary

export function createDayUI(state, thumbs, orderBook, toast, audio) {
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

  let counting = 0; // bumps to cancel a count-up that's still running

  /** Count each stat up from 0, one after another, ticking as it goes; then cha-ching. */
  function countUp(stats, record) {
    const run = ++counting;
    const els = [...stats.querySelectorAll('.stat b i')];
    els.forEach((el) => (el.textContent = '0'));
    let i = 0, start = performance.now();
    const step = (now) => {
      if (run !== counting || sheet.hidden) return;
      const el = els[i], target = Number(el.dataset.n);
      const k = target ? Math.min(1, (now - start) / COUNT_MS) : 1;
      const n = Math.round(target * (1 - (1 - k) ** 2));
      if (String(n) !== el.textContent) { el.textContent = n; audio.play('tick', i); }
      if (k === 1) {
        el.parentElement.parentElement.classList.add('done');
        if (++i === els.length) return finish();
        start = now;
      }
      requestAnimationFrame(step);
    };
    const finish = () => {
      audio.play('chaching');
      if (!record) return;
      sheet.querySelector('.summary-record').hidden = false;
      confetti();
      audio.play('fanfare');
      audio.buzz([20, 50, 20, 50, 40]);
    };
    requestAnimationFrame(step);
  }

  function showSummary({ animate = false } = {}) {
    const d = state.day, st = d.stats;
    sheet.querySelector('.summary-title').textContent = `Day ${d.number} is done! 🌙`;
    const stats = sheet.querySelector('.summary-stats');
    stats.innerHTML = [
      ['🪙', st.coins, 'coins earned'],
      ['🛍️', st.served, 'happy customers'],
      ['❤️', st.hearts, 'hearts'],
      ['💝', st.tips, 'in tips'],
    ].map(([ico, n, what]) => `<div class="stat${animate ? '' : ' done'}"><b>${ico} <i data-n="${n}">${n}</i></b><span>${what}</span></div>`).join('');
    sheet.querySelector('.summary-record').hidden = animate || !st.record;

    const row = (counts) => `<div class="thumb-row">${Object.entries(counts)
      .map(([id, n]) => `<div class="thumb" title="${ITEMS[id].name}"><img alt="${ITEMS[id].name}" src="${thumbs.get(id)}">${n > 1 ? `<i>×${n}</i>` : ''}</div>`)
      .join('')}</div>`;
    const wished = {};
    for (const id of st.wishes) wished[id] = (wished[id] ?? 0) + 1;
    sheet.querySelector('.summary-sold').innerHTML = Object.keys(st.sold).length ? `Sold today${row(st.sold)}` : '';
    sheet.querySelector('.summary-wishes').innerHTML = st.wishes.length ? `💭 Customers wished for${row(wished)}` : '';
    sheet.querySelector('.summary-next').textContent = `Start Day ${d.number + 1} ☀️`;
    sheet.hidden = false;
    if (animate) countUp(stats, st.record);
  }

  sheet.querySelector('.close').addEventListener('click', () => (sheet.hidden = true));
  sheet.querySelector('.summary-order').addEventListener('click', () => { sheet.hidden = true; orderBook.open(); });
  sheet.querySelector('.summary-next').addEventListener('click', () => { sheet.hidden = true; startNextDay(state); });
  events.on('dayClosed', () => showSummary({ animate: true }));

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
