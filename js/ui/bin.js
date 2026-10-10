// The delivery bin's list (GDD #74): what's waiting in the bin, one card per item with its picture,
// name and how many boxes. Tap one and your shopkeeper goes to fetch a box of it from the bin.

import { ITEMS } from '../data/items.js';
import { inBin } from '../sim/stock.js';
import { events } from '../core/events.js';

export function createBinSheet(state, thumbs, { onPick }) {
  const sheet = document.getElementById('bin');
  const list = sheet.querySelector('.cards');
  const note = sheet.querySelector('.pending');

  function render() {
    const boxes = state.boxes.filter(inBin).sort((a, b) => a.spot - b.spot);
    note.textContent = boxes.length
      ? `${boxes.length} box${boxes.length > 1 ? 'es' : ''} waiting. Tap one to fetch it!`
      : 'The bin is empty. Extra deliveries go in here when the doorstep is full.';
    const byItem = new Map();
    for (const b of boxes) byItem.set(b.itemId, [...(byItem.get(b.itemId) ?? []), b]);
    list.innerHTML = [...byItem].map(([itemId, group]) => `<button class="card bin-box" data-box="${group[0].id}">
        <img alt="" src="${thumbs.get(itemId)}">
        <div class="card-name">${ITEMS[itemId].name}</div>
        <div class="card-sub">${group.length} box${group.length > 1 ? 'es' : ''}</div>
      </button>`).join('');
  }

  list.addEventListener('click', (e) => {
    const b = e.target.closest('[data-box]');
    if (!b) return;
    close();
    onPick(state.boxes.find((x) => x.id === b.dataset.box));
  });
  const close = () => { sheet.hidden = true; };
  sheet.querySelector('.close').addEventListener('click', close);
  // It opens from a tap on the 3D bin (on pointerup); on a phone the click that follows lands on the
  // backdrop above a short sheet and would close it straight away, so ignore the backdrop for a moment.
  let openedAt = 0;
  sheet.addEventListener('click', (e) => { if (e.target === sheet && performance.now() - openedAt > 400) close(); });
  events.on('boxesChanged', () => { if (!sheet.hidden) render(); });

  return { open() { render(); sheet.hidden = false; openedAt = performance.now(); }, close };
}
