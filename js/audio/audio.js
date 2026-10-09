// Sound effects, synthesized with Web Audio (no sound files), plus light haptics (GDD #46-47).
// The AudioContext starts on the first tap (phones only allow sound after a user gesture).
// `state.settings.muted` silences both sounds and vibration.

const MASTER = 0.5;
const MIN_GAP = 0.04; // seconds: the same sound won't stack up faster than this

// Note frequencies (Hz) for the little tunes.
const N = { C5: 523.3, D5: 587.3, E5: 659.3, G5: 784, A5: 880, C6: 1046.5, D6: 1174.7, E6: 1318.5, G6: 1568, C7: 2093 };

export function createAudio(state) {
  let ctx = null, master = null, noise = null;
  const lastPlayed = new Map();

  function init() {
    if (ctx) return;
    const AC = globalThis.AudioContext ?? globalThis.webkitAudioContext;
    if (!AC) return;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = MASTER;
    const comp = ctx.createDynamicsCompressor(); // keeps stacked sounds from clipping
    master.connect(comp).connect(ctx.destination);
    // One second of white noise, shared by every "cha" and "poof".
    noise = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    const data = noise.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  }

  /** A single note with a quick attack and exponential decay. `at` is seconds from now. */
  function tone(freq, { at = 0, dur = 0.15, type = 'sine', vol = 0.3, slide = 0, attack = 0.005 } = {}) {
    const t = ctx.currentTime + at;
    const osc = ctx.createOscillator(), g = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);
    if (slide) osc.frequency.exponentialRampToValueAtTime(freq * slide, t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(g).connect(master);
    osc.start(t);
    osc.stop(t + dur + 0.02);
  }

  /** A bell: a sine plus a few inharmonic partials that die away faster. */
  function bell(freq, { at = 0, dur = 0.6, vol = 0.18 } = {}) {
    tone(freq, { at, dur, vol });
    tone(freq * 2.76, { at, dur: dur * 0.5, vol: vol * 0.35 });
    tone(freq * 5.4, { at, dur: dur * 0.25, vol: vol * 0.15 });
  }

  /** Filtered noise: a "cha", a "poof", a "whoosh". */
  function hiss({ at = 0, dur = 0.1, vol = 0.2, freq = 4000, q = 1, type = 'bandpass' } = {}) {
    const t = ctx.currentTime + at;
    const src = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
    src.buffer = noise;
    f.type = type;
    f.frequency.value = freq;
    f.Q.value = q;
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(f).connect(g).connect(master);
    src.start(t, Math.random() * 0.5);
    src.stop(t + dur + 0.02);
  }

  const SOUNDS = {
    tap: () => tone(900, { dur: 0.05, vol: 0.08, slide: 0.7 }),
    pop: (pitch = 1) => tone(520 * pitch, { dur: 0.12, vol: 0.25, slide: 1.9 }),
    land: (step = 0) => { // items landing on a shelf climb a little scale
      const f = [N.C6, N.D6, N.E6, N.G6, N.C7][Math.min(step, 4)];
      tone(f, { dur: 0.12, vol: 0.12, type: 'triangle' });
    },
    lift: () => tone(300, { dur: 0.14, vol: 0.2, slide: 1.6, type: 'triangle' }),
    poof: () => { hiss({ dur: 0.25, vol: 0.25, freq: 900, q: 0.7 }); tone(240, { dur: 0.15, vol: 0.12, slide: 0.6 }); },
    boop: () => { tone(330, { dur: 0.12, vol: 0.18, type: 'triangle', slide: 0.85 }); tone(260, { at: 0.1, dur: 0.16, vol: 0.18, type: 'triangle', slide: 0.85 }); },
    beep: () => tone(1760, { dur: 0.08, vol: 0.09, type: 'square' }),
    chaching: () => {
      hiss({ dur: 0.07, vol: 0.3, freq: 5000, q: 0.8 });
      hiss({ at: 0.08, dur: 0.06, vol: 0.25, freq: 6000, q: 0.8 });
      bell(N.C7, { at: 0.13, dur: 0.7, vol: 0.16 });
      bell(N.G6, { at: 0.13, dur: 0.5, vol: 0.1 });
    },
    bell: () => { bell(N.E6, { dur: 0.7, vol: 0.13 }); bell(N.C6, { at: 0.16, dur: 0.9, vol: 0.13 }); },
    hi: () => { tone(N.G5, { dur: 0.1, vol: 0.12, type: 'triangle' }); tone(N.C6, { at: 0.09, dur: 0.16, vol: 0.12, type: 'triangle' }); },
    wish: () => tone(N.A5, { dur: 0.25, vol: 0.07, slide: 1.12 }),
    sparkle: () => [N.C6, N.E6, N.G6, N.C7].forEach((f, i) => bell(f, { at: i * 0.055, dur: 0.35, vol: 0.07 })),
    twinkle: () => { bell(N.G6, { dur: 0.3, vol: 0.05 }); bell(N.C7, { at: 0.07, dur: 0.35, vol: 0.05 }); },
    fanfare: () => {
      [N.C5, N.E5, N.G5].forEach((f, i) => tone(f, { at: i * 0.1, dur: 0.18, vol: 0.16, type: 'triangle' }));
      [N.C6, N.E5, N.G5].forEach((f) => tone(f, { at: 0.32, dur: 0.6, vol: 0.12, type: 'triangle' }));
      [N.C7, N.G6, N.E6].forEach((f, i) => bell(f, { at: 0.34 + i * 0.07, dur: 0.5, vol: 0.06 }));
    },
    open: () => [N.C5, N.E5, N.G5, N.C6].forEach((f, i) => tone(f, { at: i * 0.09, dur: 0.25, vol: 0.13, type: 'triangle' })),
    evening: () => [N.G5, N.E5, N.D5, N.C5].forEach((f, i) => bell(f, { at: i * 0.16, dur: 0.6, vol: 0.09 })),
    morning: () => [N.C6, N.G5, N.C6, N.E6].forEach((f, i) => bell(f, { at: i * 0.12, dur: 0.5, vol: 0.08 })),
    tick: (step = 0) => tone(1200 + step * 40, { dur: 0.03, vol: 0.06, type: 'square' }),
  };

  const muted = () => !!state.settings?.muted;

  return {
    /** Call from the first pointer/touch event: creates or resumes the AudioContext. */
    unlock() {
      init();
      if (ctx?.state === 'suspended') ctx.resume();
    },

    play(name, arg) {
      if (muted() || !ctx || ctx.state !== 'running') return;
      const now = ctx.currentTime;
      if (now - (lastPlayed.get(name) ?? -1) < MIN_GAP) return;
      lastPlayed.set(name, now);
      try { SOUNDS[name]?.(arg); } catch (err) { console.warn('sound', name, err); } // never break a sim tick
    },

    /** A short vibration (ms, or a pattern), where the phone supports it. */
    buzz(pattern) {
      // Phones refuse (and log an error) before the first tap, e.g. a day that closes right after loading.
      if (muted() || navigator.userActivation?.hasBeenActive === false) return;
      try { navigator.vibrate?.(pattern); } catch { /* not allowed before a tap */ }
    },

    get muted() { return muted(); },
    setMuted(on) {
      state.settings.muted = on;
      if (on) try { navigator.vibrate?.(0); } catch { /* ignore */ }
    },
  };
}
