// Small feedback effects. For now: a ring that pops on the floor where you tap.

import * as THREE from 'three';

const RING_LIFE = 0.5;

export function createFx(scene) {
  const rings = [];
  const geo = new THREE.RingGeometry(0.12, 0.17, 24);
  geo.rotateX(-Math.PI / 2);

  return {
    tapRing(position) {
      const mat = new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, depthWrite: false });
      const m = new THREE.Mesh(geo, mat);
      m.position.copy(position);
      m.position.y += 0.03;
      scene.add(m);
      rings.push({ m, t: 0 });
    },

    update(dt) {
      for (let i = rings.length - 1; i >= 0; i--) {
        const r = rings[i];
        r.t += dt;
        const p = r.t / RING_LIFE;
        r.m.scale.setScalar(1 + p * 1.2);
        r.m.material.opacity = 0.9 * (1 - p);
        if (p >= 1) {
          scene.remove(r.m);
          r.m.material.dispose();
          rings.splice(i, 1);
        }
      }
    },
  };
}
