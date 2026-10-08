// Walking paths inside a room: an occupancy grid over the floor, A* on it, then
// string-pulling so characters walk in straight lines instead of grid staircases.

import { FIXTURES, footprint } from '../data/fixtures.js';
import { ROOM_SIZE } from '../data/rooms.js';

export const CELL = 0.1;
const RADIUS = 0.22;        // character half-width
const FRONT_MARGIN = 0.15;  // keep feet off the very front edge of the floor

export function buildNav(room) {
  const { W, D } = ROOM_SIZE;
  const cols = Math.round(W / CELL), rows = Math.round(D / CELL);
  const blocked = new Uint8Array(cols * rows);
  const solid = room.fixtures
    .filter((f) => !FIXTURES[f.kind].walkable)
    .map((f) => ({ f, s: footprint(f) }));

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const x = -W / 2 + (c + 0.5) * CELL, z = -D / 2 + (r + 0.5) * CELL;
      const outside = x < -W / 2 + RADIUS || x > W / 2 - RADIUS || z < -D / 2 + RADIUS || z > D / 2 - FRONT_MARGIN;
      const inFixture = solid.some(({ f, s }) => Math.abs(x - f.x) < s.hw + RADIUS && Math.abs(z - f.z) < s.hd + RADIUS);
      if (outside || inFixture) blocked[r * cols + c] = 1;
    }
  }
  return { cols, rows, blocked, W, D };
}

const cellOf = (nav, x, z) => {
  const c = Math.min(nav.cols - 1, Math.max(0, Math.floor((x + nav.W / 2) / CELL)));
  const r = Math.min(nav.rows - 1, Math.max(0, Math.floor((z + nav.D / 2) / CELL)));
  return r * nav.cols + c;
};
const centerOf = (nav, i) => ({
  x: -nav.W / 2 + ((i % nav.cols) + 0.5) * CELL,
  z: -nav.D / 2 + (Math.floor(i / nav.cols) + 0.5) * CELL,
});
export const isFree = (nav, x, z) => !nav.blocked[cellOf(nav, x, z)];

/** Nearest walkable cell to i (breadth-first), or -1 if the room is full. */
function nearestFree(nav, i) {
  if (!nav.blocked[i]) return i;
  const seen = new Uint8Array(nav.blocked.length);
  const queue = [i];
  seen[i] = 1;
  while (queue.length) {
    const cur = queue.shift();
    if (!nav.blocked[cur]) return cur;
    for (const n of neighbors(nav, cur, true)) if (!seen[n.i]) { seen[n.i] = 1; queue.push(n.i); }
  }
  return -1;
}

function* neighbors(nav, i, ignoreBlocked = false) {
  const c = i % nav.cols, r = Math.floor(i / nav.cols);
  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      if (!dr && !dc) continue;
      const nc = c + dc, nr = r + dr;
      if (nc < 0 || nr < 0 || nc >= nav.cols || nr >= nav.rows) continue;
      const ni = nr * nav.cols + nc;
      if (!ignoreBlocked) {
        if (nav.blocked[ni]) continue;
        // No cutting corners past furniture.
        if (dr && dc && (nav.blocked[r * nav.cols + nc] || nav.blocked[nr * nav.cols + c])) continue;
      }
      yield { i: ni, cost: dr && dc ? Math.SQRT2 : 1 };
    }
  }
}

function lineOfSight(nav, a, b) {
  const steps = Math.ceil(Math.hypot(b.x - a.x, b.z - a.z) / (CELL / 2));
  for (let s = 1; s < steps; s++) {
    const t = s / steps;
    if (!isFree(nav, a.x + (b.x - a.x) * t, a.z + (b.z - a.z) * t)) return false;
  }
  return true;
}

/**
 * Path from `from` to `to` (room-local {x, z}), as waypoints excluding the start.
 * Targets inside furniture snap to the nearest walkable spot. Returns null if unreachable.
 */
export function findPath(nav, from, to) {
  const start = nearestFree(nav, cellOf(nav, from.x, from.z));
  const goalCell = cellOf(nav, to.x, to.z);
  const goal = nearestFree(nav, goalCell);
  if (start < 0 || goal < 0) return null;
  const end = goal === goalCell ? { x: to.x, z: to.z } : centerOf(nav, goal);

  const n = nav.blocked.length;
  const g = new Float32Array(n).fill(Infinity);
  const came = new Int32Array(n).fill(-1);
  const closed = new Uint8Array(n);
  const h = (i) => {
    const dc = Math.abs((i % nav.cols) - (goal % nav.cols));
    const dr = Math.abs(Math.floor(i / nav.cols) - Math.floor(goal / nav.cols));
    return Math.max(dc, dr) + (Math.SQRT2 - 1) * Math.min(dc, dr);
  };
  const open = [start];
  g[start] = 0;
  while (open.length) {
    let best = 0;
    for (let k = 1; k < open.length; k++) if (g[open[k]] + h(open[k]) < g[open[best]] + h(open[best])) best = k;
    const cur = open.splice(best, 1)[0];
    if (cur === goal) break;
    closed[cur] = 1;
    for (const nb of neighbors(nav, cur)) {
      if (closed[nb.i]) continue;
      const cost = g[cur] + nb.cost;
      if (cost < g[nb.i]) {
        if (g[nb.i] === Infinity) open.push(nb.i);
        g[nb.i] = cost;
        came[nb.i] = cur;
      }
    }
  }
  if (goal !== start && came[goal] < 0) return null;

  const cells = [];
  for (let i = goal; i !== start; i = came[i]) cells.unshift(centerOf(nav, i));
  const raw = [...cells.slice(0, -1), end];

  // String-pull: from each point, skip ahead to the farthest point still in straight sight.
  const path = [];
  let cur = { x: from.x, z: from.z };
  if (!isFree(nav, cur.x, cur.z)) cur = centerOf(nav, start);
  let i = 0;
  while (i < raw.length) {
    let j = raw.length - 1;
    while (j > i && !lineOfSight(nav, cur, raw[j])) j--;
    path.push(raw[j]);
    cur = raw[j];
    i = j + 1;
  }
  return path;
}
