// Items sitting on shelves. Newly stocked items hop from the shopkeeper's box to their slot, then
// squash and stretch as they land (onLand lets main.js add a sparkle and a note).

import * as THREE from 'three';
import { buildItem } from '../models/items.js';
import { SHELF_LEVELS } from '../models/furniture.js';
import { FIXTURES } from '../../data/fixtures.js';
import { events } from '../../core/events.js';

export const ITEM_SCALE = 1.7;
const HOP_TIME = 0.35, HOP_STAGGER = 0.12, HOP_HEIGHT = 0.35;
const SQUASH_TIME = 0.3, SQUASH = 0.35;

/** Room-local position of a shelf slot (on top of its board). */
function slotLocal(fixture, slot) {
  const { w } = FIXTURES[fixture.kind].size;
  const level = Math.floor(slot / 3), col = slot % 3;
  return new THREE.Vector3(fixture.x - w / 2 + (col + 0.5) * (w / 3), SHELF_LEVELS[level] + 0.025, fixture.z + 0.02);
}

export function createShelvesView(state, roomOrigin, handPosition, onLand = () => {}) {
  const group = new THREE.Group();
  const meshes = new Map(); // `${fixtureId}:${slot}` -> Object3D
  const hops = [];

  function slotWorld(roomId, fixture, slot) {
    const o = roomOrigin(roomId);
    return slotLocal(fixture, slot).add(new THREE.Vector3(o.x, o.y, o.z));
  }

  function addItem(roomId, fixture, slot, itemId) {
    const obj = buildItem(itemId);
    obj.scale.setScalar(ITEM_SCALE);
    obj.position.copy(slotWorld(roomId, fixture, slot));
    group.add(obj);
    meshes.set(`${fixture.id}:${slot}`, obj);
    return obj;
  }

  events.on('stocked', ({ roomId, fixtureId, itemId, slots, by }) => {
    const fixture = state.building.rooms.find((r) => r.id === roomId).fixtures.find((f) => f.id === fixtureId);
    const from = handPosition(by); // from whoever unpacked it (the shopkeeper or Bea)
    slots.forEach((slot, i) => {
      const obj = addItem(roomId, fixture, slot, itemId);
      const to = obj.position.clone();
      obj.position.copy(from);
      obj.visible = false;
      hops.push({ obj, from, to, t: -i * HOP_STAGGER, step: i });
    });
  });

  events.on('itemTaken', ({ fixtureId, slot }) => {
    const key = `${fixtureId}:${slot}`;
    group.remove(meshes.get(key));
    meshes.delete(key);
  });

  return {
    group,
    rebuild() {
      for (const obj of meshes.values()) group.remove(obj);
      meshes.clear();
      hops.length = 0;
      for (const room of state.building.rooms) {
        for (const f of room.fixtures) {
          f.slots?.forEach((itemId, slot) => { if (itemId) addItem(room.id, f, slot, itemId); });
        }
      }
    },
    update(dt) {
      for (let i = hops.length - 1; i >= 0; i--) {
        const h = hops[i];
        h.t += dt;
        if (h.t < 0) continue;
        h.obj.visible = true;
        if (h.t < HOP_TIME) {
          const p = h.t / HOP_TIME;
          h.obj.position.lerpVectors(h.from, h.to, p);
          h.obj.position.y += Math.sin(p * Math.PI) * HOP_HEIGHT;
          h.obj.scale.setScalar(ITEM_SCALE * (0.6 + 0.4 * p));
          continue;
        }
        if (!h.landed) {
          h.landed = true;
          h.obj.position.copy(h.to);
          onLand(h.to, h.step);
        }
        // Squash flat on landing, spring up a little tall, settle.
        const q = Math.min(1, (h.t - HOP_TIME) / SQUASH_TIME);
        const wobble = Math.sin(q * Math.PI * 2) * (1 - q) * SQUASH;
        h.obj.scale.set(ITEM_SCALE * (1 + wobble * 0.5), ITEM_SCALE * (1 - wobble), ITEM_SCALE * (1 + wobble * 0.5));
        if (q === 1) hops.splice(i, 1);
      }
    },
  };
}
