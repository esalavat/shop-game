// The visit page (visit.html, GDD #91): a friend's shop in 3D, from the link the Share button makes.
// The shop comes from the part of the link after the `#` (sim/share.js), is checked like any hand-made
// link would be, and is drawn with the game's own render code. Nothing is saved, and nothing ticks yet:
// it's a look around. Pinch and drag like the game; tap a room to zoom in; 🏠 goes back to the whole house.

import * as THREE from 'three';
import { createState } from './sim/state.js';
import { decodeShop } from './sim/share.js';
import { DEFAULT_SIGN } from './sim/shopName.js';
import { startLoop } from './core/loop.js';
import { createRenderer } from './render/renderer.js';
import { createLighting } from './render/lighting.js';
import { createBuilding, ROOM } from './render/building.js';
import { createEnvironment } from './render/environment.js';
import { CameraRig } from './render/camera.js';
import { pickAt } from './render/pick.js';
import { createShelvesView } from './render/views/shelves.js';
import { createDollhouseView } from './render/views/dollhouse.js';
import { createQuality } from './render/quality.js';
import { attachGestures } from './input/touch.js';

const app = document.getElementById('app');
const canvas = document.getElementById('game');

addEventListener('hashchange', () => location.reload()); // another shop's link pasted in

let shop;
try {
  shop = await decodeShop(decodeURIComponent(location.hash.slice(1)));
} catch {
  document.getElementById('visit-error').hidden = false;
  window.__booted = true;
  throw new Error('not a shop link');
}

// A state-shaped shop for the render views: the visited shop's rooms, dollhouse, shopkeeper and name.
const state = { ...createState(0), ...shop, boxes: [] };
const roomById = (id) => state.building.rooms.find((r) => r.id === id);

const renderer = createRenderer(canvas);
const scene = new THREE.Scene();
const lighting = createLighting(scene);
const rig = new CameraRig();
lighting.setTwilight(0);

const building = createBuilding(state.building.rooms, lighting, null, state.shopName);
scene.add(building.group, createEnvironment(building.layout, lighting));
lighting.fitTo(building.layout);
const L = building.layout;
const { width, roofTop } = L;
rig.setLimits({ minX: -width / 2 - 1, maxX: width / 2 + 1, minY: 0.5, maxY: roofTop, fit: { cx: 0, cy: (roofTop - 0.8) / 2, w: width + 2.4, h: roofTop + 2.4 } });

const roomOrigin = (roomId) => {
  const room = roomById(roomId);
  return { x: L.roomX(room.col), y: L.roomY(room.floor), z: 0 };
};
const shelvesView = createShelvesView(state, roomOrigin, () => null);
const dollhouseView = createDollhouseView(state, roomOrigin);
scene.add(shelvesView.group, dollhouseView.group);
shelvesView.rebuild();
dollhouseView.rebuild();

// The welcome card and the whole-house button.
document.querySelector('.visit-name').textContent = state.shopName || DEFAULT_SIGN.join(' ');
document.title = `Visit ${state.shopName || DEFAULT_SIGN.join(' ')}`;
const head = document.getElementById('visit-head');
const bar = document.getElementById('visit-bar');
const houseButton = document.getElementById('visit-house');
head.hidden = false;
bar.hidden = false;

let focusedRoomId = null;
function focusRoom(room) {
  focusedRoomId = room.id;
  houseButton.hidden = false;
  head.hidden = true;
  rig.frame(L.roomX(room.col), L.roomY(room.floor) + ROOM.H / 2, ROOM.W + 0.6, ROOM.H + 0.8);
}
function focusAll(instant = false) {
  focusedRoomId = null;
  houseButton.hidden = true;
  const bottom = -0.8;
  rig.frame(0, (roofTop + bottom) / 2, width + 1.6, roofTop - bottom + 0.6, instant);
}
houseButton.addEventListener('click', () => focusAll());
focusAll(true);

attachGestures(canvas, {
  onTap(x, y) {
    const hit = pickAt(rig.camera, canvas, x, y, building.hitTargets);
    const room = hit && roomById(hit.object.userData.roomId);
    if (room && room.id !== focusedRoomId) focusRoom(room);
  },
  onDrag: (dx, dy) => rig.pan(dx, dy, canvas.clientHeight),
  onPinch: (scale) => rig.zoomBy(scale),
  onWheel: (deltaY) => rig.zoomBy(Math.exp(-deltaY * 0.0015)),
});

const quality = createQuality(renderer, () => resize());
function resize() {
  renderer.setPixelRatio(quality.pixelRatio);
  renderer.setSize(app.clientWidth, app.clientHeight, false);
  rig.resize(app.clientWidth / app.clientHeight);
}
new ResizeObserver(resize).observe(app);
resize();
lighting.update(0, true);
window.__booted = true;

startLoop({
  tickRate: 10,
  tick() {},
  frame(dt, time) {
    lighting.update(dt);
    shelvesView.update(dt);
    dollhouseView.update(dt);
    rig.update(dt, time);
    quality.frame(dt);
    renderer.render(scene, rig.camera);
  },
});
