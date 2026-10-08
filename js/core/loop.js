// Fixed-step simulation + per-frame rendering.
// The sim ticks at a steady rate for deterministic logic; rendering runs every animation frame.
// requestAnimationFrame already stops while the tab is hidden; the dt cap stops a huge
// catch-up burst when it comes back (offline time is handled separately by the sim).

export function startLoop({ tickRate = 10, tick, frame }) {
  const step = 1 / tickRate;
  let acc = 0;
  let last = performance.now();
  let elapsed = 0;

  function onFrame(now) {
    const dt = Math.min((now - last) / 1000, 0.25);
    last = now;
    elapsed += dt;
    acc += dt;
    while (acc >= step) {
      tick(step);
      acc -= step;
    }
    frame(dt, elapsed);
    requestAnimationFrame(onFrame);
  }

  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) last = performance.now();
  });
  requestAnimationFrame(onFrame);
}
