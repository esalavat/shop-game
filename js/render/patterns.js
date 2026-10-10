// Wallpaper and floor textures for room styles (GDD #68), drawn on canvases and cached. Each
// texture is one repeating tile; materials are toon-shaded white so the tile's own colours show.
// Cached textures are marked userData.keep so rebuilding the building doesn't dispose them.

import * as THREE from 'three';
import { gradientMap } from './toon.js';

const TILE = 128; // pixels per tile
const materials = new Map();

function tileTexture(draw, repeatX, repeatY) {
  const c = document.createElement('canvas');
  c.width = c.height = TILE;
  draw(c.getContext('2d'), TILE);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(repeatX, repeatY);
  t.anisotropy = 4;
  t.userData.keep = true;
  return t;
}

function cached(key, make) {
  if (!materials.has(key)) {
    const m = new THREE.MeshToonMaterial({ color: '#ffffff', gradientMap, map: make() });
    m.userData.keep = true;
    materials.set(key, m);
  }
  return materials.get(key);
}

/** A colour a little darker (for plank seams and grout). */
function shade(hex, by) {
  const c = new THREE.Color(hex);
  c.multiplyScalar(1 - by);
  return `#${c.getHexString()}`;
}

function heart(g, x, y, r) {
  g.beginPath();
  g.moveTo(x, y + r * 0.9);
  g.bezierCurveTo(x - r * 1.6, y - r * 0.2, x - r * 0.6, y - r * 1.3, x, y - r * 0.45);
  g.bezierCurveTo(x + r * 0.6, y - r * 1.3, x + r * 1.6, y - r * 0.2, x, y + r * 0.9);
  g.fill();
}

function star(g, x, y, r) {
  g.beginPath();
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / 5, rr = i % 2 ? r * 0.45 : r;
    g.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr);
  }
  g.closePath();
  g.fill();
}

/** A wrapped sweet: a round middle with a twist of wrapper either side. */
function candy(g, x, y, r) {
  g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill();
  for (const side of [-1, 1]) {
    g.beginPath();
    g.moveTo(x + side * r * 0.8, y);
    g.lineTo(x + side * r * 2, y - r * 0.75);
    g.lineTo(x + side * r * 2, y + r * 0.75);
    g.closePath();
    g.fill();
  }
}

/** A paw print: a big pad and four toes. */
function paw(g, x, y, r) {
  g.beginPath(); g.ellipse(x, y + r * 0.35, r * 0.62, r * 0.5, 0, 0, Math.PI * 2); g.fill();
  for (const [dx, dy] of [[-0.62, -0.25], [-0.22, -0.62], [0.22, -0.62], [0.62, -0.25]]) {
    g.beginPath(); g.arc(x + dx * r, y + dy * r, r * 0.22, 0, Math.PI * 2); g.fill();
  }
}

// ---------------------------------------------------------------------------------------------------
// Collection prize wallpapers (GDD #87): a picture per theme, in its round's colours (PRIZE_PALETTES):
// pastels, Bright neons, Dazzle jewels with gold outlines. The background is the room's wallpaper colour.
// P = { c: [five motif colours], ink: eyes and lines, edge: outline or null }
// ---------------------------------------------------------------------------------------------------

const PRIZE_PALETTES = [
  { c: ['#ffa8c8', '#9fd0ff', '#a9e6c8', '#ffd98a', '#c8b0ff'], ink: '#7a4a6a', edge: null },
  { c: ['#ff3d8b', '#2f8cff', '#7fd321', '#ffc21f', '#ff8a2b'], ink: '#3b2a5a', edge: null },
  { c: ['#d81b60', '#2546b8', '#14a06a', '#7b3fc4', '#c2185b'], ink: '#3b1f3a', edge: '#e8b923' },
];

const circle = (g, x, y, r) => { g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill(); };
/** Fill the current path, with a gold outline in Dazzle colours. */
function paint(g, fill, P, w = 2) {
  g.fillStyle = fill;
  g.fill();
  if (P.edge) { g.strokeStyle = P.edge; g.lineWidth = w; g.stroke(); }
}

const PRIZES = {
  teacup(g, x, y, r, P) { // a cup on a saucer with a heart on it
    g.beginPath(); g.ellipse(x, y + r * 0.6, r * 1.15, r * 0.24, 0, 0, Math.PI * 2); paint(g, P.c[1], P);
    g.strokeStyle = P.c[0]; g.lineWidth = r * 0.2;
    g.beginPath(); g.arc(x + r * 0.82, y + r * 0.05, r * 0.3, -Math.PI / 2, Math.PI / 2); g.stroke();
    g.beginPath();
    g.moveTo(x - r * 0.85, y - r * 0.35); g.lineTo(x + r * 0.85, y - r * 0.35);
    g.quadraticCurveTo(x + r * 0.8, y + r * 0.6, x, y + r * 0.6);
    g.quadraticCurveTo(x - r * 0.8, y + r * 0.6, x - r * 0.85, y - r * 0.35);
    paint(g, P.c[0], P);
    g.fillStyle = P.c[3]; heart(g, x, y + r * 0.08, r * 0.24);
  },
  frame(g, x, y, r, P) { // a picture frame with hills and a sun
    g.beginPath(); g.rect(x - r, y - r * 0.8, r * 2, r * 1.6); paint(g, P.c[3], P);
    g.fillStyle = P.c[1]; g.fillRect(x - r * 0.72, y - r * 0.52, r * 1.44, r * 1.04);
    g.fillStyle = P.c[2]; g.beginPath(); g.ellipse(x - r * 0.2, y + r * 0.52, r * 0.7, r * 0.45, 0, Math.PI, 0); g.fill();
    g.fillStyle = P.c[0]; circle(g, x + r * 0.35, y - r * 0.2, r * 0.18);
  },
  armchair(g, x, y, r, P) {
    g.beginPath(); g.roundRect(x - r * 0.75, y - r * 0.85, r * 1.5, r * 1.1, r * 0.35); paint(g, P.c[4], P);
    g.beginPath(); g.roundRect(x - r, y - r * 0.15, r * 0.45, r * 0.9, r * 0.2); paint(g, P.c[0], P);
    g.beginPath(); g.roundRect(x + r * 0.55, y - r * 0.15, r * 0.45, r * 0.9, r * 0.2); paint(g, P.c[0], P);
    g.beginPath(); g.roundRect(x - r * 0.6, y + r * 0.1, r * 1.2, r * 0.45, r * 0.15); paint(g, P.c[0], P);
  },
  mushroom(g, x, y, r, P) { // a spotted toadstool
    g.beginPath(); g.roundRect(x - r * 0.3, y - r * 0.1, r * 0.6, r * 0.95, r * 0.2); paint(g, '#fff6e8', P);
    g.beginPath(); g.ellipse(x, y - r * 0.1, r, r * 0.75, 0, Math.PI, 0); g.closePath(); paint(g, P.c[0], P);
    g.fillStyle = '#ffffff';
    for (const [dx, dy, k] of [[-0.5, -0.35, 0.15], [0.05, -0.6, 0.13], [0.5, -0.3, 0.15]]) circle(g, x + dx * r, y + dy * r, k * r);
  },
  wing(g, x, y, r, P) { // a little fairy (wings and a sparkle)
    g.globalAlpha = 0.85;
    for (const side of [-1, 1]) {
      g.beginPath(); g.ellipse(x + side * r * 0.45, y - r * 0.25, r * 0.5, r * 0.32, side * 0.6, 0, Math.PI * 2); paint(g, P.c[1], P, 1.5);
      g.beginPath(); g.ellipse(x + side * r * 0.35, y + r * 0.3, r * 0.32, r * 0.22, -side * 0.5, 0, Math.PI * 2); paint(g, P.c[4], P, 1.5);
    }
    g.globalAlpha = 1;
    g.fillStyle = P.c[3]; star(g, x, y, r * 0.3);
  },
  moon(g, x, y, r, P) { // a sleepy crescent moon on a cloud
    g.save();
    g.beginPath(); g.arc(x, y - r * 0.2, r * 0.75, 0, Math.PI * 2); g.arc(x + r * 0.38, y - r * 0.38, r * 0.62, 0, Math.PI * 2, true);
    paint(g, P.c[3], P);
    g.restore();
    g.fillStyle = P.c[1];
    for (const [dx, k] of [[-0.55, 0.32], [0, 0.42], [0.55, 0.32]]) circle(g, x + dx * r, y + r * 0.55, k * r);
    if (P.edge) { g.strokeStyle = P.edge; g.lineWidth = 1.5; g.beginPath(); g.moveTo(x - r * 0.85, y + r * 0.85); g.lineTo(x + r * 0.85, y + r * 0.85); g.stroke(); }
  },
  teddy(g, x, y, r, P) { // a teddy face with a bow
    const fur = P.edge ? P.c[4] : '#d9a67a';
    for (const side of [-1, 1]) { g.beginPath(); g.arc(x + side * r * 0.62, y - r * 0.6, r * 0.32, 0, Math.PI * 2); paint(g, fur, P); }
    g.beginPath(); g.arc(x, y, r * 0.8, 0, Math.PI * 2); paint(g, fur, P);
    g.fillStyle = '#fff1e0'; circle(g, x, y + r * 0.28, r * 0.34);
    g.fillStyle = P.ink;
    circle(g, x - r * 0.3, y - r * 0.12, r * 0.09); circle(g, x + r * 0.3, y - r * 0.12, r * 0.09); circle(g, x, y + r * 0.18, r * 0.1);
    g.fillStyle = P.c[0];
    for (const side of [-1, 1]) { g.beginPath(); g.moveTo(x, y + r * 0.82); g.lineTo(x + side * r * 0.4, y + r * 0.62); g.lineTo(x + side * r * 0.4, y + r * 1.02); g.closePath(); g.fill(); }
    circle(g, x, y + r * 0.82, r * 0.1);
  },
  house(g, x, y, r, P, i = 0) { // a tiny house: walls, roof, door and window
    g.beginPath(); g.rect(x - r * 0.7, y - r * 0.2, r * 1.4, r); paint(g, P.c[(i + 3) % 5], P);
    g.beginPath(); g.moveTo(x - r * 0.95, y - r * 0.15); g.lineTo(x, y - r); g.lineTo(x + r * 0.95, y - r * 0.15); g.closePath(); paint(g, P.c[i % 5], P);
    g.fillStyle = P.c[(i + 1) % 5]; g.fillRect(x - r * 0.15, y + r * 0.3, r * 0.32, r * 0.5);
    g.fillStyle = '#ffffff'; g.fillRect(x + r * 0.3, y + r * 0.02, r * 0.26, r * 0.26);
  },
  lollipop(g, x, y, r, P) { // a swirly lollipop
    g.strokeStyle = P.edge ?? '#f3e6d6'; g.lineWidth = r * 0.14;
    g.beginPath(); g.moveTo(x, y + r * 0.2); g.lineTo(x, y + r * 1.1); g.stroke();
    g.beginPath(); g.arc(x, y - r * 0.2, r * 0.7, 0, Math.PI * 2); paint(g, P.c[0], P);
    g.strokeStyle = '#ffffff'; g.lineWidth = r * 0.12; g.beginPath();
    for (let t = 0; t < Math.PI * 4; t += 0.2) g.lineTo(x + Math.cos(t) * t * r * 0.05, y - r * 0.2 + Math.sin(t) * t * r * 0.05);
    g.stroke();
  },
  cat(g, x, y, r, P) { // a cat face with whiskers
    const fur = P.c[3];
    g.beginPath();
    g.moveTo(x - r * 0.78, y - r * 0.15); g.lineTo(x - r * 0.7, y - r * 0.95); g.lineTo(x - r * 0.25, y - r * 0.62);
    g.lineTo(x + r * 0.25, y - r * 0.62); g.lineTo(x + r * 0.7, y - r * 0.95); g.lineTo(x + r * 0.78, y - r * 0.15);
    g.arc(x, y, r * 0.8, -0.2, Math.PI + 0.2);
    g.closePath(); paint(g, fur, P);
    g.fillStyle = P.c[0];
    for (const side of [-1, 1]) { g.beginPath(); g.moveTo(x + side * r * 0.62, y - r * 0.5); g.lineTo(x + side * r * 0.6, y - r * 0.8); g.lineTo(x + side * r * 0.38, y - r * 0.6); g.closePath(); g.fill(); }
    g.fillStyle = P.ink;
    for (const side of [-1, 1]) { g.beginPath(); g.ellipse(x + side * r * 0.32, y - r * 0.1, r * 0.09, r * 0.14, 0, 0, Math.PI * 2); g.fill(); }
    g.fillStyle = P.c[0]; g.beginPath(); g.moveTo(x - r * 0.1, y + r * 0.12); g.lineTo(x + r * 0.1, y + r * 0.12); g.lineTo(x, y + r * 0.24); g.closePath(); g.fill();
    g.strokeStyle = P.ink; g.lineWidth = 1.5;
    for (const side of [-1, 1]) for (const dy of [0.2, 0.34]) { g.beginPath(); g.moveTo(x + side * r * 0.3, y + r * dy); g.lineTo(x + side * r * 1.05, y + r * (dy * 1.6 - 0.12)); g.stroke(); }
  },
};

/** Each theme's prize: a big motif and a small one per tile (GDD #87). A = the big one's spot and size, B = the small one's. */
const A = [0.3, 0.32, 0.21], B = [0.75, 0.76, 0.14];
const at = ([x, y, r], s) => [x * s, y * s, r * s];
const PRIZE_TILES = {
  teacups: (g, s, P) => { PRIZES.teacup(g, ...at(A, s), P); g.fillStyle = P.c[4]; heart(g, ...at([B[0], B[1], 0.09], s)); },
  frames: (g, s, P) => { PRIZES.frame(g, ...at([A[0], A[1], 0.19], s), P); PRIZES.armchair(g, ...at(B, s), P); },
  mushrooms: (g, s, P) => { PRIZES.mushroom(g, ...at(A, s), P); PRIZES.wing(g, ...at(B, s), P); },
  moons: (g, s, P) => { PRIZES.moon(g, ...at(A, s), P); g.fillStyle = P.c[3]; star(g, ...at([B[0], B[1], 0.1], s)); star(g, ...at([0.56, 0.9, 0.05], s)); },
  teddies: (g, s, P) => { PRIZES.teddy(g, ...at([A[0], A[1] - 0.02, 0.19], s), P); g.fillStyle = P.c[0]; heart(g, ...at([B[0], B[1], 0.09], s)); },
  houses: (g, s, P) => { PRIZES.house(g, ...at(A, s), P, 0); PRIZES.house(g, ...at(B, s), P, 2); },
  lollipops: (g, s, P) => { PRIZES.lollipop(g, ...at([A[0], A[1] - 0.06, 0.2], s), P); g.fillStyle = P.c[1]; candy(g, ...at([B[0], B[1], 0.065], s)); },
  cats: (g, s, P) => { PRIZES.cat(g, ...at(A, s), P); g.fillStyle = P.c[0]; paw(g, ...at([B[0], B[1], 0.12], s)); },
};

const WALL_PATTERNS = {
  dots(g, s, ink) {
    g.fillStyle = ink;
    for (const [x, y] of [[0.25, 0.25], [0.75, 0.75]]) { g.beginPath(); g.arc(x * s, y * s, s * 0.09, 0, Math.PI * 2); g.fill(); }
  },
  gingham(g, s, ink) {
    g.fillStyle = ink;
    g.globalAlpha = 0.75;
    g.fillRect(0, 0, s / 2, s);
    g.fillRect(0, 0, s, s / 2);
    g.globalAlpha = 1;
    g.fillRect(0, 0, s / 2, s / 2);
  },
  stars(g, s, ink) {
    g.fillStyle = ink;
    star(g, s * 0.27, s * 0.3, s * 0.14);
    star(g, s * 0.77, s * 0.78, s * 0.1);
  },
  hearts(g, s, ink) {
    g.fillStyle = ink;
    heart(g, s * 0.27, s * 0.3, s * 0.12);
    heart(g, s * 0.77, s * 0.8, s * 0.1);
  },
  // Sweet Shop and Pet Corner rewards (GDD #79)
  candy(g, s, ink) {
    g.fillStyle = ink;
    candy(g, s * 0.27, s * 0.3, s * 0.075);
    candy(g, s * 0.75, s * 0.78, s * 0.065);
  },
  paws(g, s, ink) {
    g.fillStyle = ink;
    paw(g, s * 0.27, s * 0.3, s * 0.12);
    paw(g, s * 0.75, s * 0.78, s * 0.1);
  },
};

/** Draws one tile of a pattern option: a prize picture in its round's colours, or a one-colour print. */
function patternDrawer(pattern) {
  if (pattern.prize) return (g, s) => PRIZE_TILES[pattern.prize](g, s, PRIZE_PALETTES[pattern.round ?? 0]);
  return (g, s, ink) => WALL_PATTERNS[pattern.id](g, s, ink);
}

/** Patterned wallpaper (dots, gingham, stars, hearts, candy, paws, prize pictures) for a wall w x h; tiles are `size` across. */
export function wallMaterial(paper, pattern, w, h, size = pattern.prize ? 0.6 : 0.42) {
  const draw = patternDrawer(pattern);
  // Motifs a touch stronger than the stripe colour so they read on a phone.
  const ink = pattern.id === 'gingham' ? paper.stripe : shade(paper.stripe, 0.06);
  return cached(`wall|${pattern.id}|${paper.id}|${w}|${h}`, () => tileTexture((g, s) => {
    g.fillStyle = paper.paper;
    g.fillRect(0, 0, s, s);
    draw(g, s, ink);
  }, w / size, h / size));
}

const FLOOR_STYLES = {
  planks(g, s, f) { // three planks per tile, seams staggered
    g.fillStyle = f.color;
    g.fillRect(0, 0, s, s);
    g.fillStyle = shade(f.color, 0.1);
    for (let i = 0; i < 3; i++) {
      const y = (i * s) / 3;
      g.fillRect(0, y, s, 2);
      g.fillRect(((i * 0.37 + 0.2) % 1) * s, y, 2, s / 3);
    }
  },
  checker(g, s, f) {
    g.fillStyle = f.color2;
    g.fillRect(0, 0, s, s);
    g.fillStyle = f.color;
    g.fillRect(0, 0, s / 2, s / 2);
    g.fillRect(s / 2, s / 2, s / 2, s / 2);
  },
  tiles(g, s, f) {
    g.fillStyle = f.color2;
    g.fillRect(0, 0, s, s);
    g.fillStyle = f.color;
    for (const [x, y] of [[0, 0], [1, 0], [0, 1], [1, 1]]) g.fillRect(x * s / 2 + 3, y * s / 2 + 3, s / 2 - 6, s / 2 - 6);
  },
  carpet(g, s, f) { // soft speckle
    g.fillStyle = f.color;
    g.fillRect(0, 0, s, s);
    g.fillStyle = shade(f.color, 0.05);
    for (let i = 0; i < 40; i++) g.fillRect((i * 37) % s, (i * 71) % s, 3, 3);
  },
};

/** A floor's material for a floor piece w x d (tiles are about 0.8 across). */
export function floorMaterial(floor, w, d, size = 0.8) {
  return cached(`floor|${floor.id}|${w.toFixed(2)}|${d.toFixed(2)}`, () => tileTexture((g, s) => FLOOR_STYLES[floor.style](g, s, floor), w / size, d / size));
}

/** A small picture of a style for the decorate panel's buttons (a data URL), or null for emoji ones. */
export function swatchURL(kind, opt, paper) {
  const key = `${kind}|${opt.id}|${paper?.id ?? ''}`;
  if (swatches.has(key)) return swatches.get(key);
  const c = document.createElement('canvas');
  const s = (c.width = c.height = 96);
  const g = c.getContext('2d');
  if (kind === 'pattern') {
    g.fillStyle = paper.paper;
    g.fillRect(0, 0, s, s);
    const ink = shade(paper.stripe, 0.1);
    if (opt.id === 'stripes') { g.fillStyle = ink; for (let x = 8; x < s; x += 32) g.fillRect(x, 0, 12, s); }
    else if (opt.prize) { // one tile, big enough to see the picture
      patternDrawer(opt)(g, s);
    } else if (WALL_PATTERNS[opt.id]) { // two tiles across
      for (const [x, y] of [[0, 0], [1, 0], [0, 1], [1, 1]]) { g.save(); g.translate(x * s / 2, y * s / 2); WALL_PATTERNS[opt.id](g, s / 2, opt.id === 'gingham' ? shade(paper.stripe, 0.04) : ink); g.restore(); }
    }
  } else if (kind === 'floor') {
    for (const [x, y] of [[0, 0], [1, 0], [0, 1], [1, 1]]) { g.save(); g.translate(x * s / 2, y * s / 2); g.scale(0.5, 0.5); FLOOR_STYLES[opt.style](g, s, opt); g.restore(); }
  } else if (kind === 'rug') {
    g.translate(s / 2, s / 2);
    const r = s * 0.42;
    const ring = (fill, k) => { g.fillStyle = fill; g.beginPath(); g.arc(0, 0, r * k, 0, Math.PI * 2); g.fill(); };
    if (opt.shape === 'none') {
      g.strokeStyle = 'rgba(90,58,85,0.35)'; g.lineWidth = 6; g.beginPath(); g.arc(0, 0, r * 0.7, 0, Math.PI * 2); g.moveTo(-r * 0.5, r * 0.5); g.lineTo(r * 0.5, -r * 0.5); g.stroke();
    } else if (opt.shape === 'round') { ring(opt.color, 1); ring(opt.color2, 0.7); }
    else if (opt.shape === 'rect') { g.fillStyle = opt.color2; g.fillRect(-r, -r * 0.66, 2 * r, 1.33 * r); g.fillStyle = opt.color; for (let i = 0; i < 4; i++) g.fillRect(-r + r * 0.12 + i * r * 0.5, -r * 0.66, r * 0.26, 1.33 * r); }
    else if (opt.shape === 'heart') { g.fillStyle = opt.color; heart(g, 0, 0, r * 0.75); g.fillStyle = opt.color2; heart(g, 0, 0, r * 0.5); }
    else if (opt.shape === 'star') { g.fillStyle = opt.color; star(g, 0, 0, r * 1.05); g.fillStyle = opt.color2; star(g, 0, 0, r * 0.65); }
    else if (opt.shape === 'flower') {
      g.fillStyle = opt.color;
      for (let i = 0; i < 6; i++) { const t = (i / 6) * Math.PI * 2; g.beginPath(); g.arc(Math.cos(t) * r * 0.55, Math.sin(t) * r * 0.55, r * 0.42, 0, Math.PI * 2); g.fill(); }
      ring(opt.color2, 0.45);
    }
  } else {
    return null;
  }
  const url = c.toDataURL();
  swatches.set(key, url);
  return url;
}
const swatches = new Map();
