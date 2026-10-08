// Renders each item model once into a small transparent PNG for the UI (order book, Collection).

import * as THREE from 'three';
import { buildItem } from './models/items.js';

const SIZE = 160;

export function makeThumbnails(renderer, itemIds) {
  const scene = new THREE.Scene();
  scene.add(new THREE.HemisphereLight('#fff4e6', '#d9b8e8', 1.2));
  const sun = new THREE.DirectionalLight('#fff3df', 2.4);
  sun.position.set(-1, 2, 3);
  scene.add(sun);

  const camera = new THREE.PerspectiveCamera(30, 1, 0.01, 10);
  const target = new THREE.WebGLRenderTarget(SIZE, SIZE, { samples: 4 });
  target.texture.colorSpace = THREE.SRGBColorSpace;
  const pixels = new Uint8Array(SIZE * SIZE * 4);
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = SIZE;
  const ctx = canvas.getContext('2d');
  const image = ctx.createImageData(SIZE, SIZE);

  const prevClear = renderer.getClearColor(new THREE.Color());
  const prevAlpha = renderer.getClearAlpha();
  renderer.setClearColor(0x000000, 0);

  const out = new Map();
  for (const id of itemIds) {
    const model = buildItem(id);
    model.rotation.y = -0.45;
    scene.add(model);
    const bounds = new THREE.Box3().setFromObject(model);
    const center = bounds.getCenter(new THREE.Vector3());
    const radius = bounds.getSize(new THREE.Vector3()).length() / 2;
    const dist = radius / Math.sin(THREE.MathUtils.degToRad(camera.fov / 2)) * 0.95;
    camera.position.set(center.x, center.y + dist * 0.35, center.z + dist);
    camera.lookAt(center);

    renderer.setRenderTarget(target);
    renderer.clear();
    renderer.render(scene, camera);
    renderer.readRenderTargetPixels(target, 0, 0, SIZE, SIZE, pixels);
    // WebGL rows are bottom-up; canvas rows are top-down.
    for (let y = 0; y < SIZE; y++) {
      image.data.set(pixels.subarray((SIZE - 1 - y) * SIZE * 4, (SIZE - y) * SIZE * 4), y * SIZE * 4);
    }
    ctx.putImageData(image, 0, 0);
    out.set(id, canvas.toDataURL());
    scene.remove(model);
  }

  renderer.setRenderTarget(null);
  renderer.setClearColor(prevClear, prevAlpha);
  target.dispose();
  return out;
}
