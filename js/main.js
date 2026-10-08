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
import { attachGestures } from './input/touch.js';
import { createHud } from './ui/hud.js';

const AUTOSAVE_SECONDS = 15;

const state = loadGame();
const app = document.getElementById('app');
const canvas = document.getElementById('game');
const renderer = createRenderer(canvas);
const scene = new THREE.Scene();
const lighting = createLighting(scene);
const rig = new CameraRig();
const hud = createHud(state);

// ---------------------------------------------------------------------------
// World (rebuilt whenever the building changes)
// ---------------------------------------------------------------------------
let world = null;

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
}

function focusRoom(room, instant = false) {
  const L = world.building.layout;
  rig.frame(L.roomX(room.col), L.roomY(room.floor) + ROOM.H / 2, ROOM.W + 0.6, ROOM.H + 0.8, instant);
}

function focusAll() {
  const { width, roofTop } = world.building.layout;
  const bottom = -0.8;
  rig.frame(0, (roofTop + bottom) / 2, width + 1.6, roofTop - bottom + 0.6);
}

buildWorld();
focusRoom(state.building.rooms[0], true);
events.on('buildingChanged', () => {
  buildWorld();
  focusAll();
});

// ---------------------------------------------------------------------------
// Input & layout
// ---------------------------------------------------------------------------
attachGestures(canvas, {
  onTap(x, y) {
    const hit = pickAt(rig.camera, canvas, x, y, world.building.hitTargets);
    const room = hit && state.building.rooms.find((r) => r.id === hit.object.userData.roomId);
    if (room) focusRoom(room);
  },
  onDrag: (dx, dy) => rig.pan(dx, dy, canvas.clientHeight),
  onPinch: (scale) => rig.zoomBy(scale),
  onWheel: (deltaY) => rig.zoomBy(Math.exp(-deltaY * 0.0015)),
});

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
  tick() { /* simulation arrives with customers and the day cycle */ },
  frame(dt, time) {
    lighting.update(dt);
    rig.update(dt, time);
    hud.update();
    debug?.frame(dt);
    renderer.render(scene, rig.camera);
  },
});
