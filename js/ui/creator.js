// The shopkeeper creator (GDD #38): a bottom panel of hair, colors, outfit, and accessory choices.
// The camera zooms in on the shopkeeper above it, and every tap changes her look right away.
// Shown on a new game and once for older saves (`shopkeeper.created`); in the morning, tap her to reopen it.

import { CREATOR } from '../data/customers.js';

const ROWS = [
  { key: 'hair', label: 'Hair', options: CREATOR.hair },
  { key: 'hairColor', label: 'Hair color', colors: CREATOR.hairColors },
  { key: 'skin', label: 'Skin', colors: CREATOR.skins },
  { key: 'outfit', label: 'Outfit', colors: CREATOR.outfits },
  { key: 'accessory', label: 'Accessory', options: CREATOR.accessories },
];

export function createCreator(state, { onChange, onOpen, onClose }) {
  const panel = document.getElementById('creator');
  const rows = panel.querySelector('.creator-rows');
  const title = panel.querySelector('.creator-title');

  rows.addEventListener('click', (e) => {
    const b = e.target.closest('[data-key]');
    if (!b) return;
    state.shopkeeper[b.dataset.key] = b.dataset.value;
    onChange(state.shopkeeper);
    render();
  });
  panel.querySelector('.creator-done').addEventListener('click', () => close());
  // 🎲 A random look: one choice from every row.
  panel.querySelector('.creator-random').addEventListener('click', () => {
    const any = (list) => list[Math.floor(Math.random() * list.length)];
    for (const r of ROWS) state.shopkeeper[r.key] = r.colors ? any(r.colors) : any(r.options)[0];
    onChange(state.shopkeeper);
    render();
  });

  function render() {
    const look = state.shopkeeper;
    rows.innerHTML = ROWS.map((r) => {
      const opts = r.colors
        ? r.colors.map((c) => `<button class="swatch${look[r.key] === c ? ' on' : ''}" data-key="${r.key}" data-value="${c}" style="background:${c}" aria-label="${r.label} ${c}"></button>`)
        : r.options.map(([v, name]) => `<button class="${look[r.key] === v ? 'on' : ''}" data-key="${r.key}" data-value="${v}">${name}</button>`);
      return `<div class="creator-row"><span>${r.label}</span><div class="creator-opts">${opts.join('')}</div></div>`;
    }).join('');
  }

  function open() {
    title.textContent = state.shopkeeper.created ? 'Your look ✨' : 'Make your shopkeeper! ✨';
    render();
    panel.hidden = false;
    onOpen();
  }

  function close() {
    if (panel.hidden) return;
    const first = !state.shopkeeper.created;
    state.shopkeeper.created = true;
    panel.hidden = true;
    onClose(first);
  }

  return { open, close, coverFraction: () => panel.offsetHeight / panel.parentElement.offsetHeight, get isOpen() { return !panel.hidden; } };
}
