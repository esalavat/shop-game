// Keeps people from walking through each other. After everyone moves, anyone who is walking and
// overlaps someone gets nudged aside, with a sideways component so they slide around rather than
// stall head-on. People standing still are never pushed (they're at a shelf, in line, or serving).

import { isFree } from './nav.js';

const PERSONAL_SPACE = 0.42; // centre-to-centre distance two people keep

export function separate(state, navs) {
  const people = [state.keeper, ...state.customers];
  for (let i = 0; i < people.length; i++) {
    for (let j = i + 1; j < people.length; j++) {
      const a = people[i], b = people[j];
      if (a.roomId !== b.roomId) continue;
      const aMoving = a.path.length > 0, bMoving = b.path.length > 0;
      if (!aMoving && !bMoving) continue;
      let dx = a.x - b.x, dz = a.z - b.z;
      const d = Math.hypot(dx, dz);
      if (d >= PERSONAL_SPACE) continue;
      if (d < 1e-4) { dx = 1; dz = 0; } else { dx /= d; dz /= d; }
      const overlap = PERSONAL_SPACE - d;
      const nav = navs.get(a.roomId);
      const share = aMoving && bMoving ? 0.5 : 1;
      if (aMoving) nudge(a, dx, dz, overlap * share, nav);
      if (bMoving) nudge(b, -dx, -dz, overlap * share, nav);
    }
  }
}

/** Push `p` away along (nx, nz), blended with a sidestep across its walking direction. */
function nudge(p, nx, nz, amount, nav) {
  let tx = Math.cos(p.facing), tz = -Math.sin(p.facing); // perpendicular to the way they face
  if (tx * nx + tz * nz < 0) { tx = -tx; tz = -tz; }
  let px = nx + tx, pz = nz + tz;
  const len = Math.hypot(px, pz) || 1;
  px = (px / len) * amount;
  pz = (pz / len) * amount;
  const x = p.x + px, z = p.z + pz;
  if (nav && isFree(nav, x, z)) { p.x = x; p.z = z; }
}
