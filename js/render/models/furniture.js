// Fixture models. Each is built at the origin, standing on y = 0, with its front facing +z.

import * as THREE from 'three';
import { box, cyl, ball, prism } from './prims.js';
import { PALETTE as P } from '../toon.js';
import { FIXTURES } from '../../data/fixtures.js';
import { STAIRS, FLOOR_H } from '../../sim/route.js';

/** Heights of the shelf boards that items will sit on (used when stocking). */
export const SHELF_LEVELS = [0.06, 0.58, 1.1];

const BUILDERS = {
  shelf(g) {
    const { w, h } = FIXTURES.shelf.size;
    const hh = h - 0.05;
    box(g, 0.06, hh, 0.42, P.cream, -w / 2, hh / 2, 0);
    box(g, 0.06, hh, 0.42, P.cream, w / 2, hh / 2, 0);
    box(g, w, hh, 0.03, '#f9e6ee', 0, hh / 2, -0.2);
    for (const y of SHELF_LEVELS) box(g, w, 0.05, 0.42, P.cream, 0, y, 0);
    box(g, w + 0.08, 0.06, 0.46, P.cream, 0, hh, 0);
    box(g, w * 0.5, 0.12, 0.02, P.pink, 0, hh - 0.1, 0.2); // little sign strip
  },

  counter(g) {
    // Kept low so the shopkeeper's head and shoulders show above it.
    const { w, d } = FIXTURES.counter.size;
    const top = 0.48;
    box(g, w, top - 0.03, d, P.wood, 0, (top - 0.03) / 2, 0);
    box(g, w - 0.12, 0.28, 0.02, '#e4b98e', 0, 0.23, d / 2 + 0.005);
    box(g, w + 0.1, 0.06, d + 0.08, P.cream, 0, top, 0);
    // register
    box(g, 0.26, 0.2, 0.25, P.pink, 0.33, top + 0.13, -0.02);
    const screen = box(g, 0.2, 0.12, 0.03, P.sky, 0.33, top + 0.27, -0.12);
    screen.rotation.x = -0.3;
    box(g, 0.18, 0.03, 0.12, P.cream, 0.33, top + 0.24, 0.08);
    // little bell
    cyl(g, 0.05, 0.07, 0.06, 8, P.butter, -0.32, top + 0.06, 0.08);
  },

  pedestal(g) {
    cyl(g, 0.42, 0.46, 0.4, 10, P.cream, 0, 0.2, 0);
    cyl(g, 0.46, 0.46, 0.04, 10, P.pink, 0, 0.42, 0);
    const house = dreamDollhouse();
    house.position.y = DOLLHOUSE.y;
    house.scale.setScalar(DOLLHOUSE.scale);
    g.add(house);
  },

  plant(g) {
    cyl(g, 0.18, 0.14, 0.3, 8, P.brick, 0, 0.15, 0);
    ball(g, 0.3, P.leaf, 0, 0.5, 0, 0);
    ball(g, 0.2, P.leafLight, 0.12, 0.72, 0.05, 0);
    ball(g, 0.06, P.pink, -0.18, 0.62, 0.18, 0);
  },

  // The Stairwell's spiral staircase (GDD #58): wedge steps once around a pole, rising a floor. Built
  // around the pole; people walk up it at STAIRS.radius (sim/route.js), starting toward +x and turning
  // the same way as Object3D.rotation.y.
  stairs(g) {
    const n = STAIRS.steps;
    cyl(g, 0.06, 0.06, FLOOR_H + 0.8, 8, P.cream, 0, (FLOOR_H + 0.8) / 2, 0);
    for (let i = 0; i < n; i++) {
      const step = new THREE.Group();
      step.rotation.y = ((i + 0.5) / n) * Math.PI * 2;
      const top = ((i + 0.5) / n) * FLOOR_H;
      box(step, 0.56, 0.07, 0.26, i % 2 ? P.wood : '#e4b98e', 0.34, top - 0.035, 0);
      cyl(step, 0.02, 0.02, 0.7, 5, P.cream, 0.6, top + 0.35, 0);
      g.add(step);
    }
  },

  // The top of the stairs upstairs: a railing around the hole, open where the stairs come up.
  stairhole(g) {
    const half = FIXTURES.stairhole.size.w / 2, h = 0.7, gap = 0.3;
    const rail = (x, z, w, d) => {
      box(g, w, 0.05, d, P.cream, x, h, z);
      box(g, 0.05, h, 0.05, P.cream, x + (w > d ? w / 2 : 0), h / 2, z + (d > w ? d / 2 : 0));
      box(g, 0.05, h, 0.05, P.cream, x - (w > d ? w / 2 : 0), h / 2, z - (d > w ? d / 2 : 0));
    };
    rail(0, half, 2 * half, 0.05);                         // along the front
    rail(half, (half + gap) / 2, 0.05, half - gap);        // the right side, front of the gap...
    rail(half, -(half + gap) / 2, 0.05, half - gap);       // ...and behind it
  },

  rug(g) {
    const outer = cyl(g, 0.7, 0.7, 0.02, 14, P.lilac, 0, 0.02, 0);
    const inner = cyl(g, 0.5, 0.5, 0.022, 14, '#ddd1ff', 0, 0.022, 0);
    outer.castShadow = inner.castShadow = false;
  },
};

export function buildFixture(kind) {
  const g = new THREE.Group();
  BUILDERS[kind](g);
  return g;
}

/**
 * The Dream Dollhouse on its pedestal: an open-front house, two rooms per storey. Its furniture is
 * whatever the player places (render/views/dollhouse.js). Sizes are in the house's own units; it sits
 * `y` above the pedestal base, scaled by `scale`.
 */
export const DOLLHOUSE = { w: 0.9, h: 0.9, d: 0.5, t: 0.04, y: 0.44, scale: 0.85 };

/** Floor-center of a room inside the house (house units), by [column, storey]. */
export function dollhouseCell([col, storey]) {
  const { w, h, t } = DOLLHOUSE;
  return { x: (col - 0.5) * (w / 2), y: storey * (h / 2) + t / 2, z: 0.02 };
}

export function dreamDollhouse() {
  const g = new THREE.Group();
  const { w, h, d, t } = DOLLHOUSE;
  box(g, w, h, t, '#fff0f6', 0, h / 2, -d / 2);
  // A different wallpaper in each room.
  const papers = [[P.mint, -1, 0], ['#fff3c9', 1, 0], [P.lilac, -1, 1], ['#ffe1ec', 1, 1]];
  for (const [c, sx, storey] of papers) box(g, w / 2 - t, h / 2 - t, 0.01, c, sx * w / 4, h / 4 + storey * h / 2, -d / 2 + t / 2 + 0.005);
  box(g, t, h, d, P.pink, -w / 2, h / 2, 0);
  box(g, t, h, d, P.pink, w / 2, h / 2, 0);
  box(g, t, h, d, P.pink, 0, h / 2, 0);
  for (const y of [0, h / 2, h]) box(g, w + t, t, d + 0.02, P.cream, 0, y, 0);
  prism(g, w + 0.18, 0.42, d + 0.12, P.roof).position.y = h + t / 2;
  box(g, 0.1, 0.22, 0.1, P.brick, 0.25, h + 0.3, -0.05);
  return g;
}

/** An invisible box covering a fixture, so taps land on it reliably. */
export function fixtureHitbox(kind) {
  const { w, d, h } = FIXTURES[kind].size;
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), new THREE.MeshBasicMaterial({ visible: false }));
  m.position.y = h / 2;
  return m;
}
