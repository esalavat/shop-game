// Decorate mode's bottom panel: the Dream Dollhouse's four rooms as tabs, and the Collection items
// that fit the chosen room. Tap an item to place it; tap it again (or "Empty") to take it out.
// The 3D dollhouse stays visible above, and tapping one of its rooms picks that tab too.

import { ITEMS } from '../data/items.js';
import { DOLLHOUSE_SLOTS } from '../data/dollhouse.js';
import { fitsSlot, placeInDollhouse, slotById } from '../sim/collection.js';
import { roundOpen } from '../sim/catalog.js';
import { events } from '../core/events.js';

export function createDecorate(state, thumbs, { onSelect, onClose }) {
  const panel = document.getElementById('decorate');
  const rooms = panel.querySelector('.deco-rooms');
  const items = panel.querySelector('.deco-items');
  const hint = panel.querySelector('.deco-hint');
  const sparkle = panel.querySelector('.deco-sparkle');
  let selected = null;

  /** Start on an empty room the player has something for, so there's always a first thing to do. */
  function firstUseful() {
    const fillable = (s) => Object.keys(ITEMS).some((id) => state.collection[id] && fitsSlot(s.id, id));
    return (DOLLHOUSE_SLOTS.find((s) => !state.dollhouse.slots[s.id] && fillable(s)) ?? DOLLHOUSE_SLOTS[0]).id;
  }

  rooms.addEventListener('click', (e) => {
    const id = e.target.closest('[data-slot]')?.dataset.slot;
    if (id) select(id);
  });
  items.addEventListener('click', (e) => {
    const b = e.target.closest('[data-item]');
    if (!b || b.disabled) return;
    const itemId = b.dataset.item || null;
    placeInDollhouse(state, selected, state.dollhouse.slots[selected] === itemId ? null : itemId);
  });
  panel.querySelector('.deco-done').addEventListener('click', () => close());
  events.on('dollhouseChanged', () => { if (!panel.hidden) render(); });

  function select(slotId) {
    selected = slotId;
    onSelect(slotId);
    render();
  }

  function render() {
    sparkle.textContent = `✨ ${state.sparkle}`;
    rooms.innerHTML = DOLLHOUSE_SLOTS.map((s) => {
      const placed = state.dollhouse.slots[s.id];
      const pic = placed ? `<img alt="" src="${thumbs.get(placed)}">` : `<span class="deco-room-ico">${s.icon}</span>`;
      return `<button data-slot="${s.id}" class="${s.id === selected ? 'on' : ''}">${pic}<span>${s.name}</span></button>`;
    }).join('');

    // Colors from rounds that haven't opened yet stay hidden (GDD #77).
    const fits = Object.keys(ITEMS).filter((id) => fitsSlot(selected, id) && (state.collection[id] || roundOpen(state, ITEMS[id].round)));
    const found = fits.filter((id) => state.collection[id]);
    const current = state.dollhouse.slots[selected] ?? null;
    hint.textContent = found.length
      ? `What goes in the ${slotById(selected).name.toLowerCase()}?`
      : `Nothing for the ${slotById(selected).name.toLowerCase()} yet. Order something new to find it!`;
    items.innerHTML = [
      `<button data-item="" class="deco-empty${current ? '' : ' on'}"><span>Empty</span></button>`,
      ...fits.map((id) => {
        const have = state.collection[id];
        return `<button data-item="${id}" class="${id === current ? 'on' : ''}${have ? '' : ' locked'}" ${have ? '' : 'disabled'}
          title="${ITEMS[id].name}"><img alt="${ITEMS[id].name}" src="${thumbs.get(id)}"><i>+${ITEMS[id].sparkle}✨</i></button>`;
      }),
    ].join('');
  }

  function close() {
    panel.hidden = true;
    document.getElementById('toolbar').hidden = false;
    onClose();
  }

  return {
    open(slotId = selected ?? firstUseful()) {
      panel.hidden = false;
      document.getElementById('toolbar').hidden = true;
      select(slotId);
    },
    close,
    select,
    get isOpen() { return !panel.hidden; },
    /** Height of the panel as a fraction of the screen (to keep the dollhouse above it). */
    coverFraction() { return panel.offsetHeight / document.getElementById('app').clientHeight; },
  };
}
