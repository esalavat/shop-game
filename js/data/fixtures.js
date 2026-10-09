// Fixtures: furniture placed in rooms. Positions are room-local: x runs across the room
// (-W/2..W/2), z runs from the back wall (-D/2) to the open front (+D/2).
//   size: footprint (w x d) the shopkeeper walks around, plus height (h) for tapping.
//   use:  where the shopkeeper stands to use it (offset from the fixture) and which way she faces
//         (rotation about y; 0 faces the viewer, PI faces the back wall).
//   walkable: decor you can walk over (rugs).
//   A placed fixture may have `rot` (a multiple of PI/2) to turn it; footprint() and useSpot()
//   account for it.
//   slots / fillOrder: item spots (shelves). Slot i is board floor(i/3), column i%3;
//                     new stock fills the middle board first, then top, then bottom.

export const FIXTURES = {
  shelf: {
    name: 'Shelf', size: { w: 1.1, d: 0.42, h: 1.65 }, use: { dx: 0, dz: 0.62, face: Math.PI },
    slots: 9, fillOrder: [3, 4, 5, 6, 7, 8, 0, 1, 2],
  },
  // The shopkeeper stands behind it, turned a little toward customers at its right end.
  counter: { name: 'Counter', size: { w: 0.95, d: 0.5, h: 0.85 }, use: { dx: 0, dz: -0.52, face: Math.PI / 6 } },
  pedestal: { name: 'Dream Dollhouse', size: { w: 0.92, d: 0.92, h: 1.5 }, use: { dx: -0.72, dz: 0, face: Math.PI / 2 } },
  plant: { name: 'Plant', size: { w: 0.45, d: 0.45, h: 0.95 }, use: { dx: 0, dz: 0.55, face: Math.PI } },
  rug: { name: 'Rug', size: { w: 1.4, d: 1.4, h: 0.02 }, walkable: true },
  // The Stairwell's spiral staircase (GDD #58), and the hole it comes up through upstairs (with a railing).
  // Nobody walks on them through the walk grid: the stairs are a path of their own (sim/route.js).
  stairs: { name: 'Stairs', size: { w: 1.2, d: 1.2, h: 2.6 } },
  stairhole: { name: 'Stairs', size: { w: 1.2, d: 1.2, h: 0.8 } },
};

/** Rotate a fixture-local offset into room space (same convention as Object3D.rotation.y). */
export function rotateOffset(dx, dz, rot = 0) {
  const c = Math.cos(rot), s = Math.sin(rot);
  return { x: dx * c + dz * s, z: -dx * s + dz * c };
}

/** Floor footprint of a placed fixture as half-extents in room space. */
export function footprint(f) {
  const { w, d } = FIXTURES[f.kind].size;
  const turned = Math.round((f.rot ?? 0) / (Math.PI / 2)) % 2 !== 0;
  return turned ? { hw: d / 2, hd: w / 2 } : { hw: w / 2, hd: d / 2 };
}

/** Where (and facing which way) someone stands to use a placed fixture, or null. */
export function useSpot(f) {
  const use = FIXTURES[f.kind].use;
  if (!use) return null;
  const o = rotateOffset(use.dx, use.dz, f.rot);
  return { x: f.x + o.x, z: f.z + o.z, face: use.face + (f.rot ?? 0) };
}
