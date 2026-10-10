// The Collection album: every item as a sticker, one section per theme (GDD #66). Found ones are in
// color; the rest are silhouettes. Each theme shows the room style it gives when complete (GDD #69). A little house badge marks what's on show in the Dream Dollhouse.

import { ITEMS, SETS } from '../data/items.js';
import { dollhouseItems } from '../sim/collection.js';
import { THEME_STYLES, styleName } from '../data/decor.js';

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
    const sticker = (id) => {
      const item = ITEMS[id], have = state.collection[id];
      return `<div class="sticker${have ? '' : ' locked'}">
        <img alt="" src="${thumbs.get(id)}">
        ${onShow.has(id) ? '<i class="badge" title="In your Dream Dollhouse">🏠</i>' : ''}
        <div class="card-name">${item.name}</div>
      </div>`;
    };
    grid.innerHTML = Object.entries(SETS).map(([set, name]) => {
      const inSet = ids.filter((id) => ITEMS[id].set === set);
      const got = inSet.filter((id) => state.collection[id]).length;
      const done = got === inSet.length;
      const reward = `<div class="album-reward${done ? ' done' : ''}">🎁 ${styleName(...THEME_STYLES[set])}${done ? ': yours! ✓' : ' room style when complete'}</div>`;
      return `<div class="album-set"><span>${name}</span><span>${done ? '🌟' : ''} ${got} / ${inSet.length}</span></div>
        ${inSet.map(sticker).join('')}${reward}`;
    }).join('');
  }

  sheet.querySelector('.close').addEventListener('click', () => (sheet.hidden = true));
  sheet.addEventListener('click', (e) => { if (e.target === sheet) sheet.hidden = true; });
  return { open() { render(); sheet.hidden = false; } };
}
