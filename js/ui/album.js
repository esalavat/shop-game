// The Collection album: every item as a sticker. Found ones are in color; the rest are silhouettes.
// A little house badge marks what's on show in the Dream Dollhouse.

import { ITEMS, SETS } from '../data/items.js';
import { dollhouseItems } from '../sim/collection.js';

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
    grid.innerHTML = ids.map((id) => {
      const item = ITEMS[id], have = state.collection[id];
      return `<div class="sticker${have ? '' : ' locked'}">
        <img alt="" src="${thumbs.get(id)}">
        ${onShow.has(id) ? '<i class="badge" title="In your Dream Dollhouse">🏠</i>' : ''}
        <div class="card-name">${item.name}</div>
        <div class="card-sub">${have ? SETS[item.set] : 'Order one to find it'}</div>
      </div>`;
    }).join('');
  }

  sheet.querySelector('.close').addEventListener('click', () => (sheet.hidden = true));
  sheet.addEventListener('click', (e) => { if (e.target === sheet) sheet.hidden = true; });
  return { open() { render(); sheet.hidden = false; } };
}
