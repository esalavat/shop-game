// Toon materials: one shared 3-step gradient, one cached material per color.

import * as THREE from 'three';

export const PALETTE = {
  cream: '#fff6ee', wood: '#d7a877', ink: '#5a3a55',
  pink: '#ff9ec4', lilac: '#c8b6ff', mint: '#9fe0c8', butter: '#ffd98a', sky: '#a8d8ff', peach: '#ffb8a0',
  facade: '#f4b6c8', roof: '#b48bd6', brick: '#e7a0a0', foundation: '#e9cfb6',
  grass: '#a8dca0', leaf: '#8fd19e', leafLight: '#a6e0ad', trunk: '#a9744f',
  sidewalk: '#f1e4d4', road: '#a9a9c4',
};

export const gradientMap = (() => {
  const t = new THREE.DataTexture(new Uint8Array([70, 165, 255]), 3, 1, THREE.RedFormat);
  t.minFilter = t.magFilter = THREE.NearestFilter;
  t.needsUpdate = true;
  return t;
})();

const cache = new Map();

export function toon(color) {
  if (!cache.has(color)) cache.set(color, new THREE.MeshToonMaterial({ color, gradientMap }));
  return cache.get(color);
}

export function toonGlow(color, emissive, extra = {}) {
  return new THREE.MeshToonMaterial({ color, gradientMap, emissive, emissiveIntensity: 0, ...extra });
}
