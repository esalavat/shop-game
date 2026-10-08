// Delivery boxes on the shop floor. Reconciles meshes with state.boxes; new boxes pop in.

import * as THREE from 'three';
import { buildBox } from '../models/items.js';
import { boxSpot, BOX_SIZE } from '../../sim/stock.js';
import { events } from '../../core/events.js';

const POP_TIME = 0.4;

export function createBoxesView(state, roomOrigin) {
  const group = new THREE.Group();
  const shown = new Map(); // boxId -> { obj, hit, t }
  const hitTargets = [];

  function place(entry, box) {
    const o = roomOrigin(box.roomId);
    const s = boxSpot(box.spot);
    entry.obj.position.set(o.x + s.x, o.y + s.y + s.layer * BOX_SIZE, o.z + s.z);
    entry.hit.position.copy(entry.obj.position);
    entry.hit.position.y += BOX_SIZE / 2;
  }

  function sync(animate = true) {
    const ids = new Set(state.boxes.map((b) => b.id));
    for (const [id, entry] of shown) {
      if (ids.has(id)) continue;
      group.remove(entry.obj, entry.hit);
      hitTargets.splice(hitTargets.indexOf(entry.hit), 1);
      shown.delete(id);
    }
    for (const box of state.boxes) {
      let entry = shown.get(box.id);
      if (!entry) {
        const obj = buildBox(box.itemId, BOX_SIZE);
        const hit = new THREE.Mesh(new THREE.BoxGeometry(BOX_SIZE + 0.1, BOX_SIZE + 0.1, BOX_SIZE + 0.1), new THREE.MeshBasicMaterial({ visible: false }));
        hit.userData = { roomId: box.roomId, boxId: box.id };
        entry = { obj, hit, t: animate ? 0 : POP_TIME };
        group.add(obj, hit);
        hitTargets.push(hit);
        shown.set(box.id, entry);
      }
      place(entry, box);
    }
  }

  events.on('boxesChanged', () => sync(true));

  return {
    group,
    hitTargets,
    /** Re-place everything (after the building is rebuilt). */
    rebuild: () => sync(false),
    update(dt) {
      for (const e of shown.values()) {
        if (e.t >= POP_TIME) continue;
        e.t = Math.min(POP_TIME, e.t + dt);
        const p = e.t / POP_TIME;
        const s = p < 0.7 ? (p / 0.7) * 1.15 : 1.15 - ((p - 0.7) / 0.3) * 0.15; // overshoot, settle
        e.obj.scale.setScalar(Math.max(0.01, s));
      }
    },
  };
}
