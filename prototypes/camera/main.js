// Camera-style prototype: a 2x2 dollhouse-cutaway shop rendered three ways.
// Throwaway code for choosing a camera; not the game's architecture.
import * as THREE from 'three';
import { OutlineEffect } from 'three/addons/effects/OutlineEffect.js';

const canvas = document.getElementById('c');
const app = document.getElementById('app');

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
const outline = new OutlineEffect(renderer, { defaultThickness: 0.004, defaultColor: [0.35, 0.22, 0.33] });

const scene = new THREE.Scene();

// ---------------------------------------------------------------------------
// Materials & mesh helpers
// ---------------------------------------------------------------------------
const gradientMap = (() => {
  const t = new THREE.DataTexture(new Uint8Array([70, 165, 255]), 3, 1, THREE.RedFormat);
  t.minFilter = t.magFilter = THREE.NearestFilter;
  t.needsUpdate = true;
  return t;
})();

const matCache = new Map();
function toon(color) {
  if (!matCache.has(color)) matCache.set(color, new THREE.MeshToonMaterial({ color, gradientMap }));
  return matCache.get(color);
}

function mesh(geo, mat, x = 0, y = 0, z = 0, parent = scene) {
  const m = new THREE.Mesh(geo, typeof mat === 'string' ? toon(mat) : mat);
  m.position.set(x, y, z);
  m.castShadow = m.receiveShadow = true;
  parent.add(m);
  return m;
}
const box = (w, h, d, c, x, y, z, p) => mesh(new THREE.BoxGeometry(w, h, d), c, x, y, z, p);
const cyl = (rt, rb, h, seg, c, x, y, z, p) => mesh(new THREE.CylinderGeometry(rt, rb, h, seg), c, x, y, z, p);
const ball = (r, c, x, y, z, p, detail = 1) => mesh(new THREE.IcosahedronGeometry(r, detail), c, x, y, z, p);

function prism(w, h, d, c, p) {
  const s = new THREE.Shape();
  s.moveTo(-w / 2, 0); s.lineTo(w / 2, 0); s.lineTo(0, h); s.closePath();
  const g = new THREE.ExtrudeGeometry(s, { depth: d, bevelEnabled: false });
  g.translate(0, 0, -d / 2);
  return mesh(g, c, 0, 0, 0, p);
}

function rng(seed) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rand = rng(11);
const pick = (a) => a[Math.floor(rand() * a.length)];

const PASTELS = ['#ff9ec4', '#c8b6ff', '#9fe0c8', '#ffd98a', '#a8d8ff', '#ffb8a0'];
const CREAM = '#fff6ee', WOOD = '#d7a877', DARK = '#5a3a55';

// Evening-reactive materials
const lampShadeMat = new THREE.MeshToonMaterial({ color: '#fff3c9', gradientMap, emissive: '#ffb85c', emissiveIntensity: 0, side: THREE.DoubleSide });
const bulbMat = new THREE.MeshToonMaterial({ color: '#fffbe8', gradientMap, emissive: '#ffd27a', emissiveIntensity: 0 });
const glassMat = new THREE.MeshBasicMaterial({ color: '#cdeaff' });
const GLASS_DAY = new THREE.Color('#cdeaff'), GLASS_EVE = new THREE.Color('#ffc59e');
const lamps = [];

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------
const ITEMS = {
  teacup(p) { cyl(0.07, 0.07, 0.012, 10, CREAM, 0, 0.006, 0, p); cyl(0.05, 0.035, 0.06, 10, pick(PASTELS), 0, 0.04, 0, p); },
  bed(p) {
    box(0.24, 0.05, 0.15, WOOD, 0, 0.025, 0, p); box(0.2, 0.03, 0.13, pick(PASTELS), 0.02, 0.065, 0, p);
    box(0.05, 0.03, 0.1, CREAM, -0.085, 0.07, 0, p); box(0.02, 0.12, 0.15, WOOD, -0.12, 0.06, 0, p);
  },
  chair(p) {
    const c = pick(PASTELS);
    box(0.1, 0.02, 0.1, c, 0, 0.08, 0, p); box(0.1, 0.12, 0.02, c, 0, 0.15, -0.04, p);
    for (const [dx, dz] of [[-0.04, -0.04], [0.04, -0.04], [-0.04, 0.04], [0.04, 0.04]]) box(0.015, 0.08, 0.015, WOOD, dx, 0.04, dz, p);
  },
  doll(p) {
    mesh(new THREE.ConeGeometry(0.06, 0.13, 8), pick(PASTELS), 0, 0.065, 0, p);
    ball(0.045, '#ffd9c2', 0, 0.16, 0, p);
    mesh(new THREE.SphereGeometry(0.05, 8, 4, 0, Math.PI * 2, 0, Math.PI * 0.5), pick(['#6b3e2e', '#f2c46b', '#2e2430', '#c2563a']), 0, 0.165, -0.004, p);
  },
  gift(p) {
    box(0.12, 0.1, 0.12, pick(PASTELS), 0, 0.05, 0, p);
    box(0.125, 0.102, 0.025, CREAM, 0, 0.05, 0, p); box(0.025, 0.102, 0.125, CREAM, 0, 0.05, 0, p);
  },
  house(p) {
    box(0.18, 0.14, 0.13, pick(PASTELS), 0, 0.07, 0, p);
    prism(0.22, 0.1, 0.15, pick(['#b48bd6', '#f27aa8', '#7fbfa8']), p).position.y = 0.14;
    box(0.04, 0.06, 0.01, CREAM, 0, 0.03, 0.066, p);
  },
};
const ITEM_KINDS = Object.keys(ITEMS);

function item(kind, parent, x, y, z, s = 1.5) {
  const g = new THREE.Group();
  g.position.set(x, y, z); g.scale.setScalar(s); g.rotation.y = (rand() - 0.5) * 0.5;
  parent.add(g);
  ITEMS[kind](g);
  return g;
}

function shelf(x, y, z, { w = 1.1, h = 1.6, color = CREAM, kinds = ITEM_KINDS } = {}) {
  const g = new THREE.Group(); g.position.set(x, y, z); scene.add(g);
  box(0.06, h, 0.42, color, -w / 2, h / 2, 0, g); box(0.06, h, 0.42, color, w / 2, h / 2, 0, g);
  box(w, h, 0.03, '#f9e6ee', 0, h / 2, -0.2, g);
  for (const ly of [0.06, 0.58, 1.1]) {
    box(w, 0.05, 0.42, color, 0, ly, 0, g);
    for (let i = 0; i < 3; i++) item(pick(kinds), g, -w / 2 + (i + 0.5) * (w / 3), ly + 0.025, 0.02);
  }
  box(w + 0.08, 0.06, 0.46, color, 0, h, 0, g);
  return g;
}

function wallWindow(x, y, z, w = 0.9, h = 0.8, curtain = '#ff9ec4') {
  box(w + 0.12, h + 0.12, 0.05, CREAM, x, y, z);
  const glass = box(w, h, 0.06, glassMat, x, y, z); glass.castShadow = false;
  box(w, 0.04, 0.08, CREAM, x, y, z); box(0.04, h, 0.08, CREAM, x, y, z);
  box(0.2, h + 0.2, 0.04, curtain, x - w / 2 - 0.05, y, z + 0.06);
  box(0.2, h + 0.2, 0.04, curtain, x + w / 2 + 0.05, y, z + 0.06);
}

function pendant(x, y, z) {
  cyl(0.008, 0.008, 0.35, 4, DARK, x, y - 0.175, z).castShadow = false;
  const shade = mesh(new THREE.ConeGeometry(0.22, 0.18, 10, 1, true), lampShadeMat, x, y - 0.42, z); shade.castShadow = false;
  ball(0.06, bulbMat, x, y - 0.48, z).castShadow = false;
  const L = new THREE.PointLight('#ffcf8a', 0, 5, 1.5); L.position.set(x, y - 0.6, z); scene.add(L); lamps.push(L);
}

function bean({ body = '#ff9ec4', skin = '#ffd9c2', hair = '#6b3e2e', style = 'bob', apron = false, s = 1 } = {}) {
  const g = new THREE.Group();
  const inner = new THREE.Group(); g.add(inner); // inner bobs/wobbles, outer moves
  mesh(new THREE.CapsuleGeometry(0.2, 0.22, 3, 8), body, 0, 0.33, 0, inner);
  ball(0.075, body, -0.22, 0.36, 0, inner); ball(0.075, body, 0.22, 0.36, 0, inner);
  ball(0.07, DARK, -0.08, 0.04, 0.02, inner, 0); ball(0.07, DARK, 0.08, 0.04, 0.02, inner, 0);
  if (apron) box(0.3, 0.3, 0.05, CREAM, 0, 0.3, 0.18, inner);
  ball(0.25, skin, 0, 0.82, 0, inner);
  ball(0.035, '#3a2a3a', -0.085, 0.84, 0.225, inner, 0); ball(0.035, '#3a2a3a', 0.085, 0.84, 0.225, inner, 0);
  ball(0.04, '#ff9fb0', -0.15, 0.77, 0.19, inner, 0).scale.z = 0.4;
  ball(0.04, '#ff9fb0', 0.15, 0.77, 0.19, inner, 0).scale.z = 0.4;
  const cap = mesh(new THREE.SphereGeometry(0.27, 10, 6, 0, Math.PI * 2, 0, Math.PI * (style === 'bob' ? 0.62 : 0.5)), hair, 0, 0.83, -0.02, inner);
  if (style === 'bob') cap.rotation.x = -0.45;
  if (style === 'bun') ball(0.12, hair, 0, 1.1, -0.05, inner);
  if (style === 'pigtails') { ball(0.1, hair, -0.27, 0.86, -0.06, inner); ball(0.1, hair, 0.27, 0.86, -0.06, inner); }
  g.scale.setScalar(s);
  g.userData.inner = inner;
  scene.add(g);
  return g;
}

function miniHouse(x, y, z, s, { wall = '#ff9ec4', roof = '#b48bd6', castle = false } = {}) {
  const g = new THREE.Group(); g.position.set(x, y, z); g.scale.setScalar(s); scene.add(g);
  const w = 0.9, h = 0.9, d = 0.5, t = 0.04;
  box(w, h, t, '#fff0f6', 0, h / 2, -d / 2, g);
  box(w / 2 - t, h / 2 - t, 0.01, '#c8b6ff', -w / 4, h * 0.75, -d / 2 + t / 2 + 0.005, g);
  box(w / 2 - t, h / 2 - t, 0.01, '#9fe0c8', w / 4, h * 0.25, -d / 2 + t / 2 + 0.005, g);
  box(t, h, d, wall, -w / 2, h / 2, 0, g); box(t, h, d, wall, w / 2, h / 2, 0, g);
  box(t, h, d, wall, 0, h / 2, 0, g);
  for (const yy of [0, h / 2, h]) box(w + t, t, d + 0.02, CREAM, 0, yy, 0, g);
  if (castle) {
    for (const sx of [-1, 1]) {
      cyl(0.12, 0.12, h + 0.3, 8, wall, sx * (w / 2 + 0.06), (h + 0.3) / 2, 0, g);
      mesh(new THREE.ConeGeometry(0.16, 0.3, 8), roof, sx * (w / 2 + 0.06), h + 0.45, 0, g);
    }
    for (let i = 0; i < 4; i++) box(0.1, 0.1, d, wall, -w / 2 + 0.1 + i * 0.233, h + 0.07, 0, g);
  } else {
    prism(w + 0.18, 0.42, d + 0.12, roof, g).position.y = h + t / 2;
    box(0.1, 0.22, 0.1, '#e7a0a0', 0.25, h + 0.3, -0.05, g);
  }
  // tiny furniture
  box(0.22, 0.05, 0.14, '#c8b6ff', -0.2, h / 2 + 0.05, -0.05, g); box(0.06, 0.03, 0.1, CREAM, -0.29, h / 2 + 0.09, -0.05, g);
  cyl(0.08, 0.08, 0.02, 8, CREAM, 0.22, 0.12, 0, g); cyl(0.015, 0.015, 0.1, 4, WOOD, 0.22, 0.06, 0, g);
  cyl(0.02, 0.06, 0.08, 6, '#ffd98a', 0.25, h / 2 + 0.2, -0.12, g);
  box(0.12, 0.06, 0.08, '#ff9ec4', -0.22, 0.05, 0, g);
  return g;
}

function tree(x, z, s = 1) {
  cyl(0.1 * s, 0.14 * s, 0.9 * s, 6, '#a9744f', x, -0.4 + 0.45 * s, z);
  ball(0.6 * s, '#8fd19e', x, -0.4 + 1.2 * s, z, scene, 0);
  ball(0.45 * s, '#a6e0ad', x + 0.25 * s, -0.4 + 1.55 * s, z + 0.1, scene, 0);
}

function signTexture(text) {
  const c = document.createElement('canvas'); c.width = 1536; c.height = 220;
  const x = c.getContext('2d');
  x.fillStyle = CREAM; x.fillRect(0, 0, c.width, c.height);
  x.fillStyle = '#e0679a';
  let size = 120;
  do { x.font = `bold ${size}px ui-rounded, "Trebuchet MS", sans-serif`; size -= 4; } while (x.measureText(text).width > c.width - 80);
  x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(text, c.width / 2, c.height / 2 + 6);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
  return t;
}

// ---------------------------------------------------------------------------
// Building: COLS x FLOORS grid of rooms, open at the front like a dollhouse
// ---------------------------------------------------------------------------
const W = 3.4, H = 2.5, D = 2.6, T = 0.16, COLS = 2, FLOORS = 2;
const BW = COLS * (W + T) - T, BH = FLOORS * (H + T) - T;
const roomX = (c) => -BW / 2 + c * (W + T) + W / 2;
const roomY = (f) => f * (H + T);
const FACADE = '#f4b6c8', ROOF = '#b48bd6';
const roomHits = [];

for (let i = 0; i <= COLS; i++) box(T, BH, D, FACADE, -BW / 2 + i * (W + T) - T / 2, BH / 2, 0);
for (let f = 0; f <= FLOORS; f++) box(BW + 2 * T, T, D + 0.2, CREAM, 0, f * (H + T) - T / 2, 0);
box(BW + 2 * T + 0.1, 0.4 - T, D + 0.3, '#e9cfb6', 0, -0.4 + (0.4 - T) / 2, 0);

const roof = prism(BW + 2 * T + 0.6, 1.9, D + 0.6, ROOF); roof.position.y = BH + T;
box(0.45, 1.2, 0.45, '#e7a0a0', BW / 2 - 0.9, BH + T + 1.1, -0.3);
const sign = new THREE.Mesh(new THREE.PlaneGeometry(3.6, 0.516), new THREE.MeshBasicMaterial({ map: signTexture('My Dream Dollhouse Shop') }));
sign.material.userData.outlineParameters = { visible: false };
sign.position.set(0, BH + T + 0.55, (D + 0.6) / 2 + 0.05); scene.add(sign);
box(3.75, 0.66, 0.06, CREAM, 0, BH + T + 0.55, (D + 0.6) / 2 + 0.01);

const ROOMS = [
  { c: 0, f: 0, paper: '#ffe1ec', stripe: '#ffd0e2', floor: '#e8b98a', fill: shopRoom },
  { c: 1, f: 0, paper: '#e3f6ea', stripe: '#d3efdd', floor: '#d9b27c', fill: stockRoom },
  { c: 0, f: 1, paper: '#ece3ff', stripe: '#e0d4ff', floor: '#e8b98a', fill: dollRoom },
  { c: 1, f: 1, paper: '#fff3c9', stripe: '#ffeab0', floor: '#e3b07f', fill: teaRoom },
];

const walkers = [];

for (const r of ROOMS) {
  const cx = roomX(r.c), fy = roomY(r.f);
  const back = box(W, H, T, r.paper, cx, fy + H / 2, -D / 2 - T / 2);
  const floor = box(W, 0.02, D, r.floor, cx, fy + 0.01, 0);
  back.userData.room = floor.userData.room = r;
  roomHits.push(back, floor);
  for (let x = -W / 2 + 0.2; x < W / 2; x += 0.42) box(0.13, H - 0.6, 0.01, r.stripe, cx + x, fy + 0.6 + (H - 0.6) / 2, -D / 2 + 0.005);
  box(W, 0.6, 0.03, r.stripe, cx, fy + 0.3, -D / 2 + 0.015);
  box(W, 0.05, 0.06, CREAM, cx, fy + 0.6, -D / 2 + 0.03);
  pendant(cx, fy + H, 0.1);
  r.fill(cx, fy);
}

function shopRoom(cx, fy) {
  wallWindow(cx + 1.15, fy + 1.55, -D / 2 + 0.03, 0.7, 0.7);
  shelf(cx - 0.95, fy, -D / 2 + 0.24);
  shelf(cx + 0.2, fy, -D / 2 + 0.24, { w: 1.0, color: '#ffd0e2' });
  cyl(0.7, 0.7, 0.02, 12, '#c8b6ff', cx - 0.35, fy + 0.03, 0.15);
  // counter + register
  box(0.95, 0.75, 0.5, WOOD, cx + 1.05, fy + 0.375, 0.1);
  box(1.05, 0.06, 0.58, CREAM, cx + 1.05, fy + 0.78, 0.1);
  box(0.3, 0.2, 0.25, '#ff9ec4', cx + 1.2, fy + 0.91, 0.05);
  box(0.22, 0.12, 0.03, '#a8d8ff', cx + 1.2, fy + 1.05, -0.05).rotation.x = -0.3;
  const keeper = bean({ body: '#9fe0c8', hair: '#c2563a', style: 'bun', apron: true });
  keeper.position.set(cx + 0.95, fy, -0.5);
  walkers.push({ obj: keeper, idle: true, phase: 0 });
  // Dream Dollhouse in the front window spot
  cyl(0.42, 0.46, 0.4, 10, CREAM, cx - 1.15, fy + 0.2, 0.8);
  miniHouse(cx - 1.15, fy + 0.4, 0.8, 0.85);
  addWalker({ body: '#ffd98a', hair: '#2e2430', style: 'pigtails', s: 0.85 }, fy, [
    [cx - 0.95, -0.45, 1.6], [cx - 0.3, 0.3, 0.6], [cx + 1.05, 0.75, 2.2], [cx - 0.45, 1.05, 2.0], [cx + 0.2, -0.45, 1.6],
  ]);
  addWalker({ body: '#c8b6ff', hair: '#f2c46b', style: 'bob' }, fy, [
    [cx + 0.2, -0.45, 2.0], [cx - 0.5, 0.6, 2.4], [cx - 0.95, -0.45, 1.4], [cx + 1.05, 0.75, 2.0],
  ]);
}

function stockRoom(cx, fy) {
  wallWindow(cx - 0.9, fy + 1.55, -D / 2 + 0.03, 0.8, 0.7, '#9fe0c8');
  const crate = (x, y, z, s = 0.42) => {
    box(s, s, s, '#d9b27c', x, y + s / 2, z).rotation.y = (rand() - 0.5) * 0.3;
    box(s + 0.01, 0.06, s * 0.3, '#f3e2c0', x, y + s, z);
  };
  crate(cx + 1.1, fy, -0.9); crate(cx + 1.1, fy + 0.42, -0.9); crate(cx + 0.65, fy, -0.95); crate(cx + 1.15, fy, -0.4, 0.36);
  crate(cx - 1.2, fy, 0.3, 0.36); crate(cx - 1.2, fy + 0.36, 0.3, 0.3);
  shelf(cx + 0.05, fy, -D / 2 + 0.24, { w: 1.0, color: WOOD, kinds: ['gift', 'gift', 'house'] });
  addWalker({ body: '#a8d8ff', hair: '#6b3e2e', style: 'bob', apron: true }, fy, [
    [cx + 0.7, -0.35, 1.2], [cx - 0.6, 0.5, 1.2], [cx + 0.05, -0.45, 1.5],
  ]);
}

function dollRoom(cx, fy) {
  wallWindow(cx, fy + 1.55, -D / 2 + 0.03, 1.0, 0.75, '#c8b6ff');
  shelf(cx - 1.15, fy, -D / 2 + 0.24, { w: 0.9, color: '#ece3ff', kinds: ['doll'] });
  shelf(cx + 1.15, fy, -D / 2 + 0.24, { w: 0.9, color: '#ece3ff', kinds: ['doll', 'doll', 'bed'] });
  cyl(0.55, 0.55, 0.5, 10, CREAM, cx + 0.1, fy + 0.25, -0.1);
  miniHouse(cx + 0.1, fy + 0.5, -0.1, 0.9, { wall: '#c8b6ff', roof: '#ff9ec4', castle: true });
  cyl(0.6, 0.6, 0.02, 12, '#ffd0e2', cx - 0.5, fy + 0.03, 0.6);
  addWalker({ body: '#ff9ec4', hair: '#2e2430', style: 'bun', s: 0.95 }, fy, [
    [cx - 0.5, 0.65, 2.5], [cx + 0.95, 0.75, 2.0], [cx - 1.1, -0.35, 2.0],
  ]);
}

function teaRoom(cx, fy) {
  wallWindow(cx + 0.7, fy + 1.55, -D / 2 + 0.03, 1.0, 0.75, '#ffd98a');
  for (const tx of [-0.75, 0.75]) {
    const tz = tx < 0 ? -0.2 : 0.35;
    cyl(0.42, 0.42, 0.04, 12, CREAM, cx + tx, fy + 0.62, tz);
    cyl(0.05, 0.12, 0.6, 6, WOOD, cx + tx, fy + 0.3, tz);
    item('teacup', scene, cx + tx - 0.12, fy + 0.64, tz + 0.05, 1.4);
    item('teacup', scene, cx + tx + 0.14, fy + 0.64, tz - 0.05, 1.4);
    cyl(0.07, 0.09, 0.14, 8, '#ff9ec4', cx + tx, fy + 0.71, tz - 0.15);
    for (const side of [-1, 1]) {
      const sx = cx + tx + side * 0.62;
      box(0.38, 0.06, 0.38, '#ffd98a', sx, fy + 0.4, tz);
      box(0.06, 0.45, 0.38, '#ffd98a', sx + side * 0.16, fy + 0.62, tz);
      for (const dz of [-0.15, 0.15]) box(0.05, 0.38, 0.05, WOOD, sx, fy + 0.19, tz + dz);
    }
  }
  cyl(0.18, 0.14, 0.3, 8, '#e7a0a0', cx - 1.4, fy + 0.15, -0.95);
  ball(0.3, '#8fd19e', cx - 1.4, fy + 0.5, -0.95, scene, 0);
  // seated guests
  const g1 = bean({ body: '#ffb8a0', hair: '#f2c46b', style: 'pigtails', s: 0.85 }); g1.position.set(cx - 0.75 - 0.6, fy + 0.25, -0.2); g1.rotation.y = Math.PI / 2;
  const g2 = bean({ body: '#9fe0c8', hair: '#6b3e2e', style: 'bob', s: 0.9 }); g2.position.set(cx + 0.75 + 0.6, fy + 0.25, 0.35); g2.rotation.y = -Math.PI / 2;
  walkers.push({ obj: g1, idle: true, phase: 1 }, { obj: g2, idle: true, phase: 2.5 });
}

function addWalker(look, fy, path) {
  const obj = bean(look);
  obj.position.set(path[0][0], fy, path[0][1]);
  walkers.push({ obj, fy, path: path.map(([x, z, wait]) => ({ x, z, wait })), i: 0, wait: rand() * 2, phase: rand() * 6 });
}

// Street
box(40, 0.4, 30, '#a8dca0', 0, -0.6, -8);
box(40, 0.02, 1.8, '#f1e4d4', 0, -0.39, D / 2 + 1.05);
box(40, 0.02, 2.6, '#a9a9c4', 0, -0.39, D / 2 + 3.2);
for (let x = -18; x < 18; x += 1.6) box(0.7, 0.01, 0.12, CREAM, x, -0.37, D / 2 + 3.2);
tree(-BW / 2 - 1.5, -0.4, 1.2); tree(BW / 2 + 1.7, -0.7, 1.4); tree(-BW / 2 - 3.6, -1.6, 1.0); tree(BW / 2 + 3.8, -1.5, 1.1);
for (const x of [-BW / 2 - 0.6, BW / 2 + 0.6]) {
  ball(0.35, '#8fd19e', x, -0.25, D / 2 - 0.2, scene, 0);
  ball(0.12, '#ff9ec4', x + 0.1, 0.0, D / 2, scene, 0);
}
cyl(0.05, 0.06, 2.2, 6, DARK, BW / 2 + 0.9, 0.7, D / 2 + 0.4);
ball(0.16, bulbMat, BW / 2 + 0.9, 1.85, D / 2 + 0.4).castShadow = false;
{ const L = new THREE.PointLight('#ffcf8a', 0, 5, 1.5); L.position.set(BW / 2 + 0.9, 1.7, D / 2 + 0.6); scene.add(L); lamps.push(L); }
for (const [look, x0, dir] of [[{ body: '#a8d8ff', hair: '#2e2430', style: 'bun' }, -8, 1], [{ body: '#ffd98a', hair: '#c2563a', style: 'bob', s: 0.85 }, 6, -1]]) {
  const obj = bean(look);
  obj.position.set(x0, -0.39, D / 2 + 1.0 + dir * 0.25);
  walkers.push({ obj, street: dir, phase: rand() * 6 });
}

// ---------------------------------------------------------------------------
// Lighting (day / evening)
// ---------------------------------------------------------------------------
const hemi = new THREE.HemisphereLight("#fff4e6", "#d9b8e8", 0.8);
scene.add(hemi);
// Shadowless fill from the viewer's side so the cutaway interiors never go flat.
const fill = new THREE.DirectionalLight('#ffe9f2', 0.8);
fill.position.set(2, 3, 10);
scene.add(fill);
const sun = new THREE.DirectionalLight('#fff3df', 2.4);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
Object.assign(sun.shadow.camera, { left: -9, right: 9, top: 9, bottom: -4, near: 1, far: 40 });
sun.shadow.bias = -0.0004; sun.shadow.normalBias = 0.02;
sun.target.position.set(0, 2, 0);
scene.add(sun, sun.target);

const DAY = { sky: new THREE.Color('#bfe3f5'), hs: new THREE.Color('#fff4e6'), hg: new THREE.Color('#d9b8e8'), hi: 0.8, sc: new THREE.Color('#fff3df'), si: 2.2, sp: new THREE.Vector3(-4, 8, 11) };
const EVE = { sky: new THREE.Color('#f2a48f'), hs: new THREE.Color('#9b86d9'), hg: new THREE.Color('#f0a8a8'), hi: 0.55, sc: new THREE.Color('#ffa66b'), si: 1.1, sp: new THREE.Vector3(9, 3.5, 9) };
scene.background = DAY.sky.clone();
let eve = 0, eveTarget = 0;

function applyTimeOfDay() {
  scene.background.lerpColors(DAY.sky, EVE.sky, eve);
  hemi.color.lerpColors(DAY.hs, EVE.hs, eve);
  hemi.groundColor.lerpColors(DAY.hg, EVE.hg, eve);
  hemi.intensity = THREE.MathUtils.lerp(DAY.hi, EVE.hi, eve);
  sun.color.lerpColors(DAY.sc, EVE.sc, eve);
  sun.intensity = THREE.MathUtils.lerp(DAY.si, EVE.si, eve);
  sun.position.lerpVectors(DAY.sp, EVE.sp, eve);
  fill.intensity = THREE.MathUtils.lerp(0.8, 0.35, eve);
  lampShadeMat.emissiveIntensity = eve * 0.9;
  bulbMat.emissiveIntensity = eve * 1.6;
  glassMat.color.lerpColors(GLASS_DAY, GLASS_EVE, eve);
  for (const L of lamps) L.intensity = eve * 6;
}

// ---------------------------------------------------------------------------
// Camera styles
// ---------------------------------------------------------------------------
const STYLES = {
  diorama: {
    name: 'Diorama (orthographic)',
    desc: 'No perspective: everything looks flat and tidy, like a shadow box. Rooms line up perfectly as the shop grows, and zoomed out it reads like a dollhouse.',
    ortho: true, pitch: 9,
  },
  telephoto: {
    name: 'Telephoto (narrow perspective)',
    desc: 'A long lens from far away. A little depth so rooms feel 3D, while staying neat and easy to read. A middle ground.',
    fov: 18, pitch: 9,
  },
  closeup: {
    name: 'Close-up (wide perspective)',
    desc: 'A wider lens, closer in. The most depth and warmth, like peeking inside, but the edges stretch and room walls hide more when zoomed out.',
    fov: 48, pitch: 11,
  },
};
const persp = new THREE.PerspectiveCamera(30, 1, 0.1, 200);
const ortho = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 200);
let styleKey = 'diorama', angled = false, outlines = false;
let camera = ortho;

const roomView = (r) => ({ cx: roomX(r.c), cy: roomY(r.f) + H / 2, w: W + 0.6, h: H + 0.8, zoom: 1 });
const allView = () => ({ cx: 0, cy: (BH + 1.9) / 2, w: BW + 1.6, h: BH + 3, zoom: 1 });
const target = roomView(ROOMS[0]);
const view = { ...target };
let halfH = 1, aspect = 1;

const fitHalfH = (v) => Math.max(v.h / 2, v.w / 2 / aspect) / v.zoom;

function updateCamera(dt, t) {
  const k = 1 - Math.exp(-dt * 7);
  for (const key of ['cx', 'cy', 'w', 'h', 'zoom']) view[key] += (target[key] - view[key]) * k;
  halfH = fitHalfH(view);
  const st = STYLES[styleKey];
  const yaw = THREE.MathUtils.degToRad((angled ? 24 : 0) + Math.sin(t * 0.4) * 0.6);
  const pitch = THREE.MathUtils.degToRad(st.pitch + Math.sin(t * 0.31) * 0.3);
  const dir = new THREE.Vector3(Math.sin(yaw) * Math.cos(pitch), Math.sin(pitch), Math.cos(yaw) * Math.cos(pitch));
  const center = new THREE.Vector3(view.cx, view.cy, 0.3);
  if (st.ortho) {
    camera = ortho;
    Object.assign(ortho, { top: halfH, bottom: -halfH, left: -halfH * aspect, right: halfH * aspect });
    ortho.position.copy(center).addScaledVector(dir, 40);
  } else {
    camera = persp;
    persp.fov = st.fov; persp.aspect = aspect;
    const dist = halfH / Math.tan(THREE.MathUtils.degToRad(st.fov) / 2);
    persp.position.copy(center).addScaledVector(dir, dist);
    persp.near = Math.max(0.1, dist - 25); persp.far = dist + 40;
  }
  camera.lookAt(center);
  camera.updateProjectionMatrix();
}

// ---------------------------------------------------------------------------
// Input: drag to pan, pinch / wheel to zoom, tap a room to focus it
// ---------------------------------------------------------------------------
const pointers = new Map();
let pinch = null, moved = 0, downAt = 0;
const clampView = () => {
  target.cx = THREE.MathUtils.clamp(target.cx, -BW / 2 - 1, BW / 2 + 1);
  target.cy = THREE.MathUtils.clamp(target.cy, 0, BH + 2);
  target.zoom = THREE.MathUtils.clamp(target.zoom, 0.5, 3);
};
const pinchDist = () => { const [a, b] = [...pointers.values()]; return Math.hypot(a.x - b.x, a.y - b.y); };

canvas.addEventListener('pointerdown', (e) => {
  canvas.setPointerCapture(e.pointerId);
  pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
  if (pointers.size === 1) { moved = 0; downAt = performance.now(); }
  if (pointers.size === 2) pinch = { d: pinchDist(), zoom: target.zoom };
});
canvas.addEventListener('pointermove', (e) => {
  const p = pointers.get(e.pointerId);
  if (!p) return;
  const dx = e.clientX - p.x, dy = e.clientY - p.y;
  p.x = e.clientX; p.y = e.clientY;
  if (pointers.size === 1) {
    moved += Math.abs(dx) + Math.abs(dy);
    const s = (2 * halfH) / canvas.clientHeight;
    target.cx -= dx * s; target.cy += dy * s;
    clampView();
    view.cx = target.cx; view.cy = target.cy;
  } else if (pointers.size === 2 && pinch) {
    moved = 99;
    target.zoom = pinch.zoom * (pinchDist() / pinch.d);
    clampView();
  }
});
const endPointer = (e) => {
  if (pointers.size === 1 && moved < 8 && performance.now() - downAt < 400) tap(e);
  pointers.delete(e.pointerId);
  if (pointers.size < 2) pinch = null;
};
canvas.addEventListener('pointerup', endPointer);
canvas.addEventListener('pointercancel', (e) => { pointers.delete(e.pointerId); pinch = null; });
canvas.addEventListener('wheel', (e) => { e.preventDefault(); target.zoom *= Math.exp(-e.deltaY * 0.0015); clampView(); }, { passive: false });

const raycaster = new THREE.Raycaster();
function tap(e) {
  const r = canvas.getBoundingClientRect();
  const ndc = new THREE.Vector2(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
  raycaster.setFromCamera(ndc, camera);
  const hit = raycaster.intersectObjects(roomHits, false)[0];
  if (hit) Object.assign(target, roomView(hit.object.userData.room));
}

// ---------------------------------------------------------------------------
// UI
// ---------------------------------------------------------------------------
const styleButtons = [...document.querySelectorAll('#styles button')];
function setStyle(key) {
  styleKey = key;
  styleButtons.forEach((b) => b.classList.toggle('on', b.dataset.style === key));
  document.getElementById('style-name').textContent = STYLES[key].name;
  document.getElementById('style-desc').textContent = STYLES[key].desc;
}
styleButtons.forEach((b) => b.addEventListener('click', () => setStyle(b.dataset.style)));
const toggle = (id, fn) => {
  const b = document.getElementById(id);
  b.addEventListener('click', () => b.classList.toggle('on', fn()));
};
toggle('b-angle', () => (angled = !angled));
toggle('b-eve', () => (eveTarget = eveTarget ? 0 : 1) === 1);
toggle('b-outline', () => (outlines = !outlines));
document.getElementById('b-all').addEventListener('click', () => Object.assign(target, allView()));
setStyle('diorama');

function resize() {
  const w = app.clientWidth, h = app.clientHeight;
  renderer.setSize(w, h, false);
  aspect = w / h;
}
addEventListener('resize', resize);
resize();

// ---------------------------------------------------------------------------
// Loop
// ---------------------------------------------------------------------------
const clock = new THREE.Clock();
const fpsEl = document.getElementById('fps');
let frames = 0, fpsT = 0;

function updateWalkers(dt, t) {
  for (const w of walkers) {
    const inner = w.obj.userData.inner;
    let moving = false;
    if (w.street) {
      w.obj.position.x += w.street * dt * 0.9;
      if (w.obj.position.x > 14) w.obj.position.x = -14;
      if (w.obj.position.x < -14) w.obj.position.x = 14;
      w.obj.rotation.y = w.street * Math.PI / 2;
      moving = true;
    } else if (w.path) {
      if (w.wait > 0) { w.wait -= dt; } else {
        const p = w.path[w.i];
        const dx = p.x - w.obj.position.x, dz = p.z - w.obj.position.z, d = Math.hypot(dx, dz);
        if (d < 0.03) { w.wait = p.wait; w.i = (w.i + 1) % w.path.length; } else {
          const step = Math.min(d, dt * 0.8);
          w.obj.position.x += (dx / d) * step; w.obj.position.z += (dz / d) * step;
          const want = Math.atan2(dx, dz);
          let diff = want - w.obj.rotation.y; diff = Math.atan2(Math.sin(diff), Math.cos(diff));
          w.obj.rotation.y += diff * Math.min(1, dt * 10);
          moving = true;
        }
      }
    }
    const ph = t * 9 + w.phase;
    inner.position.y = moving ? Math.abs(Math.sin(ph)) * 0.05 : Math.sin(t * 2 + w.phase) * 0.01;
    inner.rotation.z = moving ? Math.sin(ph) * 0.08 : 0;
    inner.scale.y = moving ? 1 : 1 + Math.sin(t * 2 + w.phase) * 0.02;
  }
}

renderer.setAnimationLoop(() => {
  const dt = Math.min(clock.getDelta(), 0.05), t = clock.elapsedTime;
  eve += (eveTarget - eve) * (1 - Math.exp(-dt * 3));
  applyTimeOfDay();
  updateWalkers(dt, t);
  updateCamera(dt, t);
  (outlines ? outline : renderer).render(scene, camera);
  frames++; fpsT += dt;
  if (fpsT > 0.5) { fpsEl.textContent = `${Math.round(frames / fpsT)} fps`; frames = 0; fpsT = 0; }
});
