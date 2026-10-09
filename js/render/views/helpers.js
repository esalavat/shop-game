// Draws helpers from state: Mia the cashier behind the counter once she's hired (sim/helpers.js).
// She shuffles aside smoothly when the shopkeeper takes over, and gives a little hop on each scan.

import * as THREE from 'three';
import { createCharacter } from '../models/character.js';
import { HELPERS } from '../../data/upgrades.js';
import { events } from '../../core/events.js';

const lerp = (a, b, t) => a + (b - a) * t;
const wrap = (a) => Math.atan2(Math.sin(a), Math.cos(a));

export function createHelpersView(state, roomOrigin) {
  const group = new THREE.Group();
  const { root, inner } = createCharacter({ ...HELPERS.cashier.look, apron: true });
  root.visible = false;
  group.add(root);
  const prev = { x: 0, z: 0 };
  let facing = 0, idlePhase = 0, hop = 0, placed = false;

  events.on('scanned', () => { if (state.cashier?.serving) hop = 1; });

  return {
    group,

    beforeTick() {
      if (!state.cashier) return;
      prev.x = state.cashier.x;
      prev.z = state.cashier.z;
    },

    frame(dt, alpha) {
      const m = state.cashier;
      root.visible = !!m;
      if (!m) {
        placed = false;
        return;
      }
      if (!placed) { // first frame after hiring (or loading): no sliding in from the origin
        prev.x = m.x;
        prev.z = m.z;
        facing = m.facing;
        placed = true;
      }
      const o = roomOrigin(m.roomId);
      root.position.set(o.x + lerp(prev.x, m.x, alpha), o.y, o.z + lerp(prev.z, m.z, alpha));
      facing += wrap(m.facing - facing) * Math.min(1, dt * 10);
      root.rotation.y = facing;
      idlePhase += dt * 2.2;
      hop = Math.max(0, hop - dt * 4);
      inner.position.y = Math.sin(hop * Math.PI) * 0.06;
      inner.scale.y = 1 + Math.sin(idlePhase) * 0.02;
    },
  };
}
