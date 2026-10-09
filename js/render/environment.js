// The street around the shop: grass, sidewalk, road, trees, bushes, and a street lamp.

import * as THREE from 'three';
import { box, cyl, ball } from './models/prims.js';
import { PALETTE as P } from './toon.js';
import { ROOM } from './building.js';

const GROUND_Y = -0.4;

export function createEnvironment(layout, lighting) {
  const group = new THREE.Group();
  const front = ROOM.D / 2;
  const half = layout.width / 2;

  box(group, 80, 0.4, 120, P.grass, 0, GROUND_Y - 0.2, 0);
  // The sidewalk sits a little higher than the road and they don't overlap, so their edge never
  // flickers (z-fighting, worst on phones).
  box(group, 80, 0.02, 1.8, P.sidewalk, 0, GROUND_Y + 0.01, front + 1.05);
  box(group, 80, 0.02, 2.55, P.road, 0, GROUND_Y - 0.005, front + 3.225);
  for (let x = -28; x < 28; x += 1.6) box(group, 0.7, 0.01, 0.12, P.cream, x, GROUND_Y + 0.03, front + 3.2);

  tree(group, -half - 1.5, -0.4, 1.2);
  tree(group, half + 1.7, -0.7, 1.4);
  tree(group, -half - 3.6, -1.6, 1.0);
  tree(group, half + 3.8, -1.5, 1.1);
  for (const x of [-half - 0.6, half + 0.6]) {
    ball(group, 0.35, P.leaf, x, GROUND_Y + 0.15, front - 0.2, 0);
    ball(group, 0.12, P.pink, x + 0.1, GROUND_Y + 0.4, front, 0);
  }
  lighting.addStreetLamp(group, half + 0.9, GROUND_Y, front + 0.4);
  return group;
}

function tree(group, x, z, s) {
  cyl(group, 0.1 * s, 0.14 * s, 0.9 * s, 6, P.trunk, x, GROUND_Y + 0.45 * s, z);
  ball(group, 0.6 * s, P.leaf, x, GROUND_Y + 1.2 * s, z, 0);
  ball(group, 0.45 * s, P.leafLight, x + 0.25 * s, GROUND_Y + 1.55 * s, z + 0.1, 0);
}
