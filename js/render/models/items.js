// Miniature product models, built at the origin standing on y = 0, front facing +z.
// They're tiny (~0.15-0.2 units) and get scaled up where they're shown.

import * as THREE from 'three';
import { mesh, box, cyl, ball, prism } from './prims.js';
import { PALETTE as P, toon } from '../toon.js';
import { ITEMS } from '../../data/items.js';

/** A flat five-pointed star facing +z, centered on (x, y, z). */
function star(g, r, depth, color, x, y, z) {
  const sh = new THREE.Shape();
  for (let i = 0; i < 10; i++) {
    const a = Math.PI / 2 + (i * Math.PI) / 5, rr = i % 2 ? r * 0.45 : r;
    if (i) sh.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); else sh.moveTo(Math.cos(a) * rr, Math.sin(a) * rr);
  }
  const geo = new THREE.ExtrudeGeometry(sh, { depth, bevelEnabled: false });
  geo.translate(0, 0, -depth / 2);
  return mesh(g, geo, color, x, y, z);
}

/** A bunny sitting on y = 0 at (x, z), `s` times the usual size. */
function bunny(g, c, s, x, z) {
  ball(g, 0.04 * s, c, x, 0.038 * s, z).scale.set(1, 1, 1.15);
  ball(g, 0.03 * s, c, x, 0.09 * s, z + 0.015 * s);
  for (const side of [-1, 1]) {
    const ear = box(g, 0.012 * s, 0.05 * s, 0.008 * s, c, x + side * 0.012 * s, 0.135 * s, z + 0.01 * s);
    ear.rotation.z = -side * 0.2;
    box(g, 0.006 * s, 0.035 * s, 0.002 * s, P.pink, x + side * 0.012 * s, 0.135 * s, z + 0.015 * s).rotation.z = -side * 0.2;
  }
  ball(g, 0.008 * s, P.pink, x, 0.088 * s, z + 0.044 * s, 0);
  ball(g, 0.014 * s, P.cream, x, 0.03 * s, z - 0.045 * s, 0); // tail
}

// Lantern glass and fireflies: soft, a little see-through, and glowing.
const toonGlass = new THREE.MeshToonMaterial({ color: '#fff4c2', transparent: true, opacity: 0.55 });
const glow = new THREE.MeshBasicMaterial({ color: '#fff3a0' });

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
  // ---- Page 1 ----
  nightlight(g, c) {
    cyl(g, 0.05, 0.06, 0.03, 10, P.lilac, 0, 0.015, 0);
    cyl(g, 0.008, 0.008, 0.04, 6, P.cream, 0, 0.05, 0);
    star(g, 0.07, 0.035, c, 0, 0.13, 0);
    ball(g, 0.012, P.cream, 0.065, 0.19, 0.01, 0);
    ball(g, 0.009, P.cream, -0.07, 0.17, 0.01, 0);
  },
  teddy(g, c) {
    ball(g, 0.055, c, 0, 0.06, 0).scale.set(1, 1.05, 0.9);
    ball(g, 0.028, P.cream, 0, 0.055, 0.04).scale.z = 0.5; // tummy
    ball(g, 0.045, c, 0, 0.145, 0.005);
    for (const side of [-1, 1]) {
      ball(g, 0.018, c, side * 0.035, 0.185, 0, 0);
      ball(g, 0.022, c, side * 0.055, 0.075, 0.01, 0); // arms
      ball(g, 0.024, c, side * 0.03, 0.02, 0.035, 0); // feet
    }
    ball(g, 0.02, P.cream, 0, 0.135, 0.04, 0).scale.z = 0.6;
    ball(g, 0.007, P.ink, 0, 0.142, 0.052, 0);
    box(g, 0.05, 0.015, 0.015, P.pink, 0, 0.11, 0.035); // bow
  },
  birdhouse(g, c) {
    cyl(g, 0.012, 0.014, 0.08, 6, P.wood, 0, 0.04, 0);
    box(g, 0.1, 0.1, 0.09, c, 0, 0.13, 0);
    prism(g, 0.13, 0.06, 0.11, P.roof).position.y = 0.18;
    cyl(g, 0.018, 0.018, 0.01, 10, P.ink, 0, 0.14, 0.046).rotation.x = Math.PI / 2;
    cyl(g, 0.004, 0.004, 0.03, 4, P.wood, 0, 0.11, 0.055).rotation.x = Math.PI / 2;
    ball(g, 0.012, P.pink, 0.04, 0.21, 0.04, 0);
  },
  // ---- Page 2 ----
  cupcakes(g, c) {
    cyl(g, 0.008, 0.008, 0.2, 6, P.cream, 0, 0.1, 0);
    cyl(g, 0.1, 0.1, 0.01, 14, P.cream, 0, 0.01, 0);
    cyl(g, 0.065, 0.065, 0.01, 12, P.cream, 0, 0.11, 0);
    const cake = (x, y, z, top) => {
      cyl(g, 0.018, 0.013, 0.022, 8, c, x, y + 0.011, z);
      ball(g, 0.019, top, x, y + 0.028, z, 0).scale.y = 0.75;
    };
    for (let i = 0; i < 5; i++) cake(Math.cos(i * 1.26) * 0.07, 0.015, Math.sin(i * 1.26) * 0.07, i % 2 ? P.cream : P.pink);
    for (let i = 0; i < 3; i++) cake(Math.cos(i * 2.1 + 0.5) * 0.04, 0.115, Math.sin(i * 2.1 + 0.5) * 0.04, i % 2 ? P.lilac : P.cream);
    ball(g, 0.015, '#ff6f91', 0, 0.21, 0, 0);
  },
  rocker(g, c) {
    for (const side of [-1, 1]) {
      const rock = mesh(g, new THREE.TorusGeometry(0.16, 0.008, 4, 12, 1.0), P.wood, side * 0.05, 0.168, 0);
      rock.rotation.set(0, Math.PI / 2, -Math.PI / 2 - 0.5);
      box(g, 0.012, 0.07, 0.012, P.wood, side * 0.05, 0.04, -0.04);
      box(g, 0.012, 0.07, 0.012, P.wood, side * 0.05, 0.04, 0.04);
    }
    box(g, 0.12, 0.02, 0.11, c, 0, 0.08, 0);
    box(g, 0.12, 0.14, 0.02, c, 0, 0.16, -0.05).rotation.x = -0.15;
    ball(g, 0.03, P.cream, 0, 0.1, 0.0, 0).scale.set(1.6, 0.45, 1.5);
    ball(g, 0.022, P.pink, 0, 0.17, -0.035, 0).scale.set(1.8, 1, 0.5);
  },
  swing(g, c) {
    for (const side of [-1, 1]) {
      cyl(g, 0.01, 0.014, 0.24, 6, P.trunk, side * 0.08, 0.12, 0);
      cyl(g, 0.002, 0.002, 0.13, 3, P.cream, side * 0.045, 0.165, 0);
    }
    cyl(g, 0.009, 0.009, 0.18, 6, P.trunk, 0, 0.235, 0).rotation.z = Math.PI / 2;
    box(g, 0.11, 0.012, 0.045, c, 0, 0.1, 0);
    for (let i = 0; i < 5; i++) ball(g, 0.014, [P.pink, P.butter, P.lilac][i % 3], -0.07 + i * 0.035, 0.245, 0.006, 0);
    for (const x of [-0.09, 0.09]) ball(g, 0.03, P.leaf, x, 0.245, 0, 0);
  },
  // ---- Page 3 ----
  trolley(g, c) {
    for (const y of [0.05, 0.13]) box(g, 0.18, 0.012, 0.1, c, 0, y, 0);
    for (const [dx, dz] of [[-0.08, -0.04], [0.08, -0.04], [-0.08, 0.04], [0.08, 0.04]]) {
      cyl(g, 0.006, 0.006, 0.13, 5, P.butter, dx, 0.085, dz);
      cyl(g, 0.016, 0.016, 0.01, 8, P.ink, dx, 0.016, dz).rotation.z = Math.PI / 2;
    }
    cyl(g, 0.006, 0.006, 0.12, 5, P.butter, 0.095, 0.17, 0).rotation.x = Math.PI / 2; // handle
    ball(g, 0.035, P.cream, -0.03, 0.17, 0).scale.y = 0.85; // teapot
    cyl(g, 0.006, 0.01, 0.035, 5, P.cream, 0.008, 0.18, 0).rotation.z = -0.9;
    ball(g, 0.01, P.pink, -0.03, 0.205, 0, 0);
    for (const x of [0.04, 0.07]) cyl(g, 0.014, 0.01, 0.02, 8, P.pink, x, 0.146, 0.02);
    cyl(g, 0.035, 0.035, 0.03, 10, P.peach, 0, 0.07, 0); // a cake on the bottom shelf
  },
  sofa(g, c) {
    box(g, 0.24, 0.06, 0.11, c, 0, 0.05, 0);
    box(g, 0.24, 0.1, 0.03, c, 0, 0.11, -0.045);
    for (const side of [-1, 1]) {
      cyl(g, 0.025, 0.025, 0.1, 8, c, side * 0.12, 0.09, 0.005).rotation.x = Math.PI / 2;
      ball(g, 0.012, P.butter, side * 0.1, 0.012, 0.04, 0);
      ball(g, 0.012, P.butter, side * 0.1, 0.012, -0.04, 0);
      ball(g, 0.03, P.cream, side * 0.05, 0.09, 0.005).scale.set(1.6, 0.4, 1.5);
    }
    ball(g, 0.025, P.pink, 0.06, 0.12, -0.02, 0).scale.set(1, 1, 0.5);
    for (let i = 0; i < 3; i++) ball(g, 0.008, P.butter, -0.08 + i * 0.08, 0.15, -0.03, 0); // buttons
  },
  lantern(g, c) {
    box(g, 0.1, 0.015, 0.1, c, 0, 0.008, 0);
    box(g, 0.085, 0.13, 0.085, toonGlass, 0, 0.08, 0);
    for (const [dx, dz] of [[-0.045, -0.045], [0.045, -0.045], [-0.045, 0.045], [0.045, 0.045]]) box(g, 0.012, 0.14, 0.012, c, dx, 0.08, dz);
    mesh(g, new THREE.ConeGeometry(0.08, 0.06, 4), c, 0, 0.18, 0).rotation.y = Math.PI / 4;
    mesh(g, new THREE.TorusGeometry(0.02, 0.005, 4, 10), c, 0, 0.225, 0);
    for (const [x, y, z] of [[0.015, 0.05, 0.01], [-0.02, 0.09, -0.01], [0.01, 0.12, -0.015], [-0.01, 0.065, 0.02]]) ball(g, 0.011, glow, x, y, z, 0);
  },
  canopy(g, c) {
    box(g, 0.22, 0.05, 0.15, P.cream, 0, 0.025, 0);
    box(g, 0.19, 0.03, 0.14, c, 0.015, 0.065, 0);
    box(g, 0.05, 0.03, 0.1, P.cream, -0.075, 0.07, 0);
    for (const [dx, dz] of [[-0.105, -0.07], [0.105, -0.07], [-0.105, 0.07], [0.105, 0.07]]) cyl(g, 0.007, 0.007, 0.24, 5, P.cream, dx, 0.12, dz);
    box(g, 0.23, 0.02, 0.16, c, 0, 0.245, 0);
    for (const side of [-1, 1]) box(g, 0.012, 0.11, 0.15, P.cream, side * 0.11, 0.185, 0); // curtains
    for (let i = 0; i < 4; i++) ball(g, 0.01, P.pink, -0.08 + i * 0.053, 0.26, 0.08, 0);
  },
  bunnies(g, c) {
    bunny(g, c, 1.25, -0.06, -0.02);
    bunny(g, '#f3d9c6', 1.1, 0.06, -0.03);
    bunny(g, c, 0.75, 0, 0.05);
    box(g, 0.025, 0.012, 0.012, P.pink, -0.06, 0.09, 0.02); // mum's bow
  },
  treehouse(g, c) {
    cyl(g, 0.025, 0.035, 0.22, 7, P.trunk, 0, 0.11, -0.01);
    ball(g, 0.09, P.leaf, 0, 0.24, -0.03);
    ball(g, 0.06, P.leafLight, 0.06, 0.22, 0.0);
    ball(g, 0.055, P.leaf, -0.065, 0.21, 0.0);
    box(g, 0.13, 0.012, 0.1, c, 0, 0.12, 0.02); // deck
    box(g, 0.09, 0.07, 0.07, P.peach, 0, 0.16, 0.01);
    prism(g, 0.11, 0.045, 0.085, P.roof).position.set(0, 0.195, 0.01);
    box(g, 0.025, 0.04, 0.005, P.cream, 0, 0.145, 0.047);
    for (const x of [-0.03, 0.03]) box(g, 0.006, 0.12, 0.006, c, x + 0.03, 0.06, 0.07);
    for (let i = 0; i < 4; i++) box(g, 0.03, 0.005, 0.006, c, 0.03, 0.02 + i * 0.03, 0.07);
  },
  // ---- Page 4 ----
  caketower(g, c) {
    cyl(g, 0.11, 0.11, 0.01, 16, P.cream, 0, 0.005, 0);
    const tiers = [[0.09, 0.06], [0.068, 0.05], [0.046, 0.045]];
    let y = 0.01;
    tiers.forEach(([r, h], i) => {
      cyl(g, r, r, h, 14, i % 2 ? P.cream : c, 0, y + h / 2, 0);
      mesh(g, new THREE.TorusGeometry(r, 0.008, 4, 16), i % 2 ? c : P.cream, 0, y + h, 0).rotation.x = Math.PI / 2;
      y += h;
    });
    for (let i = 0; i < 6; i++) ball(g, 0.011, '#ff6f91', Math.cos(i) * 0.08, 0.06, Math.sin(i) * 0.08, 0);
    cyl(g, 0.02, 0.026, 0.012, 6, P.butter, 0, y + 0.006, 0); // crown
    for (let i = 0; i < 5; i++) ball(g, 0.006, P.butter, Math.cos(i * 1.26) * 0.022, y + 0.018, Math.sin(i * 1.26) * 0.022, 0);
  },
  piano(g, c) {
    const body = new THREE.Shape();
    body.moveTo(-0.1, -0.06); body.lineTo(0.1, -0.06); body.lineTo(0.1, 0.0);
    body.quadraticCurveTo(0.08, 0.1, 0.0, 0.11); body.quadraticCurveTo(-0.1, 0.12, -0.1, 0.02); body.closePath();
    const geo = new THREE.ExtrudeGeometry(body, { depth: 0.05, bevelEnabled: false });
    geo.rotateX(Math.PI / 2);
    geo.translate(0, 0.14, 0);
    mesh(g, geo, c);
    const lid = new THREE.Mesh(geo, toon(c));
    lid.scale.y = 0.15;
    const hinge = new THREE.Group();
    hinge.position.set(0, 0.14, 0);
    lid.position.y = -0.14 * 0.15;
    hinge.add(lid);
    hinge.rotation.x = -0.55;
    g.add(hinge);
    box(g, 0.2, 0.015, 0.03, P.cream, 0, 0.105, 0.075); // keys
    for (let i = 0; i < 7; i++) box(g, 0.012, 0.008, 0.018, P.ink, -0.08 + i * 0.026, 0.115, 0.07);
    for (const [x, z] of [[-0.085, 0.05], [0.085, 0.05], [0, -0.09]]) cyl(g, 0.008, 0.006, 0.09, 6, P.butter, x, 0.045, z);
    box(g, 0.1, 0.015, 0.035, P.pink, 0, 0.06, 0.13); // bench
    for (const x of [-0.04, 0.04]) box(g, 0.01, 0.055, 0.01, P.butter, x, 0.028, 0.13);
  },
  carousel(g, c) {
    cyl(g, 0.11, 0.115, 0.03, 16, c, 0, 0.015, 0);
    cyl(g, 0.01, 0.01, 0.2, 6, P.butter, 0, 0.13, 0);
    mesh(g, new THREE.ConeGeometry(0.12, 0.06, 12), P.pink, 0, 0.26, 0);
    cyl(g, 0.12, 0.12, 0.015, 12, P.cream, 0, 0.225, 0);
    ball(g, 0.014, P.butter, 0, 0.3, 0, 0);
    for (let i = 0; i < 3; i++) {
      const a = (i * Math.PI * 2) / 3 + 0.4, x = Math.cos(a) * 0.075, z = Math.sin(a) * 0.075;
      cyl(g, 0.004, 0.004, 0.2, 4, P.butter, x, 0.13, z);
      const horse = new THREE.Group();
      horse.position.set(x, 0.1 + (i % 2) * 0.03, z);
      horse.rotation.y = -a;
      g.add(horse);
      box(horse, 0.022, 0.024, 0.055, P.cream, 0, 0, 0);
      box(horse, 0.016, 0.03, 0.018, P.cream, 0, 0.022, 0.03).rotation.x = 0.4;
      mesh(horse, new THREE.ConeGeometry(0.004, 0.018, 4), P.butter, 0, 0.044, 0.04);
      box(horse, 0.008, 0.028, 0.012, i ? P.lilac : P.pink, 0, 0.018, 0.018); // mane
    }
  },
  cloudbed(g, c) {
    for (const [x, z, r] of [[-0.08, 0, 0.045], [-0.03, 0.03, 0.04], [0.03, 0.03, 0.04], [0.08, 0, 0.045], [0, -0.02, 0.05]]) ball(g, r, P.cream, x, 0.035, z).scale.y = 0.75;
    box(g, 0.2, 0.025, 0.12, c, 0.01, 0.075, 0.005);
    box(g, 0.045, 0.025, 0.09, P.cream, -0.07, 0.095, 0.005);
    for (const [x, y, r] of [[-0.11, 0.12, 0.04], [-0.11, 0.18, 0.035], [-0.11, 0.08, 0.035]]) ball(g, r, P.cream, x, y, 0).scale.x = 0.55;
    star(g, 0.028, 0.012, P.butter, -0.105, 0.225, 0.0).rotation.y = Math.PI / 2;
    star(g, 0.015, 0.008, P.butter, 0.1, 0.11, 0.06);
    box(g, 0.12, 0.012, 0.125, P.lilac, 0.045, 0.092, 0.005); // blanket
  },
  princess(g, c) {
    mesh(g, new THREE.ConeGeometry(0.075, 0.15, 10), c, 0, 0.075, 0);
    mesh(g, new THREE.TorusGeometry(0.07, 0.008, 4, 14), P.cream, 0, 0.01, 0).rotation.x = Math.PI / 2;
    cyl(g, 0.022, 0.03, 0.04, 8, c, 0, 0.16, 0);
    ball(g, 0.042, '#fde7da', 0, 0.21, 0);
    mesh(g, new THREE.SphereGeometry(0.047, 8, 4, 0, Math.PI * 2, 0, Math.PI * 0.6), P.butter, 0, 0.215, -0.006);
    ball(g, 0.03, P.butter, 0, 0.18, -0.03).scale.set(1, 1.6, 0.6); // long hair
    cyl(g, 0.022, 0.026, 0.018, 6, P.butter, 0, 0.255, 0);
    for (let i = 0; i < 5; i++) ball(g, 0.006, P.pink, Math.cos(i * 1.26) * 0.024, 0.268, Math.sin(i * 1.26) * 0.024, 0);
    for (const side of [-1, 1]) ball(g, 0.008, P.pink, side * 0.025, 0.2, 0.035, 0); // rosy cheeks
  },
  castle(g, c) {
    box(g, 0.16, 0.13, 0.11, c, 0, 0.065, 0);
    for (let i = 0; i < 4; i++) box(g, 0.025, 0.025, 0.11, c, -0.06 + i * 0.04, 0.142, 0); // battlements
    for (const side of [-1, 1]) {
      cyl(g, 0.035, 0.035, 0.19, 10, c, side * 0.09, 0.095, 0.02);
      mesh(g, new THREE.ConeGeometry(0.045, 0.08, 10), P.lilac, side * 0.09, 0.23, 0.02);
      box(g, 0.02, 0.03, 0.005, P.sky, side * 0.09, 0.14, 0.056);
    }
    cyl(g, 0.003, 0.003, 0.06, 4, P.ink, 0.09, 0.29, 0.02);
    box(g, 0.03, 0.018, 0.003, P.pink, 0.106, 0.31, 0.02); // flag
    const door = new THREE.Shape();
    door.moveTo(-0.022, 0); door.lineTo(0.022, 0); door.lineTo(0.022, 0.04); door.absarc(0, 0.04, 0.022, 0, Math.PI, false); door.closePath();
    mesh(g, new THREE.ExtrudeGeometry(door, { depth: 0.006, bevelEnabled: false }), P.wood, 0, 0, 0.055);
    for (const x of [-0.035, 0.035]) box(g, 0.022, 0.03, 0.004, P.sky, x, 0.095, 0.056);
    star(g, 0.014, 0.004, P.butter, 0, 0.115, 0.057);
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
