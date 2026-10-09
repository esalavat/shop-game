// Draws the shopkeeper from state: interpolates between sim ticks, turns smoothly,
// bobs while walking, breathes while idle, hops when she reaches furniture, and holds the box she carries
// (two, stacked, with the Stock Cart). setLook() swaps her outfit from the creator.

import * as THREE from 'three';
import { createCharacter } from '../models/character.js';
import { disposeTree } from '../models/prims.js';
import { buildBox } from '../models/items.js';
import { BOX_SIZE } from '../../sim/stock.js';
import { events } from '../../core/events.js';

const lerp = (a, b, t) => a + (b - a) * t;
const wrap = (a) => Math.atan2(Math.sin(a), Math.cos(a));
const CARRY_SCALE = 0.75;
const HAND = new THREE.Vector3(0, 0.5, 0.32); // in front of her chest, character-local

export function createKeeperView(state, roomOrigin) {
  const object = new THREE.Group();
  let root, inner;
  const k = state.keeper;
  const prev = { x: k.x, z: k.z };
  let facing = k.facing, walkPhase = 0, idlePhase = 0, hop = 0;
  let carried = [], carriedKey = null;

  // An invisible box around her, so she can be tapped (to open the creator in the morning).
  const hit = new THREE.Mesh(new THREE.BoxGeometry(0.55, 1.3, 0.55), new THREE.MeshBasicMaterial({ visible: false }));
  hit.position.y = 0.65;
  hit.userData = { keeper: true, roomId: k.roomId };
  object.add(hit);

  function setLook(look) {
    if (root) {
      object.remove(root);
      disposeTree(root);
    }
    ({ root, inner } = createCharacter({ ...look, apron: true }));
    object.add(root);
    carriedKey = null; // re-add any carried boxes to the new body
  }
  setLook(state.shopkeeper);

  events.on('keeperArrived', ({ fixtureId }) => { if (fixtureId) hop = 1; });

  return {
    object,
    hitTargets: [hit],
    setLook,

    /** Call right before each sim tick so frames can interpolate between ticks. */
    beforeTick() {
      prev.x = k.x;
      prev.z = k.z;
    },

    /** World position of her hands (where a carried box sits). */
    handPosition() {
      root.updateMatrixWorld();
      return root.localToWorld(HAND.clone());
    },

    frame(dt, alpha) {
      const key = `${k.carrying?.id}|${k.spare?.id}`;
      if (key !== carriedKey) {
        for (const b of carried) b.parent?.remove(b);
        const boxes = [k.carrying, k.spare].filter(Boolean);
        // Two boxes (Stock Cart) go side by side and a bit smaller, so they never hide her face.
        const scale = boxes.length > 1 ? CARRY_SCALE * 0.72 : CARRY_SCALE;
        carried = boxes.map((box, i) => {
          const b = buildBox(box.itemId, BOX_SIZE);
          b.scale.setScalar(scale);
          const x = boxes.length > 1 ? (i - 0.5) * BOX_SIZE * scale * 1.05 : 0;
          b.position.set(x, HAND.y - (BOX_SIZE * scale) / 2, HAND.z);
          inner.add(b);
          return b;
        });
        carriedKey = key;
      }

      const o = roomOrigin(k.roomId);
      object.position.set(o.x + lerp(prev.x, k.x, alpha), o.y, o.z + lerp(prev.z, k.z, alpha));
      facing += wrap(k.facing - facing) * Math.min(1, dt * 12);
      object.rotation.y = facing;

      const moving = k.path.length > 0;
      idlePhase += dt * 2;
      if (moving) walkPhase += dt * 11;
      hop = Math.max(0, hop - dt * 3.5);
      const hopY = Math.sin(hop * Math.PI) * 0.12;
      inner.position.y = (moving ? Math.abs(Math.sin(walkPhase)) * 0.06 : 0) + hopY;
      inner.rotation.z = moving ? Math.sin(walkPhase) * 0.08 : 0;
      inner.scale.y = moving ? 1 : 1 + Math.sin(idlePhase) * 0.02;
    },
  };
}
