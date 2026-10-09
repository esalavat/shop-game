// Keeps the frame rate up on slower phones: if it stays under TARGET_FPS, render at a lower pixel
// ratio (fewer pixels to shade). It only ever steps down, so it can't flip back and forth.

const TARGET_FPS = 50;
const WINDOW = 2;       // seconds per measurement
const WARMUP = 4;       // seconds to ignore after loading (shaders compiling, textures uploading)
const SLOW_WINDOWS = 2; // slow windows in a row before stepping down
const STEPS = [2, 1.5, 1.25];

export function createQuality(renderer, onChange) {
  const device = Math.min(globalThis.devicePixelRatio ?? 1, STEPS[0]);
  const steps = [device, ...STEPS.filter((r) => r < device)];
  let level = 0, frames = 0, time = 0, warm = 0, slow = 0, hitch = false, fps = 0;

  return {
    get pixelRatio() { return steps[level]; },
    get fps() { return fps; },

    frame(dt) {
      if (warm < WARMUP) { warm += dt; return; }
      frames++;
      time += dt;
      if (dt >= 0.25) hitch = true; // the tab was hidden or the phone stalled: don't count it
      if (time < WINDOW) return;
      fps = frames / time;
      if (!hitch) slow = fps < TARGET_FPS ? slow + 1 : 0;
      frames = time = 0;
      hitch = false;
      if (slow >= SLOW_WINDOWS && level < steps.length - 1) {
        level++;
        slow = 0;
        onChange(steps[level]);
      }
    },
  };
}
