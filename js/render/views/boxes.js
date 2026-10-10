// Delivery boxes on the doorstep. Reconciles meshes with state.boxes; new boxes pop in. Boxes in the
// delivery bin (GDD #74) aren't drawn one by one: the bin shows a couple poking out and a count badge,
// and tapping it opens the bin's list (ui/bin.js).

import * as THREE from 'three';
import { buildBox } from '../models/items.js';
import { boxSpot, inBin, shopRoomId, BIN, BOX_SIZE, DOORSTEP_Y } from '../../sim/stock.js';
import { box as slab } from '../models/prims.js';
import { PALETTE as P } from '../toon.js';
import { events } from '../../core/events.js';

const POP_TIME = 0.4;
const FALL_SPEED = 3; // units per second

const BIN_W = 0.5, BIN_D = 0.42, BIN_H = 0.3;

/** A wooden crate, open at the top. */
function buildBin() {
  const g = new THREE.Group();
  slab(g, BIN_W, 0.04, BIN_D, '#c89462', 0, 0.02, 0);
  for (const [w, d, x, z] of [[BIN_W, 0.04, 0, BIN_D / 2], [BIN_W, 0.04, 0, -BIN_D / 2], [0.04, BIN_D, BIN_W / 2, 0], [0.04, BIN_D, -BIN_W / 2, 0]]) {
    slab(g, w, BIN_H, d, P.wood, x, BIN_H / 2, z);
  }
  slab(g, BIN_W + 0.02, 0.05, 0.05, '#c89462', 0, BIN_H * 0.55, BIN_D / 2 + 0.01); // a slat across the front
  return g;
}

/** "+5" on a little pink round label, as a sprite that always faces the camera. */
function badgeSprite() {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 64;
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: texture, depthTest: false }));
  sprite.scale.setScalar(0.24);
  sprite.renderOrder = 10;
  sprite.setCount = (n) => {
    const c = canvas.getContext('2d');
    c.clearRect(0, 0, 64, 64);
    c.fillStyle = '#ff7fb0';
    c.beginPath(); c.arc(32, 32, 30, 0, Math.PI * 2); c.fill();
    c.fillStyle = '#fff';
    c.font = 'bold 30px system-ui, sans-serif';
    c.textAlign = 'center'; c.textBaseline = 'middle';
    c.fillText(String(n), 32, 34);
    texture.needsUpdate = true;
  };
  return sprite;
}

export function createBoxesView(state, roomOrigin) {
  const group = new THREE.Group();
  const shown = new Map(); // boxId -> { obj, hit, t }
  const hitTargets = [];

  // The delivery bin: always on the doorstep; boxes poke out of it and a badge counts them.
  const bin = buildBin();
  const binHit = new THREE.Mesh(new THREE.BoxGeometry(BIN_W + 0.1, BIN_H + 0.3, BIN_D + 0.1), new THREE.MeshBasicMaterial({ visible: false }));
  binHit.userData = { bin: true };
  const peeks = [-0.1, 0.1].map((x, i) => {
    const b = new THREE.Group();
    b.position.set(x, BIN_H - 0.12 + i * 0.03, -0.02 + i * 0.04);
    b.rotation.set(0.1 - i * 0.15, i ? -0.3 : 0.25, i ? 0.12 : -0.1);
    bin.add(b);
    return b;
  });
  const badge = badgeSprite();
  bin.add(badge);
  badge.position.set(BIN_W / 2, BIN_H + 0.18, BIN_D / 2);
  group.add(bin, binHit);
  hitTargets.push(binHit);
  let peekKey = '';

  function syncBin() {
    const roomId = shopRoomId(state);
    const o = roomOrigin(roomId);
    bin.position.set(o.x + BIN.x, o.y + DOORSTEP_Y, o.z + BIN.z);
    binHit.position.set(o.x + BIN.x, o.y + DOORSTEP_Y + (BIN_H + 0.3) / 2, o.z + BIN.z);
    binHit.userData.roomId = roomId;
    const inside = state.boxes.filter(inBin).sort((a, b) => a.spot - b.spot);
    badge.visible = inside.length > 0;
    if (inside.length) badge.setCount(inside.length);
    const key = inside.slice(0, 2).map((b) => b.itemId).join();
    if (key === peekKey) return;
    peekKey = key;
    peeks.forEach((p, i) => {
      p.clear();
      if (inside[i]) p.add(buildBox(inside[i].itemId, BOX_SIZE * 0.7));
    });
  }

  function place(entry, box, animate) {
    const o = roomOrigin(box.roomId);
    const s = boxSpot(box.spot);
    const y = o.y + s.y + s.layer * BOX_SIZE;
    const fallFrom = animate && entry.placed ? entry.obj.position.y : y;
    entry.obj.position.set(o.x + s.x, Math.max(y, fallFrom), o.z + s.z);
    entry.targetY = y;
    entry.placed = true;
    entry.hit.position.set(o.x + s.x, y + BOX_SIZE / 2, o.z + s.z);
  }

  function sync(animate = true) {
    const ids = new Set(state.boxes.map((b) => b.id));
    for (const [id, entry] of shown) {
      if (ids.has(id)) continue;
      group.remove(entry.obj, entry.hit);
      hitTargets.splice(hitTargets.indexOf(entry.hit), 1);
      shown.delete(id);
    }
    syncBin();
    for (const box of state.boxes) {
      if (inBin(box)) {
        const entry = shown.get(box.id);
        if (entry) { group.remove(entry.obj, entry.hit); hitTargets.splice(hitTargets.indexOf(entry.hit), 1); shown.delete(box.id); }
        continue;
      }
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
      place(entry, box, animate);
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
        if (e.obj.position.y > e.targetY) e.obj.position.y = Math.max(e.targetY, e.obj.position.y - FALL_SPEED * dt);
        if (e.t >= POP_TIME) continue;
        e.t = Math.min(POP_TIME, e.t + dt);
        const p = e.t / POP_TIME;
        const s = p < 0.7 ? (p / 0.7) * 1.15 : 1.15 - ((p - 0.7) / 0.3) * 0.15; // overshoot, settle
        e.obj.scale.setScalar(Math.max(0.01, s));
      }
    },
  };
}
