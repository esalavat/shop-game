// Items on the counter during checkout. Each scan makes one hop up and vanish into the bag.

import * as THREE from 'three';
import { buildItem } from '../models/items.js';
import { counterOf } from '../../sim/checkout.js';
import { rotateOffset } from '../../data/fixtures.js';
import { events } from '../../core/events.js';

const ITEM_SCALE = 1.6;
const COUNTER_TOP = 0.51;
const SCAN_TIME = 0.3;

export function createCheckoutView(state, roomOrigin) {
  const group = new THREE.Group();
  // Each register (the shop's and any register rooms', GDD #73) has its own items on its counter.
  const tills = new Map(); // roomId -> { items: [{ obj, t, scanning, y }], pos }
  let lastRoom = null;

  function clear(roomId) {
    const till = tills.get(roomId);
    if (!till) return;
    for (const it of till.items) group.remove(it.obj);
    till.items = [];
  }

  events.on('checkoutStarted', ({ checkout, customer }) => {
    const roomId = checkout.roomId ?? customer.roomId;
    clear(roomId);
    const counter = counterOf(state, roomId);
    if (!counter) return;
    const o = roomOrigin(roomId);
    const pos = new THREE.Vector3(o.x + counter.x, o.y + COUNTER_TOP, o.z + counter.z);
    const items = checkout.items.map((it, i) => {
      const obj = buildItem(it.itemId);
      obj.scale.setScalar(ITEM_SCALE);
      const off = rotateOffset(-0.3 + i * 0.24, 0.08, counter.rot); // along the counter top
      obj.position.set(pos.x + off.x, pos.y, pos.z + off.z);
      group.add(obj);
      return { obj, t: 0, scanning: false, y: obj.position.y };
    });
    tills.set(roomId, { items, pos });
    lastRoom = roomId;
  });

  events.on('scanned', ({ index, roomId }) => {
    const till = tills.get(roomId ?? lastRoom);
    if (till?.items[index]) till.items[index].scanning = true;
    lastRoom = roomId ?? lastRoom;
  });
  events.on('sale', ({ roomId }) => { lastRoom = roomId ?? lastRoom; clear(lastRoom); });
  events.on('checkoutCancelled', ({ roomId } = {}) => { if (roomId) clear(roomId); else for (const id of tills.keys()) clear(id); });

  return {
    group,
    /** World position just above a register's counter top (the last one used by default), for prompts and pop-ups. */
    counterTop: (roomId = lastRoom) => tills.get(roomId)?.pos.clone() ?? null,
    update(dt) {
      for (const till of tills.values()) {
        for (const it of till.items) {
          if (!it.scanning || !it.obj.visible) continue;
          it.t += dt;
          const p = Math.min(1, it.t / SCAN_TIME);
          it.obj.position.y = it.y + Math.sin(p * Math.PI * 0.5) * 0.3;
          it.obj.scale.setScalar(ITEM_SCALE * (1 - p));
          if (p === 1) it.obj.visible = false;
        }
      }
    },
  };
}
