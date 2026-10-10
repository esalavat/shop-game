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

/** Patterned wallpaper (dots, gingham, stars, hearts, candy, paws) for a wall w x h; tiles are `size` across. */
export function wallMaterial(paper, pattern, w, h, size = 0.42) {
  const draw = WALL_PATTERNS[pattern.id];
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
    else if (WALL_PATTERNS[opt.id]) { // two tiles across
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
