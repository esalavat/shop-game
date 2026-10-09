// Debug panel, enabled with ?debug in the URL. Loaded on demand so players never download it.

import { addCoins } from '../sim/economy.js';
import { addRoom, addStairwell, hasStairwell, roomSpots, themesLeft } from '../sim/building.js';
import { ROOM_TYPES } from '../data/rooms.js';
import { ITEMS } from '../data/items.js';
import { spawnCustomer } from '../sim/customers.js';
import { openShop, DAY_LENGTH } from '../sim/day.js';

export function createDebug({ state, renderer, quality, onViewAll, onReset, onCopyMain, onStockChanged }) {
  const root = document.createElement('div');
  root.id = 'debug';
  root.innerHTML = `
    <button class="debug-toggle" aria-label="Debug">🐞</button>
    <div class="debug-panel" hidden>
      <div class="debug-stats"></div>
      <button data-act="coins">+100 coins</button>
      <button data-act="fill">Fill shelves</button>
      <button data-act="customer">Spawn customer</button>
      <button data-act="skip">Skip ahead ⏩</button>
      <button data-act="right">Add room →</button>
      <button data-act="up">Upstairs ↑</button>
      <button data-act="all">Whole shop</button>
      ${onCopyMain ? '<button data-act="copyMain" class="danger">Copy main save</button>' : ''}
      <button data-act="reset" class="danger">Reset save</button>
    </div>`;
  document.getElementById('app').append(root);
  const panel = root.querySelector('.debug-panel');
  const stats = root.querySelector('.debug-stats');
  root.querySelector('.debug-toggle').addEventListener('click', () => (panel.hidden = !panel.hidden));

  const types = Object.keys(ROOM_TYPES).filter((t) => t !== 'stairs' && t !== 'landing'); // the Stairwell comes in two halves (Upstairs ↑)
  const nextType = () => types[state.building.rooms.length % types.length];
  const cols = () => state.building.rooms.map((r) => r.col);

  const actions = {
    coins: () => addCoins(state, 100),
    fill: () => {
      const ids = Object.keys(ITEMS);
      let n = 0;
      for (const room of state.building.rooms) {
        for (const f of room.fixtures) f.slots?.forEach((v, i) => { if (!v) f.slots[i] = ids[n++ % ids.length]; });
      }
      onStockChanged();
    },
    customer: () => spawnCustomer(state),
    skip: () => {
      const d = state.day;
      if (d.phase === 'morning') openShop(state);
      else if (d.phase === 'open') d.time = Math.max(d.time, DAY_LENGTH.open - 5);
      else if (d.phase === 'evening') d.time = DAY_LENGTH.evening;
    },
    right: () => {
      const col = Math.max(...cols()) + 1;
      addRoom(state, nextType(), col, 0);
    },
    up: () => {
      // The Stairwell at the right end first, then theme rooms upstairs beside it.
      if (!hasStairwell(state)) return addStairwell(state);
      const spot = roomSpots(state).find((p) => p.floor === 1);
      const type = themesLeft(state)[0];
      if (spot && type) addRoom(state, type, spot.col, 1);
    },
    all: onViewAll,
    reset: () => { if (confirm('Erase the save and start over?')) onReset(); },
    copyMain: () => { if (confirm('Replace this save with a copy of the main game\'s save?')) onCopyMain(); },
  };
  panel.addEventListener('click', (e) => actions[e.target.dataset.act]?.());

  let frames = 0, time = 0;
  return {
    frame(dt) {
      frames++;
      time += dt;
      if (time < 0.5) return;
      const { calls, triangles } = renderer.info.render;
      stats.textContent = `${Math.round(frames / time)} fps · ${quality.pixelRatio}x · ${calls} draws · ${(triangles / 1000).toFixed(1)}k tris`;
      frames = 0;
      time = 0;
    },
  };
}
