// Items on the counter during checkout. Each scan makes one hop up and vanish into the bag.

import * as THREE from 'three';
import { buildItem } from '../models/items.js';
import { counterOf } from '../../sim/checkout.js';
import { events } from '../../core/events.js';

const ITEM_SCALE = 1.6;
const COUNTER_TOP = 0.51;
const SCAN_TIME = 0.3;

export function createCheckoutView(state, roomOrigin) {
  const group = new THREE.Group();
  let items = []; // { obj, t, scanning }
  let counterPos = null;

  function clear() {
    for (const it of items) group.remove(it.obj);
    items = [];
  }

  events.on('checkoutStarted', ({ checkout, customer }) => {
    clear();
    const counter = counterOf(state, customer.roomId);
    const o = roomOrigin(customer.roomId);
    counterPos = new THREE.Vector3(o.x + counter.x, o.y + COUNTER_TOP, o.z + counter.z);
    checkout.items.forEach((it, i) => {
      const obj = buildItem(it.itemId);
      obj.scale.setScalar(ITEM_SCALE);
      obj.position.set(counterPos.x - 0.3 + i * 0.24, counterPos.y, counterPos.z + 0.08);
      group.add(obj);
      items.push({ obj, t: 0, scanning: false, y: obj.position.y });
    });
  });

  events.on('scanned', ({ index }) => { if (items[index]) items[index].scanning = true; });
  events.on('sale', clear);

  return {
    group,
    /** World position just above the counter top (for prompts and coin pop-ups). */
    counterTop: () => counterPos?.clone() ?? null,
    update(dt) {
      for (const it of items) {
        if (!it.scanning || !it.obj.visible) continue;
        it.t += dt;
        const p = Math.min(1, it.t / SCAN_TIME);
        it.obj.position.y = it.y + Math.sin(p * Math.PI * 0.5) * 0.3;
        it.obj.scale.setScalar(ITEM_SCALE * (1 - p));
        if (p === 1) it.obj.visible = false;
      }
    },
  };
}
