// The shop building: a grid of open-front rooms (a dollhouse cutaway) with a roof and sign.

import * as THREE from 'three';
import { box, prism } from './models/prims.js';
import { PALETTE as P } from './toon.js';
import { ROOM_TYPES, ROOM_SIZE } from '../data/rooms.js';
import { roomLook } from '../data/decor.js';
import { wallMaterial, floorMaterial } from './patterns.js';
import { FIXTURES } from '../data/fixtures.js';
import { buildFixture, fixtureHitbox } from './models/furniture.js';
import { STAIRS, DOORWAY } from '../sim/route.js';
import { signLines } from '../sim/shopName.js';

export const ROOM = ROOM_SIZE;
const { W, H, D, T } = ROOM;
const ROOF_H = 2.1;

/** Positions for a set of rooms. The building is centered on x = 0; the ground floor sits on y = 0. */
export function layoutRooms(rooms) {
  const cols = rooms.map((r) => r.col);
  const minCol = Math.min(...cols), maxCol = Math.max(...cols);
  const nFloors = Math.max(...rooms.map((r) => r.floor)) + 1;
  const width = (maxCol - minCol + 1) * (W + T) - T;
  const height = nFloors * (H + T) - T;
  const roomX = (col) => -width / 2 + (col - minCol) * (W + T) + W / 2;
  const roomY = (floor) => floor * (H + T);
  return { width, height, roofTop: height + T + ROOF_H, roomX, roomY };
}

/** The hole in the Stairwell top's floor (room-local x0..x1, z0..z1), over the spiral stairs. */
const STAIR_HOLE = { x0: -W / 2, x1: STAIRS.center.x + 0.6, z0: -D / 2 - 0.1, z1: STAIRS.center.z + 0.6 };

/**
 * `preview` ({ roomId, decor }) shows styles on one room without saving them (decorate mode). The roof sign
 * shows `shopName` (GDD #91), or the game's own sign when it's empty; tapping it renames the shop.
 */
export function createBuilding(rooms, lighting, preview = null, shopName = '') {
  const group = new THREE.Group();
  const layout = layoutRooms(rooms);
  const occupied = new Set(rooms.map((r) => `${r.col},${r.floor}`));
  const has = (col, floor) => occupied.has(`${col},${floor}`);
  const hitTargets = [];

  for (const r of rooms) {
    const cx = layout.roomX(r.col), fy = layout.roomY(r.floor);
    // Upstairs rooms open into each other through doorways (GDD #58).
    sideWall(group, cx - W / 2 - T / 2, fy, r.floor > 0 && has(r.col - 1, r.floor));
    if (!has(r.col + 1, r.floor)) sideWall(group, cx + W / 2 + T / 2, fy, false);
    // Floors and ceilings don't cast shadows, so the open-front rooms stay bright inside.
    if (r.type === 'landing') { // an L-shaped slab, open over the stairs
      const { x1, z1 } = STAIR_HOLE, fullD = D + 0.2, front = D / 2 + 0.1 - z1, right = W / 2 + T - x1;
      box(group, W + 2 * T, T, front, P.cream, cx, fy - T / 2, z1 + front / 2).castShadow = false;
      box(group, right, T, fullD - front, P.cream, cx + x1 + right / 2, fy - T / 2, -fullD / 2 + (fullD - front) / 2).castShadow = false;
    } else {
      box(group, W + 2 * T, T, D + 0.2, P.cream, cx, fy - T / 2, 0).castShadow = false;
    }
    if (!has(r.col, r.floor + 1)) box(group, W + 2 * T, T, D + 0.2, P.cream, cx, fy + H + T / 2, 0).castShadow = false;
    hitTargets.push(...furnishRoom(group, r, cx, fy, lighting, preview?.roomId === r.id ? preview.decor : null));
  }

  const { width } = layout;
  box(group, width + 2 * T + 0.1, 0.4 - T, D + 0.3, P.foundation, 0, -0.4 + (0.4 - T) / 2, 0);
  const sign = addRoofs(group, rooms, layout, shopName);
  if (sign) hitTargets.push(sign);
  return { group, layout, hitTargets };
}

/** A side wall between rooms (or at the end), with a doorway in it when `door` is set. */
function sideWall(group, x, fy, door) {
  if (!door) return box(group, T, H, D, P.facade, x, fy + H / 2, 0);
  const z0 = DOORWAY.z - DOORWAY.w / 2, z1 = DOORWAY.z + DOORWAY.w / 2;
  box(group, T, H, z0 + D / 2, P.facade, x, fy + H / 2, (-D / 2 + z0) / 2);
  box(group, T, H, D / 2 - z1, P.facade, x, fy + H / 2, (z1 + D / 2) / 2);
  box(group, T, H - DOORWAY.h, DOORWAY.w, P.facade, x, fy + DOORWAY.h + (H - DOORWAY.h) / 2, DOORWAY.z);
}

/**
 * Roofs: one per run of neighboring columns with the same height, so a building with an upstairs over
 * part of it gets a stepped roofline. A lower roof stops at the taller wall beside it. The sign sits
 * over the shop, and the chimney on the tallest roof.
 */
function addRoofs(group, rooms, layout, shopName) {
  const top = new Map();
  for (const r of rooms) top.set(r.col, Math.max(top.get(r.col) ?? -1, r.floor));
  const cols = [...top.keys()].sort((a, b) => a - b);
  const runs = [];
  for (const c of cols) {
    const last = runs.at(-1);
    if (last && last.to === c - 1 && last.floor === top.get(c)) last.to = c;
    else runs.push({ from: c, to: c, floor: top.get(c) });
  }
  const tallest = runs.reduce((a, b) => (b.floor > a.floor || (b.floor === a.floor && b.to - b.from > a.to - a.from) ? b : a));
  const shop = rooms.find((r) => r.type === 'shop') ?? rooms[0];
  let signMesh = null;
  for (const run of runs) {
    const y = layout.roomY(run.floor) + H + T;
    const tallerLeft = (top.get(run.from - 1) ?? -1) > run.floor, tallerRight = (top.get(run.to + 1) ?? -1) > run.floor;
    const left = layout.roomX(run.from) - W / 2 - T - (tallerLeft ? 0 : 0.3);
    const right = layout.roomX(run.to) + W / 2 + T + (tallerRight ? 0 : 0.3);
    const roof = prism(group, right - left, ROOF_H, D + 0.6, P.roof);
    roof.position.set((left + right) / 2, y, 0);
    roof.castShadow = false;
    if (run === tallest) box(group, 0.45, 1.2, 0.45, P.brick, right - 1.0, y + 1.0, -0.3);
    if (shop.col >= run.from && shop.col <= run.to) {
      const sx = Math.min(Math.max(layout.roomX(shop.col), left + 1.6), right - 1.6), signZ = (D + 0.6) / 2;
      box(group, 2.12, 0.9, 0.06, P.cream, sx, y + 0.62, signZ + 0.01);
      const sign = new THREE.Mesh(new THREE.PlaneGeometry(2.0, 0.78), new THREE.MeshBasicMaterial({ map: signTexture(signLines(shopName)) }));
      sign.position.set(sx, y + 0.62, signZ + 0.05);
      sign.userData = { sign: true };
      group.add(sign);
      signMesh = sign;
    }
  }
  return signMesh;
}

/**
 * Wallpaper, floor, window, lamp and furniture. Returns the meshes a tap can land on, tagged with
 * userData.roomId plus either `floor: true` or a `fixtureId`.
 */
function furnishRoom(group, room, cx, fy, lighting, preview) {
  const look = roomLook(room, preview), { paper, pattern } = look;
  // A printed pattern (dots, gingham, stars, hearts) goes on the wall itself; stripes are boxes below.
  const printed = pattern.id !== 'stripes' && pattern.id !== 'plain';
  const back = box(group, W, H, T, printed ? wallMaterial(paper, pattern, W, H) : paper.paper, cx, fy + H / 2, -D / 2 - T / 2);
  back.userData.roomId = room.id;
  const floors = [];
  const floorPiece = (w, d, x, z) => floors.push(box(group, w, 0.02, d, floorMaterial(look.floor, w, d), x, fy + 0.01, z));
  if (room.type === 'landing') { // around the hole the stairs come up through
    const { x1, z1 } = STAIR_HOLE, front = D / 2 - z1, right = W / 2 - x1;
    floorPiece(W, front, cx, z1 + front / 2);
    floorPiece(right, D - front, cx + x1 + right / 2, -D / 2 + (D - front) / 2);
  } else {
    floorPiece(W, D, cx, 0);
  }
  for (const f of floors) f.userData = { roomId: room.id, floor: true };
  const targets = [back, ...floors];

  // Wallpaper stripes above the wainscot (GDD #68: or plain, or printed on the wall above).
  const wallZ = -D / 2;
  if (pattern.id === 'stripes') {
    for (let x = -W / 2 + 0.2; x < W / 2; x += 0.42) {
      box(group, 0.13, H - 0.6, 0.01, paper.stripe, cx + x, fy + 0.6 + (H - 0.6) / 2, wallZ + 0.005);
    }
  }
  box(group, W, 0.6, 0.03, paper.stripe, cx, fy + 0.3, wallZ + 0.015);
  box(group, W, 0.05, 0.06, P.cream, cx, fy + 0.6, wallZ + 0.03);

  const win = ROOM_TYPES[room.type].window;
  if (win) addWindow(group, cx + win.x, fy + 1.55, wallZ + 0.03, win.w, win.h, look.curtain.color, lighting.glassMat);
  lighting.addPendant(group, cx, fy + H, 0.1);

  for (const f of room.fixtures) {
    const model = buildFixture(f.kind, look);
    model.position.set(cx + f.x, fy, f.z);
    model.rotation.y = f.rot ?? 0;
    group.add(model);
    if (FIXTURES[f.kind].walkable) continue;
    const hit = fixtureHitbox(f.kind);
    hit.position.add(model.position);
    hit.rotation.y = model.rotation.y;
    hit.userData = { roomId: room.id, fixtureId: f.id };
    group.add(hit);
    targets.push(hit);
  }
  return targets;
}

function addWindow(group, x, y, z, w, h, curtain, glassMat) {
  box(group, w + 0.12, h + 0.12, 0.05, P.cream, x, y, z);
  box(group, w, h, 0.06, glassMat, x, y, z).castShadow = false;
  box(group, w, 0.04, 0.08, P.cream, x, y, z);
  box(group, 0.04, h, 0.08, P.cream, x, y, z);
  box(group, 0.2, h + 0.2, 0.04, curtain, x - w / 2 - 0.05, y, z + 0.06);
  box(group, 0.2, h + 0.2, 0.04, curtain, x + w / 2 + 0.05, y, z + 0.06);
}

function signTexture(lines, height = 400) {
  const c = document.createElement('canvas');
  c.width = 1024; c.height = height;
  const g = c.getContext('2d');
  g.fillStyle = P.cream;
  g.fillRect(0, 0, c.width, c.height);
  g.fillStyle = '#e0679a';
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  const lineH = c.height / lines.length;
  lines.forEach((text, i) => {
    let size = 150;
    do { g.font = `800 ${size}px ui-rounded, "SF Pro Rounded", "Trebuchet MS", sans-serif`; size -= 4; }
    while (g.measureText(text).width > c.width - 80);
    g.fillText(text, c.width / 2, lineH * (i + 0.5) + 6);
  });
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}
