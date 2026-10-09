// Confetti over the whole screen for big moments: a new room, a helper, an upgrade, a record day.
// Plain DOM pieces animated with the Web Animations API; they remove themselves when they land.

const COLORS = ['#f27aa8', '#ffd98a', '#c8b6ff', '#9fe0c8', '#bfe3f5', '#ff9ec4'];

export function confetti({ count = 70, duration = 2200 } = {}) {
  const app = document.getElementById('app');
  const layer = document.createElement('div');
  layer.className = 'confetti';
  app.append(layer);
  const w = app.clientWidth, h = app.clientHeight;
  let left = count;
  for (let i = 0; i < count; i++) {
    const el = document.createElement('i');
    el.style.background = COLORS[i % COLORS.length];
    if (i % 3 === 0) el.style.borderRadius = '50%';
    layer.append(el);
    // Burst up from the bottom middle, then flutter down.
    const x0 = w * (0.3 + Math.random() * 0.4), y0 = h * 0.75;
    const x1 = x0 + (Math.random() - 0.5) * w * 1.1, y1 = h * (0.05 + Math.random() * 0.3);
    const x2 = x1 + (Math.random() - 0.5) * 80, y2 = h + 20;
    const spin = (Math.random() - 0.5) * 1440;
    const time = duration * (0.75 + Math.random() * 0.5);
    el.animate([
      { transform: `translate(${x0}px, ${y0}px) rotate(0deg)`, offset: 0, easing: 'cubic-bezier(.15,.7,.4,1)' },
      { transform: `translate(${x1}px, ${y1}px) rotate(${spin / 3}deg)`, offset: 0.25, easing: 'cubic-bezier(.4,0,.8,.6)' },
      { transform: `translate(${x2}px, ${y2}px) rotate(${spin}deg)`, offset: 1 },
    ], { duration: time, easing: 'linear', delay: Math.random() * 120 }).onfinish = () => {
      el.remove();
      if (--left === 0) layer.remove();
    };
  }
}
