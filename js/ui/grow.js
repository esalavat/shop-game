// The toolbar's fourth button. Before the first expansion it's "Grow": it opens the build sheet
// for the Window Display (and glows once you can afford it). Afterwards it's "Dollhouse", which
// opens decorate mode.

import { nextExpansion, buildExpansion } from '../sim/building.js';
import { displayRoom } from '../sim/collection.js';
import { events } from '../core/events.js';

export function createGrow(state, { onDecorate }) {
  const button = document.getElementById('btn-grow');
  const icon = button.querySelector('.tb-ico');
  const label = button.querySelector('.tb-label');
  const sheet = document.getElementById('grow');
  const build = sheet.querySelector('.grow-build');
  let shown = '';

  button.addEventListener('click', () => {
    if (displayRoom(state)) return onDecorate();
    refresh();
    sheet.hidden = false;
  });
  build.addEventListener('click', () => {
    if (buildExpansion(state)) sheet.hidden = true;
  });
  sheet.querySelector('.close').addEventListener('click', () => (sheet.hidden = true));
  sheet.addEventListener('click', (e) => { if (e.target === sheet) sheet.hidden = true; });

  function refresh() {
    const next = nextExpansion(state);
    if (!next) return;
    const short = next.cost - state.coins;
    build.disabled = short > 0;
    build.textContent = short > 0 ? `🪙 ${next.cost} · ${short} more to go` : `Build it! 🪙 ${next.cost}`;
  }
  events.on('coins', refresh);

  return {
    update() {
      const next = displayRoom(state) ? ['🏠', 'Dollhouse', ''] : ['🔨', 'Grow', state.coins >= (nextExpansion(state)?.cost ?? Infinity) ? 'ready' : ''];
      const key = next.join('|');
      if (key === shown) return;
      shown = key;
      [icon.textContent, label.textContent] = next;
      button.className = next[2];
    },
  };
}
