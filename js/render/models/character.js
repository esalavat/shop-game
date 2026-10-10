// Chunky bean-shaped characters: big head, rosy cheeks, simple hair styles, and an optional
// accessory. Girls' hair: bob, bun, pigtails, ponytail; boys' (GDD #43): short, spiky, curly, swoop.
// Accessories: bow, glasses, sun hat, bow tie, cap; theme rewards (GDD #70): flower crown, bunny ears, crown.
// `root` is moved and turned; `inner` is bobbed and wobbled for walk/idle animation.

import * as THREE from 'three';
import { mesh, box, ball, cyl } from './prims.js';
import { PALETTE as P } from '../toon.js';

const GOLD = '#ffd24d', GEM = '#ff7fb0', EAR = '#fff6ee', EAR_IN = '#ffb8d0', LEAF = '#8fd19e';
const FLOWERS = ['#ff9ec4', '#ffd98a', '#c8b6ff', '#fff6ee'];
const EYE = '#3a2a3a', CHEEK = '#ff9fb0', SHOE = '#5a3a55', BOW = '#ff7fb0', FRAMES = '#5a3a55', CAP = '#8fc8f0', BRIM = '#6fb0e0';

/** Grown-up size relative to the room; kids can pass a smaller scale. */
export const CHARACTER_SCALE = 1.15;

export function createCharacter({ hair = 'bob', hairColor = '#6b3e2e', skin = '#ffd9c2', outfit = '#ff9ec4', accessory = 'none', apron = false, scale = CHARACTER_SCALE } = {}) {
  const root = new THREE.Group();
  const inner = new THREE.Group();
  root.add(inner);

  mesh(inner, new THREE.CapsuleGeometry(0.2, 0.22, 3, 8), outfit, 0, 0.33, 0);
  ball(inner, 0.075, outfit, -0.22, 0.36, 0);
  ball(inner, 0.075, outfit, 0.22, 0.36, 0);
  ball(inner, 0.07, SHOE, -0.08, 0.04, 0.02, 0);
  ball(inner, 0.07, SHOE, 0.08, 0.04, 0.02, 0);
  if (apron) {
    box(inner, 0.3, 0.3, 0.05, P.cream, 0, 0.3, 0.18);
    box(inner, 0.12, 0.06, 0.02, P.pink, 0, 0.33, 0.21);
  }

  ball(inner, 0.25, skin, 0, 0.82, 0);
  ball(inner, 0.035, EYE, -0.085, 0.84, 0.225, 0);
  ball(inner, 0.035, EYE, 0.085, 0.84, 0.225, 0);
  ball(inner, 0.04, CHEEK, -0.15, 0.77, 0.19, 0).scale.z = 0.4;
  ball(inner, 0.04, CHEEK, 0.15, 0.77, 0.19, 0).scale.z = 0.4;

  const capLength = Math.PI * (hair === 'bob' ? 0.62 : hair === 'short' || hair === 'spiky' ? 0.42 : 0.5);
  const cap = mesh(inner, new THREE.SphereGeometry(0.27, 10, 6, 0, Math.PI * 2, 0, capLength), hairColor, 0, 0.83, -0.02);
  if (hair === 'bob') cap.rotation.x = -0.45;
  if (hair === 'bun') ball(inner, 0.12, hairColor, 0, 1.1, -0.05);
  if (hair === 'pigtails') {
    ball(inner, 0.1, hairColor, -0.27, 0.86, -0.06);
    ball(inner, 0.1, hairColor, 0.27, 0.86, -0.06);
  }
  if (hair === 'ponytail') { // tied high on one side, so it shows from the front
    ball(inner, 0.08, hairColor, 0.2, 1.0, -0.06);
    const tail = ball(inner, 0.085, hairColor, 0.3, 0.84, -0.06);
    tail.scale.set(0.9, 1.7, 0.9);
    tail.rotation.z = 0.35;
  }
  const capped = accessory === 'cap'; // hair on top stays under the cap; fringes peek out below the brim
  const fringeY = capped ? 0.93 : 1.0;
  if (hair === 'short') { // a soft fringe over the forehead
    ball(inner, 0.13, hairColor, 0.04, fringeY, 0.13).scale.set(1.5, 0.55, 0.8);
  }
  if (hair === 'spiky' && !capped) {
    for (const [x, z, tilt] of [[-0.14, 0.05, 0.5], [-0.05, 0.12, 0.2], [0.06, 0.12, -0.2], [0.15, 0.04, -0.5], [0, -0.06, 0]]) {
      const spike = mesh(inner, new THREE.ConeGeometry(0.075, 0.17, 6), hairColor, x, 1.06, z);
      spike.rotation.z = tilt;
      spike.rotation.x = z * 2;
    }
  }
  if (hair === 'curly') { // a ring of curls around the top
    for (let i = 0; i < 9; i++) {
      const a = (i / 9) * Math.PI * 2;
      ball(inner, 0.085, hairColor, Math.sin(a) * 0.2, 1.0 + Math.cos(a * 2) * 0.02, Math.cos(a) * 0.17 - 0.02);
    }
    if (!capped) ball(inner, 0.12, hairColor, 0, 1.07, -0.02);
  }
  if (hair === 'swoop') { // a big swept fringe to one side
    const swoop = ball(inner, 0.13, hairColor, -0.07, capped ? 0.9 : 1.02, 0.12);
    swoop.scale.set(1.6, 0.7, 0.9);
    swoop.rotation.z = 0.35;
  }
  addAccessory(inner, accessory, hair);

  root.scale.setScalar(scale);
  return { root, inner };
}

function addAccessory(inner, accessory, hair) {
  if (accessory === 'bow') {
    // On the side of the head, clear of a bun or ponytail.
    const x = hair === 'pigtails' ? 0.12 : 0.16, y = hair === 'pigtails' ? 1.06 : 1.02;
    ball(inner, 0.065, BOW, x - 0.06, y, 0.07).scale.set(1, 0.75, 0.6);
    ball(inner, 0.065, BOW, x + 0.06, y, 0.07).scale.set(1, 0.75, 0.6);
    ball(inner, 0.032, BOW, x, y, 0.09, 0);
  } else if (accessory === 'glasses') {
    for (const x of [-0.085, 0.085]) {
      const ring = mesh(inner, new THREE.TorusGeometry(0.055, 0.012, 6, 14), FRAMES, x, 0.84, 0.235);
      ring.castShadow = false;
    }
    box(inner, 0.06, 0.014, 0.014, FRAMES, 0, 0.85, 0.24).castShadow = false;
  } else if (accessory === 'bowtie') {
    ball(inner, 0.05, BOW, -0.05, 0.6, 0.17).scale.set(1, 0.75, 0.5);
    ball(inner, 0.05, BOW, 0.05, 0.6, 0.17).scale.set(1, 0.75, 0.5);
    ball(inner, 0.025, BOW, 0, 0.6, 0.19, 0);
  } else if (accessory === 'cap') { // a baseball cap, brim to the front
    mesh(inner, new THREE.SphereGeometry(0.275, 12, 6, 0, Math.PI * 2, 0, Math.PI * 0.42), CAP, 0, 0.86, -0.02);
    const brim = cyl(inner, 0.17, 0.17, 0.025, 12, BRIM, 0, 1.0, 0.2); // tipped toward the camera so it shows
    brim.scale.set(1, 1, 0.75);
    brim.rotation.x = 0.55;
    ball(inner, 0.03, P.cream, 0, 1.13, -0.02, 0);
  } else if (accessory === 'flowers') { // a ring of little flowers and leaves round the head
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2;
      const x = Math.sin(a) * 0.235, z = Math.cos(a) * 0.215 - 0.02;
      if (i % 2) ball(inner, 0.03, LEAF, x, 1.0, z, 0).scale.set(1, 0.6, 1.4);
      else ball(inner, 0.052, FLOWERS[(i / 2) % FLOWERS.length], x, 1.0, z, 0);
    }
  } else if (accessory === 'bunny') { // tall ears on a headband
    for (const side of [-1, 1]) {
      const ear = ball(inner, 0.07, EAR, side * 0.11, 1.24, -0.03);
      ear.scale.set(0.6, 2.0, 0.45);
      ear.rotation.z = -side * 0.22;
      const inside = ball(inner, 0.045, EAR_IN, side * 0.112, 1.23, 0.0, 0);
      inside.scale.set(0.55, 1.9, 0.3);
      inside.rotation.z = -side * 0.22;
    }
  } else if (accessory === 'crown') { // a little gold crown with points and a pink gem
    const tilt = -0.15;
    cyl(inner, 0.14, 0.13, 0.08, 14, GOLD, 0, 1.11, -0.01).rotation.x = tilt;
    for (let i = 0; i < 5; i++) {
      const a = ((i - 2) / 5) * Math.PI * 2 * 0.9;
      const point = mesh(inner, new THREE.ConeGeometry(0.035, 0.08, 5), GOLD, Math.sin(a) * 0.13, 1.18 - Math.cos(a) * 0.01, Math.cos(a) * 0.12 - 0.02);
      point.rotation.x = tilt;
      ball(inner, 0.018, GOLD, point.position.x, point.position.y + 0.045, point.position.z, 0);
    }
    ball(inner, 0.03, GEM, 0, 1.11, 0.13, 0);
  } else if (accessory === 'hat') {
    cyl(inner, 0.33, 0.33, 0.025, 14, P.butter, 0, 1.0, -0.02).rotation.x = -0.12;
    cyl(inner, 0.17, 0.2, 0.15, 12, P.butter, 0, 1.08, -0.03).rotation.x = -0.12;
    cyl(inner, 0.205, 0.205, 0.045, 12, P.pink, 0, 1.03, -0.025).rotation.x = -0.12;
  }
}
