// Orthographic "diorama" camera rig: frames a room or the whole building in portrait,
// with smoothed pan / zoom and a gentle idle sway.

import * as THREE from 'three';

const PITCH = THREE.MathUtils.degToRad(9);
const DISTANCE = 40;
const ZOOM_MIN = 0.6, ZOOM_MAX = 2.5;

export class CameraRig {
  constructor() {
    this.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 120);
    this.aspect = 1;
    this.target = { cx: 0, cy: 0, w: 1, h: 1, zoom: 1 };
    this.view = { ...this.target };
    this.limits = { minX: -Infinity, maxX: Infinity, minY: -Infinity, maxY: Infinity };
    this.halfH = 1;
    this._center = new THREE.Vector3();
    this._dir = new THREE.Vector3();
  }

  setLimits(limits) {
    this.limits = limits;
    this._clamp();
  }

  /** Fit a w x h area centered on (cx, cy) to the screen. */
  frame(cx, cy, w, h, instant = false) {
    Object.assign(this.target, { cx, cy, w, h, zoom: 1 });
    this._clamp();
    if (instant) Object.assign(this.view, this.target);
  }

  /** Pan by a screen-space drag in pixels. Follows the finger exactly (no smoothing). */
  pan(dxPx, dyPx, viewportHeightPx) {
    const s = (2 * this.halfH) / viewportHeightPx;
    this.target.cx -= dxPx * s;
    this.target.cy += dyPx * s;
    this._clamp();
    this.view.cx = this.target.cx;
    this.view.cy = this.target.cy;
  }

  zoomBy(factor) {
    this.target.zoom *= factor;
    this._clamp();
  }

  resize(aspect) {
    this.aspect = aspect;
  }

  update(dt, time) {
    const k = 1 - Math.exp(-dt * 7);
    for (const key of ['cx', 'cy', 'w', 'h', 'zoom']) this.view[key] += (this.target[key] - this.view[key]) * k;
    const v = this.view;
    this.halfH = Math.max(v.h / 2, v.w / 2 / this.aspect) / v.zoom;

    const yaw = THREE.MathUtils.degToRad(Math.sin(time * 0.4) * 0.6);
    const pitch = PITCH + THREE.MathUtils.degToRad(Math.sin(time * 0.31) * 0.3);
    this._dir.set(Math.sin(yaw) * Math.cos(pitch), Math.sin(pitch), Math.cos(yaw) * Math.cos(pitch));
    this._center.set(v.cx, v.cy, 0.3);

    const cam = this.camera;
    cam.top = this.halfH;
    cam.bottom = -this.halfH;
    cam.left = -this.halfH * this.aspect;
    cam.right = this.halfH * this.aspect;
    cam.position.copy(this._center).addScaledVector(this._dir, DISTANCE);
    cam.lookAt(this._center);
    cam.updateProjectionMatrix();
  }

  _clamp() {
    const t = this.target, L = this.limits;
    t.cx = THREE.MathUtils.clamp(t.cx, L.minX, L.maxX);
    t.cy = THREE.MathUtils.clamp(t.cy, L.minY, L.maxY);
    t.zoom = THREE.MathUtils.clamp(t.zoom, ZOOM_MIN, ZOOM_MAX);
  }
}
