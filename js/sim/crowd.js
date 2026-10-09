// Keeps people from walking through each other. After everyone moves, anyone who is walking and
// overlaps someone gets nudged aside, with a sideways component so they slide around rather than
// stall head-on. People standing still are never pushed (they're at a shelf, in line, or serving).
//
// Never a deadlock: someone walking whose way is blocked (a person standing right on their route
// keeps pushing them back) stops being pushed for a moment once they've made no progress for a
// little while, and slips past. Without this, a customer heading for their place in line could be
// stuck behind the line forever, and the shop could never close (docs/ISSUES.md).

import { isFree } from './nav.js';

const PERSONAL_SPACE = 0.42; // centre-to-centre distance two people keep
const STALL_TICKS = 8;       // ticks without getting closer to where they're going...
const SLIP_TICKS = 15;       // ...then this many ticks of walking through people

/** Per person, while walking: { target, dist, stall, slip }. Kept out of state, so nothing new is saved. */
const progress = new WeakMap();

function slipping(p) {
  if (!p.path.length) { progress.delete(p); return false; }
  const next = p.path[0];
  const dist = Math.hypot(next.x - p.x, next.z - p.z);
  let g = progress.get(p);
  if (!g || g.target !== next) { // a new walk, or the next corner of it
    g = { target: next, dist, stall: 0, slip: 0 };
    progress.set(p, g);
    return false;
  }
  if (g.slip > 0) { g.slip--; g.dist = dist; return true; }
  if (dist < g.dist - 0.01) { g.stall = 0; g.dist = dist; return false; }
  if (++g.stall >= STALL_TICKS) { g.stall = 0; g.slip = SLIP_TICKS; g.dist = dist; return true; }
  return false;
}

export function separate(state, navs) {
  const people = [state.keeper, ...state.customers];
  if (state.stocker) people.push(state.stocker);
  const slip = new Set(people.filter(slipping));
  for (let i = 0; i < people.length; i++) {
    for (let j = i + 1; j < people.length; j++) {
      const a = people[i], b = people[j];
      if (a.roomId !== b.roomId) continue;
      const aMoving = a.path.length > 0 && !slip.has(a), bMoving = b.path.length > 0 && !slip.has(b);
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
