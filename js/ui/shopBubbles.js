// The shop's speech bubbles and pop-ups: "ooh!" at the window, wish notes above customers, a bell
// when someone is waiting with nobody at the counter, the scan / ring-up prompt, and coins floating
// up on a sale.

import * as THREE from 'three';
import { events } from '../core/events.js';
import { keeperAtCounter } from '../sim/checkout.js';
import { cashierReady } from '../sim/helpers.js';

const WISH_SECONDS = 3;
const PEEK_WORDS = ['ooh! ✨', 'so cute! 💖', 'wow ✨', 'aww 💖'];
const ABOVE_COUNTER = new THREE.Vector3(0, 0.75, 0);

export function createShopBubbles({ state, overlay, customersView, checkoutView, thumbs }) {
  const wishes = new Map(); // customerId -> { itemId, t }
  const peeks = new Map();  // customerId -> { html }
  const counterAbove = () => checkoutView.counterTop()?.add(ABOVE_COUNTER) ?? null;

  events.on('wish', ({ customerId, itemId }) => wishes.set(customerId, { itemId, t: WISH_SECONDS }));
  events.on('peek', ({ customerId, itemId }) => {
    const html = itemId ? `<img alt="" src="${thumbs.get(itemId)}"> 💖` : PEEK_WORDS[Math.floor(Math.random() * PEEK_WORDS.length)];
    peeks.set(customerId, { html });
  });
  events.on('scanned', () => { const p = checkoutView.counterTop(); if (p) overlay.float(p, 'beep!', 'beep'); });
  events.on('sale', ({ amount, tip }) => {
    const p = checkoutView.counterTop();
    if (!p) return;
    overlay.float(p.clone().add(new THREE.Vector3(0, 0.75, 0)), `+${amount} 🪙`, 'coins');
    if (tip) overlay.float(p.clone().add(new THREE.Vector3(0.55, 0.35, 0)), `+${tip} tip!`, 'tip');
    overlay.float(p.clone().add(new THREE.Vector3(-0.55, 0.35, 0)), '❤️ +1', 'heart');
  });

  return {
    update(dt) {
      for (const [id, w] of wishes) {
        w.t -= dt;
        const key = `wish-${id}`;
        if (w.t <= 0 || !state.customers.some((c) => c.id === id)) {
          wishes.delete(id);
          overlay.removeBubble(key);
        } else {
          overlay.bubble(key, () => customersView.headPosition(id), `<img alt="" src="${thumbs.get(w.itemId)}">`, 'wish');
        }
      }

      for (const [id, p] of peeks) {
        const key = `peek-${id}`;
        // Shown while they stand at the window (gone once they walk on).
        if (state.customers.find((c) => c.id === id)?.state !== 'peeking') {
          peeks.delete(id);
          overlay.removeBubble(key);
        } else {
          overlay.bubble(key, () => customersView.headPosition(id), p.html, 'peek');
        }
      }

      const front = state.customers.find((c) => c.id === state.queue[0]);
      if (front?.state === 'queued' && !cashierReady(state)) {
        overlay.bubble('waiting', () => customersView.headPosition(front.id), '🛎️', 'waiting');
      } else {
        overlay.removeBubble('waiting');
      }

      if (state.checkout && keeperAtCounter(state)) { // Mia needs no prompt
        const left = state.checkout.items.filter((i) => !i.scanned).length;
        overlay.bubble('checkout', counterAbove, left ? `Tap to scan · ${left} left` : 'Tap to ring up! 🛎️', 'prompt');
      } else {
        overlay.removeBubble('checkout');
      }
    },
  };
}
