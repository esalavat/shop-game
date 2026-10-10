// Draws helpers from state: Mia the cashier behind the counter (sim/helpers.js), Bea the stocker
// (and Theo and Juno) carrying boxes to the shelves (sim/stocker.js), Ollie the greeter at the door and Rosa the window
// dresser by the Dream Dollhouse (GDD #72), once each is hired. They move smoothly between sim
// ticks, bob while walking, and hop when they do something (Mia on each scan, Bea on each pickup).

import * as THREE from 'three';
import { createCharacter } from '../models/character.js';
import { buildBox } from '../models/items.js';
import { HELPERS, REGISTER_CASHIERS } from '../../data/upgrades.js';
import { BOX_SIZE } from '../../sim/stock.js';
import { events } from '../../core/events.js';
import { groundAt } from '../../sim/route.js';
import { STOCKERS } from '../../sim/stocker.js';
import { registerRoomsBuilt } from '../../sim/building.js';

const lerp = (a, b, t) => a + (b - a) * t;
const wrap = (a) => Math.atan2(Math.sin(a), Math.cos(a));
const CARRY_SCALE = 0.75;
const HAND = new THREE.Vector3(0, 0.5, 0.32); // in front of the chest, character-local (as the shopkeeper's)

function createHelper(look, agent) {
  const { root, inner } = createCharacter({ ...look, apron: true });
  root.visible = false;
  const prev = { x: 0, z: 0, y: 0 };
  let prevRoom = null;
  let facing = 0, idlePhase = 0, walkPhase = 0, placed = false;
  let carried = [], carriedKey = null;
  const h = { root, hop: 0 };

  /** Boxes in their hands (Bea): rebuilt only when what they hold changes. */
  function syncCarried(a) {
    const key = `${a.carrying?.id}|${a.spare?.id}`;
    if (key === carriedKey) return;
    carriedKey = key;
    for (const b of carried) inner.remove(b);
    const boxes = [a.carrying, a.spare].filter(Boolean);
    const scale = boxes.length > 1 ? CARRY_SCALE * 0.72 : CARRY_SCALE;
    carried = boxes.map((box, i) => {
      const b = buildBox(box.itemId, BOX_SIZE);
      b.scale.setScalar(scale);
      const x = boxes.length > 1 ? (i - 0.5) * BOX_SIZE * scale * 1.05 : 0;
      b.position.set(x, HAND.y - (BOX_SIZE * scale) / 2, HAND.z);
      inner.add(b);
      return b;
    });
  }

  h.beforeTick = () => {
    const a = agent();
    if (!a) return;
    prev.x = a.x;
    prev.z = a.z;
    prev.y = a.y ?? 0;
    prevRoom = a.roomId;
  };

  h.handPosition = () => {
    root.updateMatrixWorld();
    return root.localToWorld(HAND.clone());
  };

  h.frame = (dt, alpha, roomOrigin) => {
    const a = agent();
    root.visible = !!a;
    if (!a) {
      placed = false;
      return;
    }
    // First frame after hiring (or loading), or she switched rooms (and coordinates) this tick: no sliding.
    if (!placed || a.roomId !== prevRoom) {
      prevRoom = a.roomId;
      prev.x = a.x;
      prev.z = a.z;
      prev.y = a.y ?? 0;
      facing = a.facing;
      placed = true;
    }
    if ('carrying' in a) syncCarried(a);
    const o = roomOrigin(a.roomId);
    const walking = a.path.length > 0;
    const z = lerp(prev.z, a.z, alpha);
    root.position.set(o.x + lerp(prev.x, a.x, alpha), o.y + groundAt(z) + lerp(prev.y, a.y ?? 0, alpha), o.z + z); // the sidewalk step, the stairs
    facing += wrap(a.facing - facing) * Math.min(1, dt * 10);
    root.rotation.y = facing;
    idlePhase += dt * 2.2;
    walkPhase = walking ? walkPhase + dt * 12 : 0;
    h.hop = Math.max(0, h.hop - dt * 4);
    inner.position.y = Math.sin(h.hop * Math.PI) * 0.06 + Math.abs(Math.sin(walkPhase)) * 0.04;
    inner.scale.y = 1 + (walking ? 0 : Math.sin(idlePhase) * 0.02);
  };
  return h;
}

export function createHelpersView(state, roomOrigin) {
  const group = new THREE.Group();
  const mia = createHelper(HELPERS.cashier.look, () => state.cashier);
  // Stockers by HELPERS id (Bea, Theo, Juno; GDD #72).
  const stockers = Object.fromEntries(STOCKERS.map((who) => [who, createHelper(HELPERS[who].look, () => state.stockers.find((b) => b.who === who))]));
  const ollie = createHelper(HELPERS.greeter.look, () => state.greeter);
  const rosa = createHelper(HELPERS.dresser.look, () => state.dresser);
  const all = [mia, ...Object.values(stockers), ollie, rosa];
  group.add(...all.map((h) => h.root));

  // Register rooms' cashiers (GDD #73): Kai, Nell, ... by floor, added as the rooms are built.
  const tillCashiers = new Map(); // roomId -> helper
  function syncTills() {
    for (const room of registerRoomsBuilt(state)) {
      if (tillCashiers.has(room.id)) continue;
      const { look } = REGISTER_CASHIERS[(room.floor - 1) % REGISTER_CASHIERS.length];
      const h = createHelper(look, () => state.registers?.[room.id]?.cashier);
      tillCashiers.set(room.id, h);
      all.push(h);
      group.add(h.root);
    }
  }

  events.on('scanned', ({ roomId }) => {
    if (tillCashiers.has(roomId)) { if (state.registers[roomId]?.cashier?.serving) tillCashiers.get(roomId).hop = 1; }
    else if (state.cashier?.serving) mia.hop = 1;
  });
  events.on('greeted', () => { if (state.greeter) ollie.hop = 1; });
  events.on('peek', () => { if (state.dresser) rosa.hop = 1; });
  events.on('boxPicked', ({ by }) => { if (stockers[by]) stockers[by].hop = 1; });

  return {
    group,
    beforeTick() { syncTills(); for (const h of all) h.beforeTick(); },
    /** World position of a stocker's hands (where stocked items hop from). */
    stockerHand: (who) => (stockers[who] ?? stockers.stocker).handPosition(),
    frame(dt, alpha) { for (const h of all) h.frame(dt, alpha, roomOrigin); },
  };
}
