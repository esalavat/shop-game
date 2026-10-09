// Chunky bean-shaped characters: big head, rosy cheeks, simple hair styles, and an optional
// accessory (bow, glasses, or hat).
// `root` is moved and turned; `inner` is bobbed and wobbled for walk/idle animation.

import * as THREE from 'three';
import { mesh, box, ball, cyl } from './prims.js';
import { PALETTE as P } from '../toon.js';

const EYE = '#3a2a3a', CHEEK = '#ff9fb0', SHOE = '#5a3a55', BOW = '#ff7fb0', FRAMES = '#5a3a55';

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

  const capLength = Math.PI * (hair === 'bob' ? 0.62 : 0.5);
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
  } else if (accessory === 'hat') {
    cyl(inner, 0.33, 0.33, 0.025, 14, P.butter, 0, 1.0, -0.02).rotation.x = -0.12;
    cyl(inner, 0.17, 0.2, 0.15, 12, P.butter, 0, 1.08, -0.03).rotation.x = -0.12;
    cyl(inner, 0.205, 0.205, 0.045, 12, P.pink, 0, 1.03, -0.025).rotation.x = -0.12;
  }
}
