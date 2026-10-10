// The Collection album: every item as a sticker, one section per theme (GDD #66). Found ones are in
// color; the rest are silhouettes. Each theme shows the room style (GDD #69), shopkeeper style and coin
// gift (#70) it gives when complete, and the top shows the Collection bonus. A color round's themes
// (GDD #77) show once that round has opened; the next one is teased at the bottom. A little house badge marks what's on show in the Dream Dollhouse.

import { ITEMS, PAGES, ROUNDS, SETS, setRound } from '../data/items.js';
import { needText, roundOpen } from '../sim/catalog.js';
import { dollhouseItems } from '../sim/collection.js';
import { THEME_STYLES, styleName } from '../data/decor.js';
import { THEME_LOOKS } from '../data/customers.js';
import { collectionBonus } from '../sim/rewards.js';

export function createAlbum(state, thumbs) {
  const sheet = document.getElementById('album');
  const grid = sheet.querySelector('.stickers');
  const count = sheet.querySelector('.album-count');

  function render() {
    const ids = Object.keys(ITEMS);
    const found = ids.filter((id) => state.collection[id]);
    const onShow = dollhouseItems(state);
    count.textContent = found.length === ids.length
      ? `All ${ids.length} treasures found! 🎉`
      : `${found.length} of ${ids.length} treasures found`;
    count.textContent += ` · Collection bonus: +${Math.round(collectionBonus(state) * 100)}% customers 🛍️`;
    const sticker = (id) => {
      const item = ITEMS[id], have = state.collection[id];
      return `<div class="sticker${have ? '' : ' locked'}">
        <img alt="" src="${thumbs.get(id)}">
        ${onShow.has(id) ? '<i class="badge" title="In your Dream Dollhouse">🏠</i>' : ''}
        <div class="card-name">${item.name}</div>
      </div>`;
    };
    const nextRound = ROUNDS.findIndex((r, round) => !roundOpen(state, round));
    const teaser = nextRound < 0 ? '' : `<div class="album-reward">${ROUNDS[nextRound].icon} ${needText(state, nextRound * PAGES.length)} to open ${ROUNDS[nextRound].name} colors of everything!</div>`;
    grid.innerHTML = Object.entries(SETS).filter(([set]) => roundOpen(state, setRound(set))).map(([set, name]) => {
      const inSet = ids.filter((id) => ITEMS[id].set === set);
      const got = inSet.filter((id) => state.collection[id]).length;
      const done = got === inSet.length;
      const prizes = `${styleName(...THEME_STYLES[set])} and ${THEME_LOOKS[set][2]}`;
      const reward = `<div class="album-reward${done ? ' done' : ''}">🎁 ${done ? `${prizes}: yours! ✓` : `${prizes}, plus a 🪙 gift, when complete`}</div>`;
      return `<div class="album-set"><span>${name}</span><span>${done ? '🌟' : ''} ${got} / ${inSet.length}</span></div>
        ${inSet.map(sticker).join('')}${reward}`;
    }).join('') + teaser;
  }

  sheet.querySelector('.close').addEventListener('click', () => (sheet.hidden = true));
  sheet.addEventListener('click', (e) => { if (e.target === sheet) sheet.hidden = true; });
  return { open() { render(); sheet.hidden = false; } };
}
