// The toolbar's Grow button and sheet (GDD #35): the next room to build, helpers to hire, and
// upgrades to buy. After the Window Display, "Build a room" lists the theme rooms (GDD #58): pick one,
// and the sheet closes so you can tap a + spot on the building (main.js placement mode). After the
// first theme room, the Stairwell is placed the same way. The button glows when there's something new you can afford. Once the Window
// Display is built, a separate Dollhouse button appears next to it and opens decorate mode.

import { nextExpansion, buildExpansion, canBuildThemeRooms, themesLeft, themeRoomCost, isThemeRoom, canBuildStairwell } from '../sim/building.js';
import { ROOM_TYPES, STAIRWELL_COST } from '../data/rooms.js';
import { displayRoom } from '../sim/collection.js';
import { buyUpgrade, hireHelper, hasUpgrade, hasHelper } from '../sim/upgrades.js';
import { UPGRADES, HELPERS } from '../data/upgrades.js';
import { events } from '../core/events.js';

const ROOM_INFO = {
  display: {
    art: '🪟🏠✨', name: 'Window Display',
    desc: 'A sunny shop window right next door, with your very own <b>Dream Dollhouse</b> inside. Decorate it with treasures from your Collection. The more it sparkles, the more visitors stop by!',
  },
};

export function createGrow(state, { onDecorate, onPlaceRoom }) {
  const button = document.getElementById('btn-grow');
  const dollButton = document.getElementById('btn-dollhouse');
  const toolbar = document.getElementById('toolbar');
  const sheet = document.getElementById('grow');
  const list = sheet.querySelector('.grow-list');
  let shown = '';

  button.addEventListener('click', () => {
    render();
    sheet.hidden = false;
  });
  dollButton.addEventListener('click', () => onDecorate());
  sheet.querySelector('.close').addEventListener('click', () => (sheet.hidden = true));
  sheet.addEventListener('click', (e) => { if (e.target === sheet) sheet.hidden = true; });
  list.addEventListener('click', (e) => {
    const b = e.target.closest('[data-buy]');
    if (!b || b.disabled) return;
    const [kind, id] = b.dataset.buy.split(':');
    if (kind === 'room' && buildExpansion(state)) sheet.hidden = true;
    else if (kind === 'theme' || kind === 'stairs') { sheet.hidden = true; return onPlaceRoom(kind === 'stairs' ? 'stairs' : id); }
    else if (kind === 'helper') hireHelper(state, id);
    else if (kind === 'upgrade') buyUpgrade(state, id);
    render();
  });
  events.on('coins', () => { if (!sheet.hidden) render(); });

  function price(cost, owned, ownedText) {
    if (owned) return `<button class="grow-build" disabled>${ownedText}</button>`;
    const short = cost - state.coins;
    return short > 0 ? `<button class="grow-build" disabled>🪙 ${cost} · ${short} more to go</button>` : null;
  }

  function small({ art, name, desc, cost, owned, ownedText, buy, buyText }) {
    const btn = price(cost, owned, ownedText) ?? `<button class="grow-build" data-buy="${buy}">${buyText} 🪙 ${cost}</button>`;
    return `<div class="grow-card small${owned ? ' owned' : ''}"><div class="grow-art" aria-hidden="true">${art}</div>
      <div><h3>${name}</h3><p>${desc}</p></div>${btn}</div>`;
  }

  function render() {
    const next = nextExpansion(state);
    let html = '<div class="grow-section">Rooms</div>';
    if (next) {
      const info = ROOM_INFO[next.type];
      const btn = price(next.cost, false) ?? `<button class="grow-build" data-buy="room:${next.type}">Build it! 🪙 ${next.cost}</button>`;
      html += `<div class="grow-card"><div class="grow-art" aria-hidden="true">${info.art}</div><h3>${info.name}</h3><p>${info.desc}</p>${btn}</div>`;
    } else if (canBuildThemeRooms(state) && themesLeft(state).length) {
      const cost = themeRoomCost(state), short = cost - state.coins;
      const themes = themesLeft(state).map((t) => `<button class="grow-theme" data-buy="theme:${t}"${short > 0 ? ' disabled' : ''} style="--tint:${ROOM_TYPES[t].paper};--edge:${ROOM_TYPES[t].curtain}"><span aria-hidden="true">${ROOM_TYPES[t].icon}</span>${ROOM_TYPES[t].name}</button>`).join('');
      html += `<div class="grow-card"><div class="grow-art" aria-hidden="true">🏠🧸✨</div><h3>Build a theme room</h3>
        <p>Three more shelves, decorated for one Collection theme. Things from that theme <b>sell for more</b> in their own room!</p>
        <div class="grow-cost">${short > 0 ? `🪙 ${cost} · ${short} more to go` : `🪙 ${cost} · pick a theme, then tap a ＋ on your shop`}</div>
        <div class="grow-themes">${themes}</div></div>`;
    }
    if (canBuildStairwell(state)) {
      const btn = price(STAIRWELL_COST, false) ?? `<button class="grow-build" data-buy="stairs">Build it! 🪙 ${STAIRWELL_COST}</button>`;
      html += `<div class="grow-card"><div class="grow-art" aria-hidden="true">🪜⬆️✨</div><h3>Stairwell</h3>
        <p>A spiral staircase up to a <b>second floor</b>, with a shelf on each floor. Then you can build theme rooms upstairs! Tap a ＋ on your shop to place it.</p>${btn}</div>`;
    }
    if (!next && !(canBuildThemeRooms(state) && themesLeft(state).length) && !canBuildStairwell(state)) {
      html += '<div class="grow-done">More rooms are coming soon! 🏗️</div>';
    }
    html += '<div class="grow-section">Helpers</div>';
    for (const [id, h] of Object.entries(HELPERS)) {
      html += small({ art: h.icon, name: `${h.name} the ${h.job}`, desc: h.desc, cost: h.cost, owned: hasHelper(state, id), ownedText: 'Hired 💖', buy: `helper:${id}`, buyText: 'Hire' });
    }
    html += '<div class="grow-section">Upgrades</div>';
    for (const [id, u] of Object.entries(UPGRADES)) {
      if (!upgradeListed(id)) continue;
      html += small({ art: u.icon, name: u.name, desc: u.desc, cost: u.cost, owned: hasUpgrade(state, id), ownedText: 'Yours ✓', buy: `upgrade:${id}`, buyText: 'Buy' });
    }
    list.innerHTML = html;
  }

  /** Sorting Smarts only makes sense once Bea is hired and there's a theme room (GDD #60). */
  const upgradeListed = (id) => id !== 'sorting' || (hasHelper(state, 'stocker') && state.building.rooms.some(isThemeRoom));

  /** Something new you can afford right now? */
  function anythingReady() {
    const costs = [
      nextExpansion(state)?.cost,
      canBuildThemeRooms(state) && themesLeft(state).length ? themeRoomCost(state) : null,
      canBuildStairwell(state) ? STAIRWELL_COST : null,
      ...Object.entries(HELPERS).filter(([id]) => !hasHelper(state, id)).map(([, h]) => h.cost),
      ...Object.entries(UPGRADES).filter(([id]) => !hasUpgrade(state, id) && upgradeListed(id)).map(([, u]) => u.cost),
    ];
    return costs.some((c) => c != null && state.coins >= c);
  }

  return {
    update() {
      const built = !!displayRoom(state);
      const key = `${built}|${anythingReady()}`;
      if (key === shown) return;
      shown = key;
      dollButton.hidden = !built;
      toolbar.classList.toggle('five', built);
      button.className = anythingReady() ? 'ready' : '';
    },
  };
}
