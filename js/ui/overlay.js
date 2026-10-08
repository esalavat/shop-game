// HTML bits pinned to 3D positions: speech bubbles above heads and "+12 🪙" pop-ups that float away.

import * as THREE from 'three';

const FLOAT_TIME = 1.1;   // seconds a pop-up floats
const FLOAT_RISE = 46;    // pixels it rises

export function createOverlay(canvas, getCamera) {
  const root = document.getElementById('overlay');
  const bubbles = new Map(); // key -> { el, pos: () => Vector3|null }
  const floaters = [];
  const v = new THREE.Vector3();

  function toScreen(world) {
    v.copy(world).project(getCamera());
    return { x: (v.x * 0.5 + 0.5) * canvas.clientWidth, y: (-v.y * 0.5 + 0.5) * canvas.clientHeight, behind: v.z > 1 };
  }

  function place(el, world, dy = 0) {
    const s = toScreen(world);
    el.style.transform = `translate(${s.x}px, ${s.y + dy}px) translate(-50%, -100%)`;
    el.style.visibility = s.behind ? 'hidden' : '';
  }

  return {
    /** Show (or update) a bubble that follows `pos()`. `html` is trusted markup built by the game. */
    bubble(key, pos, html, cls = '') {
      let b = bubbles.get(key);
      if (!b) {
        const el = document.createElement('div');
        root.append(el);
        b = { el, html: null };
        bubbles.set(key, b);
      }
      b.pos = pos;
      if (b.html !== html) { b.el.innerHTML = html; b.html = html; }
      b.el.className = `bubble ${cls}`;
    },

    removeBubble(key) {
      const b = bubbles.get(key);
      if (!b) return;
      b.el.remove();
      bubbles.delete(key);
    },

    hasBubble: (key) => bubbles.has(key),

    /** A short text that pops at a world position and floats up. */
    float(world, text, cls = '') {
      const el = document.createElement('div');
      el.className = `floater ${cls}`;
      el.textContent = text;
      root.append(el);
      floaters.push({ el, world: world.clone(), t: 0 });
    },

    update(dt) {
      for (const [key, b] of bubbles) {
        const p = b.pos();
        if (!p) { b.el.remove(); bubbles.delete(key); continue; }
        place(b.el, p);
      }
      for (let i = floaters.length - 1; i >= 0; i--) {
        const f = floaters[i];
        f.t += dt;
        const p = f.t / FLOAT_TIME;
        place(f.el, f.world, -p * FLOAT_RISE);
        f.el.style.opacity = String(p < 0.6 ? 1 : 1 - (p - 0.6) / 0.4);
        if (p >= 1) { f.el.remove(); floaters.splice(i, 1); }
      }
    },
  };
}
