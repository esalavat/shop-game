// Debug panel, enabled with ?debug in the URL. Loaded on demand so players never download it.

import { addCoins } from '../sim/economy.js';
import { addRoom, hasRoom } from '../sim/building.js';
import { ROOM_TYPES } from '../data/rooms.js';
import { ITEMS } from '../data/items.js';
import { spawnCustomer } from '../sim/customers.js';

export function createDebug({ state, lighting, renderer, onViewAll, onReset, onStockChanged }) {
  const root = document.createElement('div');
  root.id = 'debug';
  root.innerHTML = `
    <button class="debug-toggle" aria-label="Debug">🐞</button>
    <div class="debug-panel" hidden>
      <div class="debug-stats"></div>
      <button data-act="coins">+100 coins</button>
      <button data-act="fill">Fill shelves</button>
      <button data-act="customer">Spawn customer</button>
      <button data-act="twilight">Toggle twilight</button>
      <button data-act="right">Add room →</button>
      <button data-act="up">Add floor ↑</button>
      <button data-act="all">Whole shop</button>
      <button data-act="reset" class="danger">Reset save</button>
    </div>`;
  document.getElementById('app').append(root);
  const panel = root.querySelector('.debug-panel');
  const stats = root.querySelector('.debug-stats');
  root.querySelector('.debug-toggle').addEventListener('click', () => (panel.hidden = !panel.hidden));

  const types = Object.keys(ROOM_TYPES);
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
    twilight: () => lighting.setTwilight(lighting.twilight ? 0 : 1),
    right: () => {
      const col = Math.max(...cols()) + 1;
      addRoom(state, nextType(), col, 0);
    },
    up: () => {
      // Add on top of the first column that has the fewest floors.
      const columns = [...new Set(cols())].sort((a, b) => a - b);
      const height = (c) => state.building.rooms.filter((r) => r.col === c).length;
      const col = columns.reduce((best, c) => (height(c) < height(best) ? c : best), columns[0]);
      let floor = 0;
      while (hasRoom(state, col, floor)) floor++;
      addRoom(state, nextType(), col, floor);
    },
    all: onViewAll,
    reset: () => { if (confirm('Erase the save and start over?')) onReset(); },
  };
  panel.addEventListener('click', (e) => actions[e.target.dataset.act]?.());

  let frames = 0, time = 0;
  return {
    frame(dt) {
      frames++;
      time += dt;
      if (time < 0.5) return;
      const { calls, triangles } = renderer.info.render;
      stats.textContent = `${Math.round(frames / time)} fps · ${calls} draws · ${(triangles / 1000).toFixed(1)}k tris`;
      frames = 0;
      time = 0;
    },
  };
}
