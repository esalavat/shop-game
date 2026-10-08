// Fixture models. Each is built at the origin, standing on y = 0, with its front facing +z.

import * as THREE from 'three';
import { box, cyl, ball, prism } from './prims.js';
import { PALETTE as P } from '../toon.js';
import { FIXTURES } from '../../data/fixtures.js';

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
    const { w, d } = FIXTURES.counter.size;
    box(g, w, 0.75, d, P.wood, 0, 0.375, 0);
    box(g, w - 0.12, 0.5, 0.02, '#e4b98e', 0, 0.4, d / 2 + 0.005);
    box(g, w + 0.1, 0.06, d + 0.08, P.cream, 0, 0.78, 0);
    // register
    box(g, 0.26, 0.2, 0.25, P.pink, 0.33, 0.91, -0.02);
    const screen = box(g, 0.2, 0.12, 0.03, P.sky, 0.33, 1.05, -0.12);
    screen.rotation.x = -0.3;
    box(g, 0.18, 0.03, 0.12, P.cream, 0.33, 1.02, 0.08);
    // little bell
    cyl(g, 0.05, 0.07, 0.06, 8, P.butter, -0.32, 0.84, 0.08);
  },

  pedestal(g) {
    cyl(g, 0.42, 0.46, 0.4, 10, P.cream, 0, 0.2, 0);
    cyl(g, 0.46, 0.46, 0.04, 10, P.pink, 0, 0.42, 0);
    const house = dreamDollhouse();
    house.position.y = 0.44;
    house.scale.setScalar(0.85);
    g.add(house);
  },

  plant(g) {
    cyl(g, 0.18, 0.14, 0.3, 8, P.brick, 0, 0.15, 0);
    ball(g, 0.3, P.leaf, 0, 0.5, 0, 0);
    ball(g, 0.2, P.leafLight, 0.12, 0.72, 0.05, 0);
    ball(g, 0.06, P.pink, -0.18, 0.62, 0.18, 0);
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

/** The player's Dream Dollhouse: an open-front two-storey house with tiny furniture. */
export function dreamDollhouse() {
  const g = new THREE.Group();
  const w = 0.9, h = 0.9, d = 0.5, t = 0.04;
  box(g, w, h, t, '#fff0f6', 0, h / 2, -d / 2);
  box(g, w / 2 - t, h / 2 - t, 0.01, P.lilac, -w / 4, h * 0.75, -d / 2 + t / 2 + 0.005);
  box(g, w / 2 - t, h / 2 - t, 0.01, P.mint, w / 4, h * 0.25, -d / 2 + t / 2 + 0.005);
  box(g, t, h, d, P.pink, -w / 2, h / 2, 0);
  box(g, t, h, d, P.pink, w / 2, h / 2, 0);
  box(g, t, h, d, P.pink, 0, h / 2, 0);
  for (const y of [0, h / 2, h]) box(g, w + t, t, d + 0.02, P.cream, 0, y, 0);
  prism(g, w + 0.18, 0.42, d + 0.12, P.roof).position.y = h + t / 2;
  box(g, 0.1, 0.22, 0.1, P.brick, 0.25, h + 0.3, -0.05);
  // tiny furniture
  box(g, 0.22, 0.05, 0.14, P.lilac, -0.2, h / 2 + 0.05, -0.05);
  box(g, 0.06, 0.03, 0.1, P.cream, -0.29, h / 2 + 0.09, -0.05);
  cyl(g, 0.08, 0.08, 0.02, 8, P.cream, 0.22, 0.12, 0);
  cyl(g, 0.015, 0.015, 0.1, 4, P.wood, 0.22, 0.06, 0);
  cyl(g, 0.02, 0.06, 0.08, 6, P.butter, 0.25, h / 2 + 0.2, -0.12);
  box(g, 0.12, 0.06, 0.08, P.pink, -0.22, 0.05, 0);
  return g;
}

/** An invisible box covering a fixture, so taps land on it reliably. */
export function fixtureHitbox(kind) {
  const { w, d, h } = FIXTURES[kind].size;
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), new THREE.MeshBasicMaterial({ visible: false }));
  m.position.y = h / 2;
  return m;
}
