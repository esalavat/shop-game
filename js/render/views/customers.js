// Draws customers from state: pop in at the door, walk (interpolated between sim ticks),
// carry what they picked, and pop out when they leave.

import * as THREE from 'three';
import { createCharacter } from '../models/character.js';
import { buildItem } from '../models/items.js';

const POP_TIME = 0.3;
const HELD_SCALE = 1.5;
const lerp = (a, b, t) => a + (b - a) * t;
const wrap = (a) => Math.atan2(Math.sin(a), Math.cos(a));

export function createCustomersView(state, roomOrigin) {
  const group = new THREE.Group();
  const shown = new Map(); // customerId -> entry
  const hitTargets = [];
  const tmp = new THREE.Vector3();

  function add(c) {
    const { root, inner } = createCharacter(c.look);
    const hit = new THREE.Mesh(new THREE.BoxGeometry(0.5, 1.1, 0.5), new THREE.MeshBasicMaterial({ visible: false }));
    hit.position.y = 0.55;
    hit.userData = { roomId: c.roomId, customerId: c.id };
    root.add(hit);
    hitTargets.push(hit);
    group.add(root);
    const entry = { c, root, inner, hit, prev: { x: c.x, z: c.z }, facing: c.facing, phase: Math.random() * 6, t: 0, gone: false, held: null, heldItem: null };
    shown.set(c.id, entry);
    return entry;
  }

  function remove(entry) {
    group.remove(entry.root);
    hitTargets.splice(hitTargets.indexOf(entry.hit), 1);
    shown.delete(entry.c.id);
  }

  function updateHeld(e) {
    const c = e.c;
    const want = c.basket.length && c.state !== 'paying' ? c.basket[c.basket.length - 1] : null;
    if (want === e.heldItem) return;
    if (e.held) e.inner.remove(e.held);
    e.held = null;
    if (want) {
      e.held = buildItem(want);
      e.held.scale.setScalar(HELD_SCALE / c.look.scale);
      e.held.position.set(0, 0.42, 0.26);
      e.inner.add(e.held);
    }
    e.heldItem = want;
  }

  return {
    group,
    hitTargets,

    beforeTick() {
      for (const e of shown.values()) { e.prev.x = e.c.x; e.prev.z = e.c.z; }
    },

    /** World position just above a customer's head (for speech bubbles). */
    headPosition(id) {
      const e = shown.get(id);
      if (!e) return null;
      e.root.updateMatrixWorld();
      return e.root.localToWorld(tmp.set(0, 1.2, 0)).clone();
    },

    frame(dt, alpha) {
      const live = new Set(state.customers.map((c) => c.id));
      for (const c of state.customers) if (!shown.has(c.id)) add(c);
      for (const e of shown.values()) {
        if (!live.has(e.c.id) && !e.gone) { e.gone = true; e.t = POP_TIME; }
        if (e.gone) {
          e.t -= dt;
          if (e.t <= 0) { remove(e); continue; }
        } else {
          e.t = Math.min(POP_TIME, e.t + dt);
        }
        const c = e.c;
        const o = roomOrigin(c.roomId);
        e.root.position.set(o.x + lerp(e.prev.x, c.x, alpha), o.y, o.z + lerp(e.prev.z, c.z, alpha));
        e.facing += wrap(c.facing - e.facing) * Math.min(1, dt * 10);
        e.root.rotation.y = e.facing;
        const p = e.t / POP_TIME;
        e.root.scale.setScalar(c.look.scale * Math.max(0.01, p < 1 ? p * (1.1 - 0.1 * p) : 1));

        const moving = c.path.length > 0;
        e.phase += dt * (moving ? 10 : 2);
        e.inner.position.y = moving ? Math.abs(Math.sin(e.phase)) * 0.05 : 0;
        e.inner.rotation.z = moving ? Math.sin(e.phase) * 0.08 : 0;
        e.inner.scale.y = moving ? 1 : 1 + Math.sin(e.phase) * 0.02;
        updateHeld(e);
      }
    },
  };
}
