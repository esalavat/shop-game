// Small feedback effects in the 3D world: a ring that pops on the floor where you tap,
// sparkle bursts (stocking, the Dream Dollhouse, window-peekers), and a poof when a box is emptied.
// Particles share geometry and materials and fade by shrinking, so they're cheap on phones.

import * as THREE from 'three';

const RING_LIFE = 0.5;
const SPARKLE_COLORS = ['#ffd98a', '#ffffff', '#ff9ec4', '#c8b6ff'];
const PUFF_COLOR = '#fff6ee';

/** A four-pointed star in the XY plane (it faces the straight-on camera). */
function starGeometry(r = 0.07) {
  const s = new THREE.Shape();
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2 + Math.PI / 2;
    const d = i % 2 ? r * 0.32 : r;
    const x = Math.cos(a) * d, y = Math.sin(a) * d;
    if (i) s.lineTo(x, y); else s.moveTo(x, y);
  }
  return new THREE.ShapeGeometry(s);
}

export function createFx(scene) {
  const rings = [];
  const ringGeo = new THREE.RingGeometry(0.12, 0.17, 24);
  ringGeo.rotateX(-Math.PI / 2);

  const particles = [];
  const starGeo = starGeometry();
  const puffGeo = new THREE.IcosahedronGeometry(0.07, 0);
  // Drawn on top, so a sparkle behind a shelf board still shows.
  const basic = (color) => new THREE.MeshBasicMaterial({ color, depthTest: false, depthWrite: false });
  const starMats = SPARKLE_COLORS.map(basic);
  const puffMat = basic(PUFF_COLOR);

  function spawn(geo, mat, position, { vx, vy, life, size, spin = 0, gravity = 0, drag = 0 }) {
    const m = new THREE.Mesh(geo, mat);
    m.position.copy(position);
    m.renderOrder = 10;
    m.scale.setScalar(size);
    scene.add(m);
    particles.push({ m, vx, vy, life, t: 0, size, spin, gravity, drag });
  }

  return {
    /** Compile the particle shaders up front, so the first sparkle doesn't stutter (~100 ms on a slow phone). */
    warmUp(renderer, camera) {
      const temp = [new THREE.Mesh(starGeo, starMats[0]), new THREE.Mesh(puffGeo, puffMat)];
      scene.add(...temp);
      renderer.compile(scene, camera);
      scene.remove(...temp);
    },

    tapRing(position) {
      const mat = new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, depthWrite: false });
      const m = new THREE.Mesh(ringGeo, mat);
      m.position.copy(position);
      m.position.y += 0.03;
      scene.add(m);
      rings.push({ m, t: 0 });
    },

    /** Little stars bursting out from a point. */
    sparkle(position, { count = 7, spread = 1, life = 0.6 } = {}) {
      for (let i = 0; i < count; i++) {
        const a = (i / count) * Math.PI * 2 + Math.random() * 0.6;
        const speed = (0.6 + Math.random() * 0.6) * spread;
        spawn(starGeo, starMats[i % starMats.length], position, {
          vx: Math.cos(a) * speed, vy: Math.sin(a) * speed + 0.4,
          life: life * (0.7 + Math.random() * 0.5), size: 0.8 + Math.random() * 0.7,
          spin: (Math.random() - 0.5) * 10, drag: 3,
        });
      }
    },

    /** A soft cloud where an empty box used to be. */
    poof(position) {
      // Mostly sideways and down, so the cloud doesn't cover her face.
      const at = position.clone().add(new THREE.Vector3(0, -0.1, 0.15));
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2;
        spawn(puffGeo, puffMat, at, {
          vx: Math.cos(a) * 1.1, vy: Math.sin(a) * 0.35 - 0.1,
          life: 0.4 + Math.random() * 0.15, size: 0.8 + Math.random() * 0.5, drag: 5,
        });
      }
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
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.t += dt;
        const k = p.t / p.life;
        if (k >= 1) {
          scene.remove(p.m);
          particles.splice(i, 1);
          continue;
        }
        const slow = Math.exp(-p.drag * dt);
        p.vx *= slow;
        p.vy = p.vy * slow - p.gravity * dt;
        p.m.position.x += p.vx * dt;
        p.m.position.y += p.vy * dt;
        p.m.rotation.z += p.spin * dt;
        // Pop up quickly, then shrink away.
        const grow = Math.min(1, k * 6), fade = 1 - Math.max(0, (k - 0.4) / 0.6);
        p.m.scale.setScalar(Math.max(0.001, p.size * grow * fade));
      }
    },
  };
}
