// The shop's speech bubbles and pop-ups: "ooh!" at the window, wish notes above customers, a bell
// when someone is waiting with nobody at the counter, the scan / ring-up prompt, and coins floating
// up on a sale.

import * as THREE from 'three';
import { events } from '../core/events.js';
import { keeperAtCounter, registerOf, registerRooms } from '../sim/checkout.js';
import { cashierReady } from '../sim/helpers.js';

const WISH_SECONDS = 3;
const PEEK_WORDS = ['ooh! ✨', 'so cute! 💖', 'wow ✨', 'aww 💖'];
const ABOVE_COUNTER = new THREE.Vector3(0, 0.75, 0);

export function createShopBubbles({ state, overlay, customersView, checkoutView, thumbs }) {
  const wishes = new Map(); // customerId -> { itemId, t }
  const peeks = new Map();  // customerId -> { html }
  const counterAbove = (roomId) => () => checkoutView.counterTop(roomId)?.add(ABOVE_COUNTER) ?? null;

  events.on('wish', ({ customerId, itemId }) => wishes.set(customerId, { itemId, t: WISH_SECONDS }));
  events.on('peek', ({ customerId, itemId }) => {
    const html = itemId ? `<img alt="" src="${thumbs.get(itemId)}"> 💖` : PEEK_WORDS[Math.floor(Math.random() * PEEK_WORDS.length)];
    peeks.set(customerId, { html });
  });
  events.on('greeted', ({ customerId }) => {
    const p = customersView.headPosition(customerId);
    if (p) overlay.float(p, 'Hi! 👋', 'tip');
  });
  events.on('scanned', ({ roomId }) => { const p = checkoutView.counterTop(roomId); if (p) overlay.float(p, 'beep!', 'beep'); });
  events.on('sale', ({ amount, tip, roomId }) => {
    const p = checkoutView.counterTop(roomId);
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

      // Every register (GDD #73): a bell over someone waiting with nobody at the till, and the scan
      // prompt where the shopkeeper is behind the counter (cashiers need no prompt).
      for (const room of registerRooms(state)) {
        const reg = registerOf(state, room.id);
        const front = state.customers.find((c) => c.id === reg.queue[0]);
        if (front?.state === 'queued' && !cashierReady(state, room.id)) {
          overlay.bubble(`waiting-${room.id}`, () => customersView.headPosition(front.id), '🛎️', 'waiting');
        } else {
          overlay.removeBubble(`waiting-${room.id}`);
        }
        if (reg.checkout && keeperAtCounter(state) && state.keeper.roomId === room.id) {
          const left = reg.checkout.items.filter((i) => !i.scanned).length;
          overlay.bubble(`checkout-${room.id}`, counterAbove(room.id), left ? `Tap to scan · ${left} left` : 'Tap to ring up! 🛎️', 'prompt');
        } else {
          overlay.removeBubble(`checkout-${room.id}`);
        }
      }
    },
  };
}
