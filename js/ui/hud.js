// Top HUD: coins, Hearts, Sparkle, and the day label with a bar showing how far through the
// open hours (or the evening) we are. Pops a counter when it goes up. The 🔊 button mutes
// sounds and vibration.

import { phaseProgress } from '../sim/day.js';

const PHASE_NAMES = { morning: 'Morning', open: 'Open', evening: 'Evening', close: 'Closing time' };
const fmt = new Intl.NumberFormat();

export function createHud(state, audio) {
  const counters = ['coins', 'hearts', 'sparkle'].map((key) => ({
    key,
    el: document.querySelector(`#hud-${key} b`),
    shown: null,
  }));
  const dayEl = document.getElementById('hud-day');
  const bar = document.querySelector('.day-bar');
  const fill = document.getElementById('hud-day-fill');
  let dayText = '', fillPct = -1;

  const mute = document.getElementById('btn-mute');
  const showMute = () => {
    mute.textContent = audio.muted ? '🔇' : '🔊';
    mute.setAttribute('aria-pressed', String(audio.muted));
    mute.setAttribute('aria-label', audio.muted ? 'Sound off' : 'Sound on');
  };
  mute.addEventListener('click', () => {
    audio.setMuted(!audio.muted);
    showMute();
    audio.play('pop'); // only heard when turning sound back on
  });
  showMute();

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
      if (text !== dayText) {
        dayEl.textContent = dayText = text;
        bar.hidden = state.day.phase === 'morning' || state.day.phase === 'close';
      }
      const pct = Math.round(phaseProgress(state.day) * 100);
      if (pct !== fillPct) fill.style.width = `${(fillPct = pct)}%`;
    },
  };
}
