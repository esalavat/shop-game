// Pointer events -> tap / drag / pinch / wheel gestures. Works for touch and mouse.

const TAP_MAX_MOVE = 8;   // px
const TAP_MAX_MS = 400;

export function attachGestures(el, { onTap, onDrag, onPinch, onWheel }) {
  const pointers = new Map();
  let moved = 0, downAt = 0, pinchDist = 0;

  const distance = () => {
    const [a, b] = [...pointers.values()];
    return Math.hypot(a.x - b.x, a.y - b.y);
  };

  el.addEventListener('pointerdown', (e) => {
    el.setPointerCapture(e.pointerId);
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.size === 1) { moved = 0; downAt = performance.now(); }
    if (pointers.size === 2) pinchDist = distance();
  });

  el.addEventListener('pointermove', (e) => {
    const p = pointers.get(e.pointerId);
    if (!p) return;
    const dx = e.clientX - p.x, dy = e.clientY - p.y;
    p.x = e.clientX;
    p.y = e.clientY;
    if (pointers.size === 1) {
      moved += Math.abs(dx) + Math.abs(dy);
      onDrag?.(dx, dy);
    } else if (pointers.size === 2) {
      moved = Infinity;
      const d = distance();
      if (pinchDist > 0) onPinch?.(d / pinchDist);
      pinchDist = d;
    }
  });

  el.addEventListener('pointerup', (e) => {
    if (pointers.size === 1 && moved < TAP_MAX_MOVE && performance.now() - downAt < TAP_MAX_MS) {
      onTap?.(e.clientX, e.clientY);
    }
    pointers.delete(e.pointerId);
  });
  el.addEventListener('pointercancel', (e) => pointers.delete(e.pointerId));

  el.addEventListener('wheel', (e) => {
    e.preventDefault();
    onWheel?.(e.deltaY);
  }, { passive: false });
}
