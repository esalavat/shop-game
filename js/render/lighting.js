// Sun + sky + front fill, blended between day and purple twilight, plus lamps that glow at twilight.

import * as THREE from 'three';
import { toonGlow } from './toon.js';
import { mesh, cyl, ball } from './models/prims.js';

const DAY = {
  sky: '#bfe3f5', hemiSky: '#fff4e6', hemiGround: '#d9b8e8', hemi: 0.8,
  sun: '#fff3df', sunI: 2.2, sunDir: new THREE.Vector3(-3, 5, 11).normalize(),
  fill: '#ffe9f2', fillI: 0.8, glass: '#cdeaff',
};
const TWILIGHT = {
  sky: '#6f62b0', hemiSky: '#8a7fe0', hemiGround: '#c99ad8', hemi: 0.65,
  sun: '#c9a6f0', sunI: 1.0, sunDir: new THREE.Vector3(9, 3.5, 9).normalize(),
  fill: '#b8a8f0', fillI: 0.45, glass: '#8f7fd6',
};
const LAMP_COLOR = '#ffdcd2';
const LAMP_INTENSITY = 3;

export function createLighting(scene) {
  scene.background = new THREE.Color(DAY.sky);
  const hemi = new THREE.HemisphereLight(DAY.hemiSky, DAY.hemiGround, DAY.hemi);
  const sun = new THREE.DirectionalLight(DAY.sun, DAY.sunI);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.bias = -0.0004;
  sun.shadow.normalBias = 0.02;
  // Shadowless fill from the viewer's side so the cutaway interiors never go flat.
  const fill = new THREE.DirectionalLight(DAY.fill, DAY.fillI);
  fill.position.set(2, 3, 10);
  scene.add(hemi, sun, sun.target, fill);

  const shadeMat = toonGlow('#fff3c9', '#ffd6c8', { side: THREE.DoubleSide });
  const bulbMat = toonGlow('#fffbe8', '#fff0dc');
  const glassMat = new THREE.MeshBasicMaterial({ color: DAY.glass });
  let lamps = [];

  const c = (hex) => new THREE.Color(hex);
  const day = Object.fromEntries(Object.entries(DAY).map(([k, v]) => [k, typeof v === 'string' ? c(v) : v]));
  const tw = Object.fromEntries(Object.entries(TWILIGHT).map(([k, v]) => [k, typeof v === 'string' ? c(v) : v]));
  const lerp = THREE.MathUtils.lerp;
  const sunDir = new THREE.Vector3();
  let twilight = 0, twilightTarget = 0;

  function addLight(parent, x, y, z) {
    const L = new THREE.PointLight(LAMP_COLOR, 0, 5, 1.5);
    L.position.set(x, y, z);
    parent.add(L);
    lamps.push(L);
  }

  return {
    glassMat,
    get twilight() { return twilightTarget; },
    setTwilight(v) { twilightTarget = v; },

    /** Pendant lamp hanging from a ceiling at height y. */
    addPendant(parent, x, y, z) {
      cyl(parent, 0.008, 0.008, 0.35, 4, '#5a3a55', x, y - 0.175, z).castShadow = false;
      mesh(parent, new THREE.ConeGeometry(0.22, 0.18, 10, 1, true), shadeMat, x, y - 0.42, z).castShadow = false;
      ball(parent, 0.06, bulbMat, x, y - 0.48, z).castShadow = false;
      addLight(parent, x, y - 0.6, z);
    },

    addStreetLamp(parent, x, groundY, z) {
      cyl(parent, 0.05, 0.06, 2.2, 6, '#5a3a55', x, groundY + 1.1, z);
      ball(parent, 0.16, bulbMat, x, groundY + 2.25, z).castShadow = false;
      addLight(parent, x, groundY + 2.1, z + 0.2);
    },

    /** Forget lamps from a world that is being rebuilt. */
    resetLamps() { lamps = []; },

    /** Aim the sun at the building and size its shadow box to cover it. */
    fitTo({ width, height }) {
      const span = Math.max(width, height) / 2 + 4;
      sun.target.position.set(0, height / 2, 0);
      Object.assign(sun.shadow.camera, { left: -span, right: span, top: span, bottom: -span, near: 1, far: 60 });
      sun.shadow.camera.updateProjectionMatrix();
      this.update(0, true);
    },

    update(dt, snap = false) {
      twilight = snap ? twilightTarget : twilight + (twilightTarget - twilight) * (1 - Math.exp(-dt * 3));
      const t = twilight;
      scene.background.lerpColors(day.sky, tw.sky, t);
      hemi.color.lerpColors(day.hemiSky, tw.hemiSky, t);
      hemi.groundColor.lerpColors(day.hemiGround, tw.hemiGround, t);
      hemi.intensity = lerp(day.hemi, tw.hemi, t);
      sun.color.lerpColors(day.sun, tw.sun, t);
      sun.intensity = lerp(day.sunI, tw.sunI, t);
      sunDir.lerpVectors(day.sunDir, tw.sunDir, t).normalize();
      sun.position.copy(sun.target.position).addScaledVector(sunDir, 25);
      fill.color.lerpColors(day.fill, tw.fill, t);
      fill.intensity = lerp(day.fillI, tw.fillI, t);
      glassMat.color.lerpColors(day.glass, tw.glass, t);
      shadeMat.emissiveIntensity = t * 0.6;
      bulbMat.emissiveIntensity = t * 1.6;
      for (const L of lamps) L.intensity = t * LAMP_INTENSITY;
    },
  };
}
