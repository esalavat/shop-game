// Top HUD: coins, Hearts, Sparkle, and the day label. Pops a counter when it goes up.

const PHASE_NAMES = { morning: 'Morning', open: 'Open', evening: 'Evening', close: 'Closing time' };
const fmt = new Intl.NumberFormat();

export function createHud(state) {
  const counters = ['coins', 'hearts', 'sparkle'].map((key) => ({
    key,
    el: document.querySelector(`#hud-${key} b`),
    shown: null,
  }));
  const dayEl = document.getElementById('hud-day');
  let dayText = '';

  for (const c of counters) {
    c.el.parentElement.addEventListener('animationend', () => c.el.parentElement.classList.remove('pop'));
  }

  return {
    update() {
      for (const c of counters) {
        const value = state[c.key];
        if (value === c.shown) continue;
        if (c.shown !== null && value > c.shown) c.el.parentElement.classList.add('pop');
        c.el.textContent = fmt.format(value);
        c.shown = value;
      }
      const text = `Day ${state.day.number} · ${PHASE_NAMES[state.day.phase]}`;
      if (text !== dayText) dayEl.textContent = dayText = text;
    },
  };
}
