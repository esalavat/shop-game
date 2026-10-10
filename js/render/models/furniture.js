// Fixture models. Each is built at the origin, standing on y = 0, with its front facing +z.

import * as THREE from 'three';
import { box, cyl, ball, prism } from './prims.js';
import { PALETTE as P, toon, gradientMap } from '../toon.js';
import { FIXTURES } from '../../data/fixtures.js';
import { STAIRS, FLOOR_H } from '../../sim/route.js';

/** Heights of the shelf boards that items will sit on (used when stocking); the last is the top, for Tall Shelves. */
export const SHELF_LEVELS = [0.06, 0.58, 1.1, 1.6];

const BUILDERS = {
  shelf(g) {
    const { w, h } = FIXTURES.shelf.size;
    const hh = h - 0.05;
    box(g, 0.06, hh, 0.42, P.cream, -w / 2, hh / 2, 0);
    box(g, 0.06, hh, 0.42, P.cream, w / 2, hh / 2, 0);
    box(g, w, hh, 0.03, '#f9e6ee', 0, hh / 2, -0.2);
    for (const y of SHELF_LEVELS.slice(0, 3)) box(g, w, 0.05, 0.42, P.cream, 0, y, 0);
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

  // The room's corner piece (GDD #68): a plant unless restyled.
  plant(g, look) {
    CORNERS[look?.corner.id] ? CORNERS[look.corner.id](g) : CORNERS.plant(g);
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

  rug(g, look) {
    const rug = look?.rug ?? { shape: 'round', color: P.lilac, color2: '#ddd1ff' };
    RUGS[rug.shape]?.(g, rug.color, rug.color2);
  },
};

/** Build a fixture; `look` is the room's style (data/decor.js roomLook) for its rug and corner piece. */
export function buildFixture(kind, look = null) {
  const g = new THREE.Group();
  BUILDERS[kind](g, look);
  return g;
}

/** A flat rug piece: a shape extruded 0.02 up, lying on the floor. */
function flat(g, shape, color, y) {
  const geo = new THREE.ExtrudeGeometry(shape, { depth: 0.02, bevelEnabled: false, curveSegments: 10 });
  geo.rotateX(-Math.PI / 2);
  const m = new THREE.Mesh(geo, toon(color));
  m.position.y = y;
  m.receiveShadow = true;
  g.add(m);
}

function heartShape(r) {
  const s = new THREE.Shape();
  s.moveTo(0, -r * 0.9);
  s.bezierCurveTo(-r * 1.6, r * 0.2, -r * 0.6, r * 1.3, 0, r * 0.45);
  s.bezierCurveTo(r * 0.6, r * 1.3, r * 1.6, r * 0.2, 0, -r * 0.9);
  return s;
}

function starShape(r) {
  const s = new THREE.Shape();
  for (let i = 0; i < 10; i++) {
    const a = Math.PI / 2 + (i * Math.PI) / 5, rr = i % 2 ? r * 0.5 : r;
    i ? s.lineTo(Math.cos(a) * rr, Math.sin(a) * rr) : s.moveTo(Math.cos(a) * rr, Math.sin(a) * rr);
  }
  return s;
}

/** Rug shapes (GDD #68), about 1.4 across like the walkable rug footprint. */
const RUGS = {
  none() {},
  round(g, a, b) {
    const outer = cyl(g, 0.7, 0.7, 0.02, 14, a, 0, 0.02, 0);
    const inner = cyl(g, 0.5, 0.5, 0.022, 14, b, 0, 0.022, 0);
    outer.castShadow = inner.castShadow = false;
  },
  rect(g, a, b) {
    box(g, 1.5, 0.02, 1.0, b, 0, 0.02, 0).castShadow = false;
    for (let i = 0; i < 4; i++) box(g, 0.2, 0.022, 1.0, a, -0.6 + i * 0.4, 0.021, 0).castShadow = false;
  },
  heart(g, a, b) {
    flat(g, heartShape(0.62), a, 0.01);
    flat(g, heartShape(0.42), b, 0.015);
  },
  star(g, a, b) {
    flat(g, starShape(0.78), a, 0.01);
    flat(g, starShape(0.5), b, 0.015);
  },
  flower(g, a, b) {
    for (let i = 0; i < 6; i++) {
      const t = (i / 6) * Math.PI * 2;
      cyl(g, 0.3, 0.3, 0.02, 12, a, Math.cos(t) * 0.38, 0.02, Math.sin(t) * 0.38).castShadow = false;
    }
    cyl(g, 0.32, 0.32, 0.024, 12, b, 0, 0.022, 0).castShadow = false;
  },
};

const GUMBALL_GLASS = new THREE.MeshToonMaterial({ color: '#ffffff', gradientMap, transparent: true, opacity: 0.45 });

/** Corner pieces (GDD #68), each fitting the plant's footprint (FIXTURES.plant). */
const CORNERS = {
  plant(g) {
    cyl(g, 0.18, 0.14, 0.3, 8, P.brick, 0, 0.15, 0);
    ball(g, 0.3, P.leaf, 0, 0.5, 0, 0);
    ball(g, 0.2, P.leafLight, 0.12, 0.72, 0.05, 0);
    ball(g, 0.06, P.pink, -0.18, 0.62, 0.18, 0);
  },
  fern(g) {
    cyl(g, 0.17, 0.13, 0.28, 8, P.cream, 0, 0.14, 0);
    for (let i = 0; i < 7; i++) {
      const leaf = new THREE.Group();
      leaf.rotation.y = (i / 7) * Math.PI * 2;
      const blade = box(leaf, 0.09, 0.03, 0.5, i % 2 ? P.leaf : P.leafLight, 0, 0, 0.2);
      blade.rotation.x = -0.6;
      leaf.position.y = 0.42;
      g.add(leaf);
    }
  },
  cactus(g) {
    cyl(g, 0.16, 0.13, 0.24, 8, P.peach, 0, 0.12, 0);
    cyl(g, 0.11, 0.11, 0.5, 8, '#7cc59a', 0, 0.48, 0);
    ball(g, 0.11, '#7cc59a', 0, 0.73, 0, 1);
    cyl(g, 0.06, 0.06, 0.22, 6, '#7cc59a', 0.15, 0.55, 0).rotation.z = -0.5;
    ball(g, 0.05, P.pink, 0, 0.85, 0, 0);
  },
  flowers(g) {
    cyl(g, 0.1, 0.13, 0.36, 8, P.sky, 0, 0.18, 0);
    for (const [x, z, c] of [[0, 0, P.pink], [0.1, 0.06, P.butter], [-0.1, 0.05, P.lilac], [0.04, -0.1, P.peach], [-0.05, -0.06, P.pink]]) {
      cyl(g, 0.012, 0.012, 0.3, 4, P.leaf, x * 0.6, 0.5, z * 0.6);
      ball(g, 0.075, c, x, 0.68, z, 0);
    }
  },
  lamp(g) {
    cyl(g, 0.16, 0.18, 0.04, 10, P.cream, 0, 0.02, 0);
    cyl(g, 0.02, 0.02, 1.1, 6, P.cream, 0, 0.57, 0);
    cyl(g, 0.12, 0.22, 0.26, 10, P.butter, 0, 1.2, 0);
  },
  books(g) {
    const w = 0.42, h = 0.95, d = 0.32;
    box(g, w, h, 0.03, P.wood, 0, h / 2, -d / 2 + 0.015);
    box(g, 0.03, h, d, P.wood, -w / 2, h / 2, 0);
    box(g, 0.03, h, d, P.wood, w / 2, h / 2, 0);
    for (const y of [0.02, 0.33, 0.64, h]) box(g, w, 0.03, d, P.wood, 0, y, 0);
    const colors = [P.pink, P.sky, P.butter, P.mint, P.lilac, P.peach];
    for (let shelf = 0; shelf < 3; shelf++) {
      for (let i = 0; i < 5; i++) {
        const bh = 0.2 + ((i * 7 + shelf * 3) % 4) * 0.02;
        box(g, 0.06, bh, 0.22, colors[(i + shelf * 2) % colors.length], -0.15 + i * 0.075, 0.035 + shelf * 0.31 + bh / 2, 0.02);
      }
    }
  },
  balloons(g) {
    cyl(g, 0.08, 0.1, 0.08, 8, P.ink, 0, 0.04, 0);
    for (const [x, y, z, c] of [[0, 1.2, 0, P.pink], [-0.15, 1.05, 0.05, P.sky], [0.15, 1.08, -0.04, P.butter], [0.02, 0.98, 0.14, P.lilac]]) {
      const string = cyl(g, 0.006, 0.006, y - 0.1, 3, P.cream, x / 2, (y - 0.1) / 2 + 0.06, z / 2);
      string.castShadow = false;
      ball(g, 0.14, c, x, y, z, 1).scale.y = 1.15;
    }
  },
  gumball(g) {
    cyl(g, 0.14, 0.18, 0.4, 8, P.pink, 0, 0.2, 0);
    cyl(g, 0.15, 0.15, 0.05, 8, P.cream, 0, 0.42, 0);
    const glass = ball(g, 0.2, GUMBALL_GLASS, 0, 0.62, 0, 2);
    glass.castShadow = false;
    const colors = [P.pink, P.butter, P.mint, P.sky, P.lilac, P.peach];
    for (let i = 0; i < 12; i++) {
      const a = i * 2.4, r = 0.1 + (i % 3) * 0.02;
      ball(g, 0.04, colors[i % colors.length], Math.cos(a) * r * 0.9, 0.5 + (i % 4) * 0.05, Math.sin(a) * r * 0.9, 0);
    }
    box(g, 0.08, 0.06, 0.04, P.cream, 0, 0.26, 0.17);
    box(g, 0.1, 0.06, 0.06, '#e0679a', 0, 0.82, 0);
  },
};

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
