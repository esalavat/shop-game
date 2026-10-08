// Miniature product models, built at the origin standing on y = 0, front facing +z.
// They're tiny (~0.15-0.2 units) and get scaled up where they're shown.

import * as THREE from 'three';
import { mesh, box, cyl, ball, prism } from './prims.js';
import { PALETTE as P } from '../toon.js';
import { ITEMS } from '../../data/items.js';

const BUILDERS = {
  teaset(g, c) {
    cyl(g, 0.11, 0.11, 0.012, 12, P.cream, 0, 0.006, 0);
    ball(g, 0.055, c, -0.03, 0.06, -0.01);
    cyl(g, 0.012, 0.016, 0.04, 6, c, 0.03, 0.08, -0.01).rotation.z = -0.9;
    ball(g, 0.015, P.cream, -0.03, 0.115, -0.01, 0);
    cyl(g, 0.03, 0.022, 0.035, 8, P.cream, 0.06, 0.03, 0.05);
  },
  chair(g, c) {
    box(g, 0.12, 0.03, 0.12, c, 0, 0.08, 0);
    box(g, 0.12, 0.13, 0.025, c, 0, 0.155, -0.05);
    ball(g, 0.03, P.cream, 0, 0.11, 0.0, 0).scale.set(1.6, 0.5, 1.6);
    for (const [dx, dz] of [[-0.045, -0.045], [0.045, -0.045], [-0.045, 0.045], [0.045, 0.045]]) {
      box(g, 0.018, 0.075, 0.018, P.wood, dx, 0.035, dz);
    }
  },
  lamp(g, c) {
    cyl(g, 0.025, 0.035, 0.11, 8, P.cream, 0, 0.055, 0);
    const cap = mesh(g, new THREE.SphereGeometry(0.075, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2), c, 0, 0.1, 0);
    cap.scale.y = 0.8;
    for (const [x, y, z] of [[0.03, 0.15, 0.04], [-0.04, 0.14, 0.03], [0, 0.16, -0.04]]) ball(g, 0.013, P.cream, x, y, z, 0);
  },
  bed(g, c) {
    box(g, 0.24, 0.05, 0.15, P.wood, 0, 0.025, 0);
    box(g, 0.2, 0.03, 0.14, c, 0.02, 0.065, 0);
    box(g, 0.05, 0.03, 0.1, P.cream, -0.085, 0.07, 0);
    box(g, 0.02, 0.13, 0.15, P.wood, -0.12, 0.065, 0);
    ball(g, 0.02, P.pink, -0.12, 0.14, 0, 0);
  },
  doll(g, c) {
    mesh(g, new THREE.ConeGeometry(0.06, 0.13, 8), c, 0, 0.065, 0);
    ball(g, 0.045, '#ffd9c2', 0, 0.16, 0);
    mesh(g, new THREE.SphereGeometry(0.05, 8, 4, 0, Math.PI * 2, 0, Math.PI * 0.55), '#6b3e2e', 0, 0.165, -0.006);
    ball(g, 0.018, P.pink, 0.035, 0.2, -0.01, 0);
  },
  cottage(g, c) {
    box(g, 0.18, 0.14, 0.13, c, 0, 0.07, 0);
    prism(g, 0.22, 0.1, 0.15, P.roof).position.y = 0.14;
    box(g, 0.04, 0.06, 0.01, P.cream, 0, 0.03, 0.066);
    box(g, 0.035, 0.035, 0.01, P.sky, -0.05, 0.09, 0.066);
    box(g, 0.035, 0.035, 0.01, P.sky, 0.05, 0.09, 0.066);
  },
};

export function buildItem(itemId) {
  const item = ITEMS[itemId];
  const g = new THREE.Group();
  BUILDERS[item.model](g, item.color);
  g.traverse((o) => { o.castShadow = false; }); // tiny props: skip shadow casting for speed
  return g;
}

/** A cardboard delivery box with a sticker in the item's color. Origin at its bottom center. */
export function buildBox(itemId, size) {
  const g = new THREE.Group();
  box(g, size, size, size, '#d9b27c', 0, size / 2, 0);
  box(g, size + 0.01, 0.05, size * 0.3, '#f3e2c0', 0, size, 0);
  box(g, size * 0.45, size * 0.3, 0.01, ITEMS[itemId].color, 0, size * 0.5, size / 2 + 0.006);
  ball(g, size * 0.08, P.cream, 0, size * 0.5, size / 2 + 0.012, 0).scale.z = 0.3;
  return g;
}
