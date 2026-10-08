// Boot: load the save, build the world, wire input and UI, start the loop.

import * as THREE from 'three';
import { loadGame, saveGame, clearSave } from './core/save.js';
import { startLoop } from './core/loop.js';
import { events } from './core/events.js';
import { createRenderer } from './render/renderer.js';
import { createLighting } from './render/lighting.js';
import { createBuilding, ROOM } from './render/building.js';
import { createEnvironment } from './render/environment.js';
import { disposeTree } from './render/models/prims.js';
import { CameraRig } from './render/camera.js';
import { pickAt } from './render/pick.js';
import { createKeeperView } from './render/views/keeper.js';
import { createFx } from './render/fx.js';
import { createBoxesView } from './render/views/boxes.js';
import { createShelvesView } from './render/views/shelves.js';
import { makeThumbnails } from './render/thumbs.js';
import { buildNav } from './sim/nav.js';
import { walkTo, walkToFixture, walkToBox, tickKeeper } from './sim/keeper.js';
import { startNextDay } from './sim/day.js';
import { ITEMS } from './data/items.js';
import { attachGestures } from './input/touch.js';
import { createHud } from './ui/hud.js';
import { createOrderBook } from './ui/orderbook.js';
import { createToaster } from './ui/toast.js';

const AUTOSAVE_SECONDS = 15;

const state = loadGame();
const app = document.getElementById('app');
const canvas = document.getElementById('game');
const renderer = createRenderer(canvas);
const scene = new THREE.Scene();
const lighting = createLighting(scene);
const rig = new CameraRig();
const hud = createHud(state);
const fx = createFx(scene);
const toast = createToaster();
const orderBook = createOrderBook(state, makeThumbnails(renderer, Object.keys(ITEMS)));

// ---------------------------------------------------------------------------
// World (rebuilt whenever the building changes)
// ---------------------------------------------------------------------------
let world = null;
const navs = new Map(); // roomId -> walk grid
const roomById = (id) => state.building.rooms.find((r) => r.id === id);

/** World position of a room's floor center; room-local (x, z) are offsets from it. */
function roomOrigin(roomId) {
  const room = roomById(roomId), L = world.building.layout;
  return { x: L.roomX(room.col), y: L.roomY(room.floor), z: 0 };
}

function buildWorld() {
  if (world) {
    scene.remove(world.group);
    disposeTree(world.group);
  }
  lighting.resetLamps();
  const building = createBuilding(state.building.rooms, lighting);
  const group = new THREE.Group();
  group.add(building.group, createEnvironment(building.layout, lighting));
  scene.add(group);
  lighting.fitTo(building.layout);
  const { width, roofTop } = building.layout;
  rig.setLimits({ minX: -width / 2 - 1, maxX: width / 2 + 1, minY: 0.5, maxY: roofTop });
  world = { group, building };
  navs.clear();
  for (const room of state.building.rooms) navs.set(room.id, buildNav(room));
}

let focusedRoomId = null;

function focusRoom(room, instant = false) {
  focusedRoomId = room.id;
  const L = world.building.layout;
  rig.frame(L.roomX(room.col), L.roomY(room.floor) + ROOM.H / 2, ROOM.W + 0.6, ROOM.H + 0.8, instant);
}

function focusAll() {
  focusedRoomId = null;
  const { width, roofTop } = world.building.layout;
  const bottom = -0.8;
  rig.frame(0, (roofTop + bottom) / 2, width + 1.6, roofTop - bottom + 0.6);
}

buildWorld();
focusRoom(roomById(state.keeper.roomId), true);
const keeperView = createKeeperView(state, roomOrigin);
const boxesView = createBoxesView(state, roomOrigin);
const shelvesView = createShelvesView(state, roomOrigin, () => keeperView.handPosition());
scene.add(keeperView.object, boxesView.group, shelvesView.group);
boxesView.rebuild();
shelvesView.rebuild();
events.on('buildingChanged', () => {
  buildWorld();
  boxesView.rebuild();
  shelvesView.rebuild();
  focusAll();
});

// ---------------------------------------------------------------------------
// Input & layout
// ---------------------------------------------------------------------------
attachGestures(canvas, {
  onTap(x, y) {
    const hit = pickAt(rig.camera, canvas, x, y, [...world.building.hitTargets, ...boxesView.hitTargets]);
    if (!hit) return;
    const { roomId, fixtureId, boxId, floor } = hit.object.userData;
    const room = roomById(roomId);
    // First tap on another room just looks at it.
    if (roomId !== focusedRoomId) return focusRoom(room);
    // Walking between rooms comes later; for now she stays in her room.
    if (roomId !== state.keeper.roomId) return;
    const nav = navs.get(roomId), o = roomOrigin(roomId);
    if (boxId) {
      if (state.keeper.carrying) return toast('Hands full! Tap a shelf to unpack this box first.');
      if (walkToBox(state, nav, state.boxes.find((b) => b.id === boxId))) tapFeedback(o, state.keeper.path.at(-1));
    } else if (fixtureId) {
      const fixture = room.fixtures.find((f) => f.id === fixtureId);
      const task = state.keeper.carrying && fixture.slots ? { type: 'stock', fixtureId } : null;
      if (walkToFixture(state, nav, fixture, task)) tapFeedback(o, state.keeper.path.at(-1));
    } else if (floor) {
      if (walkTo(state, nav, hit.point.x - o.x, hit.point.z - o.z)) tapFeedback(o, state.keeper.path.at(-1));
    }
  },
  onDrag: (dx, dy) => rig.pan(dx, dy, canvas.clientHeight),
  onPinch: (scale) => rig.zoomBy(scale),
  onWheel: (deltaY) => rig.zoomBy(Math.exp(-deltaY * 0.0015)),
});

// ---------------------------------------------------------------------------
// Toolbar & messages
// ---------------------------------------------------------------------------
document.getElementById('btn-order').addEventListener('click', () => orderBook.open());
document.getElementById('btn-nextday').addEventListener('click', () => startNextDay(state));

events.on('orderPlaced', ({ order }) => toast(`Ordered ${ITEMS[order.itemId].name}! Pip brings it tomorrow 📦`));
events.on('dayStarted', ({ day, delivered }) => {
  const boxes = delivered.boxes ? ` Pip delivered ${delivered.boxes} box${delivered.boxes > 1 ? 'es' : ''} 📦` : '';
  toast(`Good morning! Day ${day}.${boxes}`);
  for (const id of delivered.discovered) toast(`✨ New in your Collection: ${ITEMS[id].name}`);
});
events.on('boxPicked', () => toast('Now tap a shelf to unpack it!'));
events.on('shelfFull', () => toast('That shelf is full! Try another one.'));

function tapFeedback(origin, spot) {
  if (spot) fx.tapRing(new THREE.Vector3(origin.x + spot.x, origin.y, origin.z + spot.z));
}

function resize() {
  const w = app.clientWidth, h = app.clientHeight;
  renderer.setSize(w, h, false);
  rig.resize(w / h);
}
new ResizeObserver(resize).observe(app);
resize();

// ---------------------------------------------------------------------------
// Saving
// ---------------------------------------------------------------------------
let resetting = false;
const save = () => { if (!resetting) saveGame(state); };
setInterval(save, AUTOSAVE_SECONDS * 1000);
document.addEventListener('visibilitychange', () => { if (document.hidden) save(); });
addEventListener('pagehide', save);
for (const e of ['orderPlaced', 'dayStarted', 'stocked']) events.on(e, save);

// ---------------------------------------------------------------------------
// Debug (?debug)
// ---------------------------------------------------------------------------
let debug = null;
if (new URLSearchParams(location.search).has('debug')) {
  import('./ui/debug.js').then(({ createDebug }) => {
    debug = createDebug({
      state, lighting, renderer,
      onViewAll: focusAll,
      onReset() {
        resetting = true;
        clearSave();
        location.reload();
      },
    });
  });
}

// ---------------------------------------------------------------------------
// Loop
// ---------------------------------------------------------------------------
startLoop({
  tickRate: 10,
  tick(dt) {
    keeperView.beforeTick();
    tickKeeper(state, dt);
  },
  frame(dt, time, alpha) {
    lighting.update(dt);
    keeperView.frame(dt, alpha);
    boxesView.update(dt);
    shelvesView.update(dt);
    fx.update(dt);
    rig.update(dt, time);
    hud.update();
    debug?.frame(dt);
    renderer.render(scene, rig.camera);
  },
});
