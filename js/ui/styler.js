// Decorate rooms (GDD #68): a bottom panel for styling the room above it with Ribbons 🎀. ◀ ▶ (or a
// tap on another room) changes room; tabs pick what to style. Tapping a style shows it on the room
// at once: an owned one is put on for good, one you don't own yet is only a preview until you tap
// "Get it". Leaving it (another style, room or Done) puts the room back.

import { DECOR, DECOR_TABS, decorOption, roomDecor, roomLook } from '../data/decor.js';
import { SETS } from '../data/items.js';
import { ROOM_TYPES } from '../data/rooms.js';
import { buyDecor, canStyle, ownsDecor, rewardTheme, styleRoom } from '../sim/decor.js';
import { swatchURL } from '../render/patterns.js';
import { roundOpen } from '../sim/catalog.js';
import { events } from '../core/events.js';

const ROW_NAMES = { paper: 'Colour', pattern: 'Pattern' };

export function createStyler(state, { onRoom, onPreview, onClose, onBought }) {
  const panel = document.getElementById('styler');
  const title = panel.querySelector('.sty-room');
  const ribbons = panel.querySelector('.sty-ribbons');
  const tabs = panel.querySelector('.sty-tabs');
  const rows = panel.querySelector('.sty-rows');
  const buy = panel.querySelector('.sty-buy');
  let roomId = null, tab = 'walls', preview = null; // preview: { kind, id } not owned yet

  /** Rooms in reading order: floor by floor from the ground up, left to right. */
  const rooms = () => [...state.building.rooms].sort((a, b) => a.floor - b.floor || a.col - b.col);
  const room = () => state.building.rooms.find((r) => r.id === roomId);
  const tabsFor = (r) => DECOR_TABS.filter((t) => t.kinds.some((k) => canStyle(r, k)));

  function roomName(r) {
    const type = ROOM_TYPES[r.type];
    const same = rooms().filter((x) => x.type === r.type);
    const n = r.type === 'room' && same.length > 1 ? ` ${same.indexOf(r) + 1}` : '';
    return `${type.name}${n}${r.floor > 0 ? ` · floor ${r.floor + 1}` : ''}`;
  }

  panel.querySelector('.sty-prev').addEventListener('click', () => step(-1));
  panel.querySelector('.sty-next').addEventListener('click', () => step(1));
  panel.querySelector('.deco-done').addEventListener('click', () => close());
  tabs.addEventListener('click', (e) => {
    const id = e.target.closest('[data-tab]')?.dataset.tab;
    if (!id) return;
    tab = id;
    clearPreview();
    render();
  });
  rows.addEventListener('click', (e) => {
    const b = e.target.closest('[data-opt]');
    if (!b) return;
    const [kind, id] = b.dataset.opt.split(':');
    if (ownsDecor(state, kind, id)) {
      clearPreview();
      if (roomDecor(room())[kind] !== id) styleRoom(state, roomId, kind, id);
    } else {
      preview = preview?.kind === kind && preview.id === id ? null : { kind, id };
      onPreview(roomId, preview && { [kind]: id });
    }
    render();
  });
  buy.addEventListener('click', (e) => {
    if (!e.target.closest('.sty-get') || !preview) return;
    const { kind, id } = preview;
    if (!buyDecor(state, kind, id)) return;
    preview = null;
    styleRoom(state, roomId, kind, id); // rebuilds the room with it for good (decorChanged)
    onBought(kind, id);
    render();
  });
  events.on('ribbons', () => { if (!panel.hidden) render(); });

  function clearPreview() {
    if (!preview) return;
    preview = null;
    onPreview(roomId, null);
  }

  function step(dir) {
    const list = rooms(), i = list.findIndex((r) => r.id === roomId);
    select(list[(i + dir + list.length) % list.length].id);
  }

  function select(id) {
    if (id === roomId) return;
    clearPreview();
    roomId = id;
    if (!tabsFor(room()).some((t) => t.id === tab)) tab = 'walls';
    onRoom(room());
    render();
  }

  /** Collection prizes (GDD #87) show once their color round has opened, or once they're yours. */
  const shown = (kind, o) => !o.prize || roundOpen(state, o.round) || ownsDecor(state, kind, o.id);

  function optionButton(kind, opt, current, look) {
    const owned = ownsDecor(state, kind, opt.id);
    const on = preview?.kind === kind ? preview.id === opt.id : current === opt.id;
    const url = swatchURL(kind, opt, look.paper);
    const face = kind === 'paper' || kind === 'curtain'
      ? `<span class="sty-dot" style="background:${kind === 'paper' ? `linear-gradient(90deg, ${opt.paper} 60%, ${opt.stripe} 60%)` : opt.color}"></span>`
      : url ? `<img alt="" src="${url}">` : `<span class="sty-emoji">${opt.icon}</span>`;
    const prize = !owned && rewardTheme(kind, opt.id); // a theme's reward: won, never bought (GDD #86)
    const tag = owned ? '' : prize ? '<i>🌟</i>' : `<i>🎀${opt.price}</i>`;
    const label = owned ? '' : prize ? `, complete ${SETS[prize]} to get it` : `, ${opt.price} ribbons`;
    return `<button data-opt="${kind}:${opt.id}" class="${on ? 'on' : ''}${owned ? '' : ' locked'}" title="${opt.name}" aria-label="${opt.name}${label}">${face}${tag}</button>`;
  }

  function render() {
    const r = room();
    if (!r) return;
    title.textContent = roomName(r);
    ribbons.textContent = `🎀 ${state.ribbons}`;
    const ids = roomDecor(r), look = roomLook(r, preview && { [preview.kind]: preview.id });
    tabs.innerHTML = tabsFor(r).map((t) => `<button data-tab="${t.id}" class="${t.id === tab ? 'on' : ''}"><span aria-hidden="true">${t.icon}</span>${t.name}</button>`).join('');
    const kinds = DECOR_TABS.find((t) => t.id === tab).kinds;
    rows.innerHTML = kinds.map((kind) => `<div class="sty-row">${kinds.length > 1 ? `<span>${ROW_NAMES[kind]}</span>` : ''}
      <div class="sty-opts">${DECOR[kind].filter((o) => shown(kind, o)).map((o) => optionButton(kind, o, ids[kind], look)).join('')}</div></div>`).join('');
    if (preview) {
      const o = decorOption(preview.kind, preview.id), short = o.price - state.ribbons;
      const theme = rewardTheme(preview.kind, preview.id);
      buy.innerHTML = theme
        ? `<span><b>${o.name}</b> · a Collection prize 🌟</span><span class="sty-short">🔒 Complete ${SETS[theme]} to get it</span>`
        : short > 0
          ? `<span><b>${o.name}</b> · 🎀 ${o.price}</span><span class="sty-short">${short} more 🎀 to go</span>`
          : `<span><b>${o.name}</b> · yours in every room</span><button class="sty-get">Get it! 🎀 ${o.price}</button>`;
    } else {
      buy.innerHTML = '<span class="sty-hint">Earn 🎀 by granting wishes and finding new things</span>';
    }
  }

  function close() {
    clearPreview();
    panel.hidden = true;
    document.getElementById('toolbar').hidden = false;
    onClose(room());
  }

  return {
    open(id) {
      panel.hidden = false;
      document.getElementById('toolbar').hidden = true;
      roomId = null;
      select(id);
    },
    close,
    select(id) { if (!panel.hidden) select(id); },
    get isOpen() { return !panel.hidden; },
    get roomId() { return roomId; },
    coverFraction() { return panel.offsetHeight / document.getElementById('app').clientHeight; },
  };
}
