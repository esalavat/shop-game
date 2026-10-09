// Bonus spots (GDD #41, #44): where the shopkeeper can stand for a bonus (the greeter spot by the
// shop door, the show-off spot beside the Dream Dollhouse). Each has a soft ring on the ground, which
// stays lit under her feet while the bonus is on, plus a bobbing icon just above it while she's
// elsewhere (the camera is nearly level, so a ring alone is hard to see). `markers()` gives the icons'
// positions for the DOM overlay; a tap target (`userData.spot`) around each spot sends her there.
// The show-off spot only appears once something is on show in the dollhouse (no Sparkle, no bonus).

import * as THREE from 'three';
import { GREETER, SHOWOFF, groundAt, shopRoom } from '../../sim/route.js';
import { keeperGreeting } from '../../sim/keeper.js';
import { displayRoom } from '../../sim/collection.js';

const SPOTS = {
  greeter: { color: '#ff9ec4', icon: '👋' },
  showoff: { color: '#ffd98a', icon: '✨' },
};
const ICON_HEIGHT = 0.15; // how far above the ground the icon floats
const ringGeo = new THREE.RingGeometry(0.2, 0.27, 28);
const dotGeo = new THREE.CircleGeometry(0.2, 28);
const hitGeo = new THREE.BoxGeometry(0.6, 0.8, 0.6); // covers the ring and the icon above it

export function createSpotsView(state, roomOrigin) {
  const group = new THREE.Group();
  const hitTargets = [];
  let spots = []; // { id, ring, dot, hit, icon, active(), shown() }
  let t = 0;

  function add(id, roomId, local, active, shown = () => true) {
    const o = roomOrigin(roomId);
    const y = o.y + groundAt(local.z) + 0.02;
    const color = SPOTS[id].color;
    const ring = new THREE.Mesh(ringGeo, new THREE.MeshBasicMaterial({ color, transparent: true, depthWrite: false }));
    const dot = new THREE.Mesh(dotGeo, new THREE.MeshBasicMaterial({ color, transparent: true, depthWrite: false }));
    const hit = new THREE.Mesh(hitGeo, new THREE.MeshBasicMaterial({ visible: false }));
    for (const m of [ring, dot]) {
      m.rotation.x = -Math.PI / 2;
      m.position.set(o.x + local.x, y, o.z + local.z);
    }
    hit.position.set(o.x + local.x, y + 0.4, o.z + local.z);
    hit.userData = { spot: id };
    group.add(ring, dot, hit);
    spots.push({ id, ring, dot, hit, active, shown, icon: new THREE.Vector3(o.x + local.x, y + ICON_HEIGHT, o.z + local.z) });
  }

  return {
    group,
    hitTargets,

    /** Rebuild when the building changes (the show-off spot appears with the Window Display). */
    rebuild() {
      for (const s of spots) for (const m of [s.ring, s.dot]) m.material.dispose();
      group.clear();
      spots = [];
      add('greeter', shopRoom(state).id, GREETER, () => keeperGreeting(state));
      const display = displayRoom(state);
      if (display?.floor === 0) {
        add('showoff', display.id, SHOWOFF, () => state.keeper.roomId === display.id && !state.keeper.path.length, () => state.sparkle > 0);
      }
    },

    /** Icons to float over spots she isn't standing on: [{ id, icon, position }]. */
    markers() {
      return spots.filter((s) => s.shown() && !s.active()).map((s) => ({ id: s.id, icon: SPOTS[s.id].icon, position: s.icon }));
    },

    update(dt) {
      t += dt;
      const breathe = 0.5 + 0.5 * Math.sin(t * 2.4);
      hitTargets.length = 0;
      for (const s of spots) {
        const shown = s.shown(), on = s.active();
        s.ring.visible = s.dot.visible = shown;
        if (shown && !on) hitTargets.push(s.hit); // while she's on it, taps reach her instead
        s.ring.material.opacity = on ? 0.95 : 0.45 + 0.35 * breathe;
        s.ring.scale.setScalar(on ? 1.15 : 1 + 0.08 * breathe);
        s.dot.material.opacity = on ? 0.45 : 0.12 + 0.1 * breathe;
      }
    },
  };
}
