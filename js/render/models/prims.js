// Low-poly primitive helpers. Each adds a shadow-casting mesh to `parent` and returns it.
// `mat` is a palette color string (cached toon material) or a Material.

import * as THREE from 'three';
import { toon } from '../toon.js';

export function mesh(parent, geo, mat, x = 0, y = 0, z = 0) {
  const m = new THREE.Mesh(geo, typeof mat === 'string' ? toon(mat) : mat);
  m.position.set(x, y, z);
  m.castShadow = m.receiveShadow = true;
  parent.add(m);
  return m;
}

export const box = (parent, w, h, d, mat, x, y, z) => mesh(parent, new THREE.BoxGeometry(w, h, d), mat, x, y, z);
export const cyl = (parent, rTop, rBottom, h, segments, mat, x, y, z) =>
  mesh(parent, new THREE.CylinderGeometry(rTop, rBottom, h, segments), mat, x, y, z);
export const ball = (parent, r, mat, x, y, z, detail = 1) => mesh(parent, new THREE.IcosahedronGeometry(r, detail), mat, x, y, z);

/** Triangular prism (roofs): base on y=0, apex at y=h, centered in x and z. */
export function prism(parent, w, h, d, mat) {
  const s = new THREE.Shape();
  s.moveTo(-w / 2, 0);
  s.lineTo(w / 2, 0);
  s.lineTo(0, h);
  s.closePath();
  const g = new THREE.ExtrudeGeometry(s, { depth: d, bevelEnabled: false });
  g.translate(0, 0, -d / 2);
  return mesh(parent, g, mat);
}

export function disposeTree(obj) {
  obj.traverse((o) => {
    o.geometry?.dispose();
    if (o.material?.map && !o.material.map.userData.keep) o.material.map.dispose(); // shared pattern textures stay
  });
}
