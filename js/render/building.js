// The shop building: a grid of open-front rooms (a dollhouse cutaway) with a roof and sign.

import * as THREE from 'three';
import { box, prism } from './models/prims.js';
import { PALETTE as P } from './toon.js';
import { ROOM_TYPES } from '../data/rooms.js';

export const ROOM = { W: 3.4, H: 2.5, D: 2.6, T: 0.16 };
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

export function createBuilding(rooms, lighting) {
  const group = new THREE.Group();
  const layout = layoutRooms(rooms);
  const occupied = new Set(rooms.map((r) => `${r.col},${r.floor}`));
  const has = (col, floor) => occupied.has(`${col},${floor}`);
  const hitTargets = [];

  for (const r of rooms) {
    const cx = layout.roomX(r.col), fy = layout.roomY(r.floor);
    box(group, T, H, D, P.facade, cx - W / 2 - T / 2, fy + H / 2, 0);
    if (!has(r.col + 1, r.floor)) box(group, T, H, D, P.facade, cx + W / 2 + T / 2, fy + H / 2, 0);
    // Floors and ceilings don't cast shadows, so the open-front rooms stay bright inside.
    box(group, W + 2 * T, T, D + 0.2, P.cream, cx, fy - T / 2, 0).castShadow = false;
    if (!has(r.col, r.floor + 1)) box(group, W + 2 * T, T, D + 0.2, P.cream, cx, fy + H + T / 2, 0).castShadow = false;
    hitTargets.push(...furnishRoom(group, r, cx, fy, lighting));
  }

  const { width, height } = layout;
  box(group, width + 2 * T + 0.1, 0.4 - T, D + 0.3, P.foundation, 0, -0.4 + (0.4 - T) / 2, 0);

  // Roof spans the whole top. (Assumes a rectangular footprint; revisit for stepped buildings.)
  const roofW = width + 2 * T + 0.6;
  const roof = prism(group, roofW, ROOF_H, D + 0.6, P.roof);
  roof.position.y = height + T;
  roof.castShadow = false;
  box(group, 0.45, 1.2, 0.45, P.brick, width / 2 - 0.7, height + T + 1.0, -0.3);

  const signZ = (D + 0.6) / 2;
  box(group, 2.12, 0.9, 0.06, P.cream, 0, height + T + 0.62, signZ + 0.01);
  const sign = new THREE.Mesh(new THREE.PlaneGeometry(2.0, 0.78), new THREE.MeshBasicMaterial({ map: signTexture(['My Dream', 'Dollhouse Shop']) }));
  sign.position.set(0, height + T + 0.62, signZ + 0.05);
  group.add(sign);

  return { group, layout, hitTargets };
}

/** Wallpaper, floor, window and lamp. Returns the meshes a tap can land on to select this room. */
function furnishRoom(group, room, cx, fy, lighting) {
  const look = ROOM_TYPES[room.type];
  const back = box(group, W, H, T, look.paper, cx, fy + H / 2, -D / 2 - T / 2);
  const floor = box(group, W, 0.02, D, look.floor, cx, fy + 0.01, 0);
  back.userData.roomId = floor.userData.roomId = room.id;

  const wallZ = -D / 2;
  for (let x = -W / 2 + 0.2; x < W / 2; x += 0.42) {
    box(group, 0.13, H - 0.6, 0.01, look.stripe, cx + x, fy + 0.6 + (H - 0.6) / 2, wallZ + 0.005);
  }
  box(group, W, 0.6, 0.03, look.stripe, cx, fy + 0.3, wallZ + 0.015);
  box(group, W, 0.05, 0.06, P.cream, cx, fy + 0.6, wallZ + 0.03);

  const win = look.window;
  addWindow(group, cx + win.x, fy + 1.55, wallZ + 0.03, win.w, win.h, look.curtain, lighting.glassMat);
  lighting.addPendant(group, cx, fy + H, 0.1);
  return [back, floor];
}

function addWindow(group, x, y, z, w, h, curtain, glassMat) {
  box(group, w + 0.12, h + 0.12, 0.05, P.cream, x, y, z);
  box(group, w, h, 0.06, glassMat, x, y, z).castShadow = false;
  box(group, w, 0.04, 0.08, P.cream, x, y, z);
  box(group, 0.04, h, 0.08, P.cream, x, y, z);
  box(group, 0.2, h + 0.2, 0.04, curtain, x - w / 2 - 0.05, y, z + 0.06);
  box(group, 0.2, h + 0.2, 0.04, curtain, x + w / 2 + 0.05, y, z + 0.06);
}

function signTexture(lines) {
  const c = document.createElement('canvas');
  c.width = 1024; c.height = 400;
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
