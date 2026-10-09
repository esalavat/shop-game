// The first-day guide's arrows (GDD #57; steps in sim/tutorial.js): a bouncing pink arrow with a
// short label over the next thing to tap. The Open shop step points at the toolbar button instead.
// That arrow also comes back any morning when nothing has happened for a few seconds.

import * as THREE from 'three';
import { boxSpot, BOX_SIZE, freeSlots } from '../sim/stock.js';
import { FIXTURES } from '../data/fixtures.js';
import { counterOf, keeperAtCounter } from '../sim/checkout.js';
import { shopRoom } from '../sim/route.js';

const IDLE_NUDGE = 5; // seconds of nothing happening in the morning before pointing at Open shop

export function createGuide({ state, overlay, roomOrigin, isBlocked }) {
  let idle = 0;
  addEventListener('pointerdown', () => { idle = 0; }, { capture: true });

  const btnArrow = document.createElement('div');
  btnArrow.className = 'guide-btn';
  btnArrow.innerHTML = '<span>Open your shop!</span>';
  btnArrow.hidden = true;
  document.getElementById('app').append(btnArrow);

  function boxTarget() {
    let best = null;
    for (const b of state.boxes) {
      const o = roomOrigin(b.roomId), s = boxSpot(b.spot);
      const p = new THREE.Vector3(o.x + s.x, o.y + s.y + (s.layer + 1) * BOX_SIZE + 0.1, o.z + s.z);
      if (!best || p.y > best.y) best = p;
    }
    return best;
  }

  function shelfTarget() {
    const room = state.building.rooms.find((r) => r.id === state.keeper.roomId);
    const shelves = (room?.fixtures ?? []).filter((f) => f.slots && freeSlots(f).length);
    if (!shelves.length) return null;
    const f = shelves.reduce((a, b) => (freeSlots(b).length > freeSlots(a).length ? b : a));
    const o = roomOrigin(room.id);
    return new THREE.Vector3(o.x + f.x, o.y + FIXTURES[f.kind].size.h + 0.1, o.z + f.z);
  }

  function registerTarget() {
    if (!state.checkout && !state.queue.length) return null;
    if (state.checkout && keeperAtCounter(state)) return null; // the "Tap to scan" prompt takes over
    const room = shopRoom(state), counter = counterOf(state, room.id);
    if (!counter) return null;
    const o = roomOrigin(room.id);
    return new THREE.Vector3(o.x + counter.x, o.y + FIXTURES.counter.size.h + 0.6, o.z + counter.z);
  }

  const STEPS = {
    box: { target: boxTarget, label: 'Tap a box!' },
    shelf: { target: shelfTarget, label: 'Tap a shelf to unpack!' },
    register: { target: registerTarget, label: 'Tap the register!' },
  };

  return {
    update(dt) {
      // Nothing happening: no taps, and the shopkeeper standing still.
      idle = state.keeper.path.length ? 0 : idle + dt;
      const blocked = isBlocked();
      const step = blocked ? null : state.tutorial;
      const s = STEPS[step];
      const p = s?.target();
      if (p) overlay.bubble('guide', () => p, s.label, 'guide');
      else overlay.removeBubble('guide');

      const nudge = !blocked && state.tutorial === 'done' && state.day.phase === 'morning' && idle >= IDLE_NUDGE;
      btnArrow.hidden = step !== 'open' && !nudge;
      if (!btnArrow.hidden) {
        const b = document.getElementById('btn-day').getBoundingClientRect();
        const a = document.getElementById('app').getBoundingClientRect();
        btnArrow.style.left = `${b.left - a.left + b.width / 2}px`;
        btnArrow.style.top = `${b.top - a.top - 8}px`;
      }
    },
  };
}
