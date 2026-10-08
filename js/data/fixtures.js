// Fixtures: furniture placed in rooms. Positions are room-local: x runs across the room
// (-W/2..W/2), z runs from the back wall (-D/2) to the open front (+D/2).
//   size: footprint (w x d) the shopkeeper walks around, plus height (h) for tapping.
//   use:  where the shopkeeper stands to use it (offset from the fixture) and which way she faces
//         (rotation about y; 0 faces the viewer, PI faces the back wall).
//   walkable: decor you can walk over (rugs).

export const FIXTURES = {
  shelf: { name: 'Shelf', size: { w: 1.1, d: 0.42, h: 1.65 }, use: { dx: 0, dz: 0.62, face: Math.PI } },
  counter: { name: 'Counter', size: { w: 0.95, d: 0.5, h: 1.1 }, use: { dx: 0, dz: -0.58, face: 0 } },
  pedestal: { name: 'Dream Dollhouse', size: { w: 0.92, d: 0.92, h: 1.5 }, use: { dx: 0.72, dz: 0, face: -Math.PI / 2 } },
  plant: { name: 'Plant', size: { w: 0.45, d: 0.45, h: 0.95 }, use: { dx: 0, dz: 0.55, face: Math.PI } },
  rug: { name: 'Rug', size: { w: 1.4, d: 1.4, h: 0.02 }, walkable: true },
};
