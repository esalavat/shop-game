// The toolbar's Grow button and sheet (GDD #35): the next room to build, helpers to hire, and
// upgrades to buy. After the Window Display, "Build a room" closes the sheet so you can tap a + spot
// on the building (main.js placement mode); rooms further out cost more (GDD §18 #8). After the first
// room comes the Stairwell, always built right next to the shop, then more floors, each pricier. The button glows when there's something new you can afford. Once the Window
// Display is built, a separate Dollhouse button appears next to it and opens decorate mode. At the top,
// Decorate rooms opens the room styler (ui/styler.js, GDD #68).

import { nextExpansion, buildExpansion, canBuildRooms, roomSpots, roomCost, canBuildStairwell, buildStairwell, hasStairwell, buildFloor, stairCost, stairRooms, nextRegisterFloor, registerCost, buildRegister, registerRoomsBuilt } from '../sim/building.js';
import { REGISTER_CASHIERS } from '../data/upgrades.js';
import { displayRoom } from '../sim/collection.js';
import { buyUpgrade, hireHelper, hasUpgrade, hasHelper, canHire } from '../sim/upgrades.js';
import { UPGRADES, HELPERS } from '../data/upgrades.js';
import { events } from '../core/events.js';

const ROOM_INFO = {
  display: {
    art: '🪟🏠✨', name: 'Window Display',
    desc: 'A sunny shop window right next door, with your very own <b>Dream Dollhouse</b> inside. Decorate it with treasures from your Collection. The more it sparkles, the more visitors stop by!',
  },
};

export function createGrow(state, { onDecorate, onPlaceRoom, onStyle }) {
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
    else if (kind === 'stairs' && buildStairwell(state)) sheet.hidden = true;
    else if (kind === 'floor' && buildFloor(state)) sheet.hidden = true;
    else if (kind === 'place') { sheet.hidden = true; return onPlaceRoom(); }
    else if (kind === 'style') { sheet.hidden = true; return onStyle(); }
    else if (kind === 'register') { if (buildRegister(state)) sheet.hidden = true; }
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

  function small({ art, name, desc, cost, owned, ownedText, buy, buyText, locked = null }) {
    const btn = (locked && !owned ? `<button class="grow-build" disabled>${locked}</button>` : null) ?? price(cost, owned, ownedText) ?? `<button class="grow-build" data-buy="${buy}">${buyText} 🪙 ${cost}</button>`;
    return `<div class="grow-card small${owned ? ' owned' : ''}"><div class="grow-art" aria-hidden="true">${art}</div>
      <div><h3>${name}</h3><p>${desc}</p></div>${btn}</div>`;
  }

  function render() {
    const next = nextExpansion(state);
    let html = `<div class="grow-card small grow-style"><div class="grow-art" aria-hidden="true">🎨</div><div><h3>Decorate rooms</h3>
      <p>Wallpaper, floors, rugs, curtains and corner pieces, paid for with Ribbons 🎀 from granted wishes and new finds.</p></div>
      <button class="grow-build" data-buy="style">Decorate · 🎀 ${state.ribbons}</button></div>`;
    html += '<div class="grow-section">Rooms</div>';
    if (next) {
      const info = ROOM_INFO[next.type];
      const btn = price(next.cost, false) ?? `<button class="grow-build" data-buy="room:${next.type}">Build it! 🪙 ${next.cost}</button>`;
      html += `<div class="grow-card"><div class="grow-art" aria-hidden="true">${info.art}</div><h3>${info.name}</h3><p>${info.desc}</p>${btn}</div>`;
    }
    if (canBuildRooms(state)) {
      const cost = cheapestRoom(), short = cost - state.coins;
      const btn = short > 0 ? `<button class="grow-build" disabled>From 🪙 ${cost} · ${short} more to go</button>`
        : `<button class="grow-build" data-buy="place">Pick a spot ＋ from 🪙 ${cost}</button>`;
      html += `<div class="grow-card"><div class="grow-art" aria-hidden="true">🛍️🧸✨</div><h3>Build a room</h3>
        <p>Three more shelves for your shop. Rooms close to the middle are cheapest; they cost more the further out you go, and more on each floor up.</p>${btn}</div>`;
    }
    if (canBuildStairwell(state)) {
      const cost = stairCost(state);
      const btn = price(cost, false) ?? `<button class="grow-build" data-buy="stairs">Build it! 🪙 ${cost}</button>`;
      html += `<div class="grow-card"><div class="grow-art" aria-hidden="true">🪜⬆️✨</div><h3>Stairwell</h3>
        <p>A spiral staircase up to a <b>second floor</b>, with a shelf on each floor. It goes right next to your shop (the rooms beside it shuffle over). Then you can build rooms upstairs!</p>${btn}</div>`;
    } else if (hasStairwell(state)) {
      const cost = stairCost(state), floor = stairRooms(state).length;
      const btn = price(cost, false) ?? `<button class="grow-build" data-buy="floor">Build it! 🪙 ${cost}</button>`;
      html += `<div class="grow-card small"><div class="grow-art" aria-hidden="true">🪜</div><div><h3>Another floor</h3>
        <p>The stairs go up to floor ${floor + 1}, with a shelf at the top. Then build rooms up there too.</p></div>${btn}</div>`;
    }
    if (!next && !canBuildRooms(state)) {
      html += '<div class="grow-done">More rooms are coming soon! 🏗️</div>';
    }
    html += '<div class="grow-section">Helpers</div>';
    for (const [id, h] of Object.entries(HELPERS)) {
      html += small({ art: h.icon, name: `${h.name} the ${h.job}`, desc: h.desc, cost: h.cost, owned: hasHelper(state, id), ownedText: 'Hired 💖', buy: `helper:${id}`, buyText: 'Hire', locked: canHire(state, id) ? null : h.needs === 'display' ? 'Build the Window Display first' : `Hire ${HELPERS[h.needs].name} first` });
    }
    html += '<div class="grow-section">Upgrades</div>';
    // Register rooms (GDD #73): one per floor, straight above the shop, each with its own cashier.
    const regFloor = nextRegisterFloor(state);
    if (regFloor !== null) {
      const cost = registerCost(state), who = REGISTER_CASHIERS[registerRoomsBuilt(state).length % REGISTER_CASHIERS.length].name;
      html += small({ art: '🛎️', name: `Register room · floor ${regFloor + 1}`, cost, buy: 'register', buyText: 'Build it!',
        desc: `A second shop counter, upstairs right above your shop, with ${who} the cashier. Customers on that floor pay there instead of coming down. Rooms in the way move over.` });
    } else if (hasStairwell(state) && !registerRoomsBuilt(state).length) {
      html += small({ art: '🛎️', name: 'Register room', cost: 0, owned: true, ownedText: 'Build another floor first',
        desc: 'A second shop counter upstairs, with its own cashier. One per floor.' });
    }
    for (const [id, u] of Object.entries(UPGRADES)) {
      if (!upgradeListed(id)) continue;
      html += small({ art: u.icon, name: u.name, desc: u.desc, cost: u.cost, owned: hasUpgrade(state, id), ownedText: 'Yours ✓', buy: `upgrade:${id}`, buyText: 'Buy' });
    }
    list.innerHTML = html;
  }

  const upgradeListed = () => true;
  /** The cheapest + spot right now. */
  const cheapestRoom = () => Math.min(...roomSpots(state).map((p) => roomCost(state, p.col, p.floor)));

  /** Something new you can afford right now? */
  function anythingReady() {
    const costs = [
      nextExpansion(state)?.cost,
      canBuildRooms(state) ? cheapestRoom() : null,
      canBuildStairwell(state) || hasStairwell(state) ? stairCost(state) : null,
      nextRegisterFloor(state) !== null ? registerCost(state) : null,
      ...Object.entries(HELPERS).filter(([id]) => !hasHelper(state, id) && canHire(state, id)).map(([, h]) => h.cost),
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
