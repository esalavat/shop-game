import * as THREE from 'three';

const raycaster = new THREE.Raycaster();
const ndc = new THREE.Vector2();

/** First of `objects` under the screen point, or null. */
export function pickAt(camera, element, clientX, clientY, objects) {
  const r = element.getBoundingClientRect();
  ndc.set(((clientX - r.left) / r.width) * 2 - 1, -((clientY - r.top) / r.height) * 2 + 1);
  raycaster.setFromCamera(ndc, camera);
  return raycaster.intersectObjects(objects, false)[0] ?? null;
}
