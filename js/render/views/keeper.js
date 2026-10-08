// Draws the shopkeeper from state: interpolates between sim ticks, turns smoothly,
// bobs while walking, breathes while idle, and hops when she reaches furniture.

import { createCharacter } from '../models/character.js';
import { events } from '../../core/events.js';

const lerp = (a, b, t) => a + (b - a) * t;
const wrap = (a) => Math.atan2(Math.sin(a), Math.cos(a));

export function createKeeperView(state, roomOrigin) {
  const { root, inner } = createCharacter({ ...state.shopkeeper, apron: true });
  const k = state.keeper;
  const prev = { x: k.x, z: k.z };
  let facing = k.facing, walkPhase = 0, idlePhase = 0, hop = 0;

  events.on('keeperArrived', ({ fixtureId }) => { if (fixtureId) hop = 1; });

  return {
    object: root,

    /** Call right before each sim tick so frames can interpolate between ticks. */
    beforeTick() {
      prev.x = k.x;
      prev.z = k.z;
    },

    frame(dt, alpha) {
      const o = roomOrigin(k.roomId);
      root.position.set(o.x + lerp(prev.x, k.x, alpha), o.y, o.z + lerp(prev.z, k.z, alpha));
      facing += wrap(k.facing - facing) * Math.min(1, dt * 12);
      root.rotation.y = facing;

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
