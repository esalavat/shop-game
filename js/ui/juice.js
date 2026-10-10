// Game feel (GDD #45-47): turns game events into sounds, sparkles, hearts, confetti and little
// vibrations. The sim never knows about any of this; it just emits events (core/events.js).

import * as THREE from 'three';
import { events } from '../core/events.js';
import { confetti } from './confetti.js';

const UP = new THREE.Vector3(0, 0.15, 0);
const HEARTS = ['💖', '❤️', '💕'];

export function createJuice({ audio, fx, overlay, keeperView, helpersView, customersView, dollhouseView, checkoutView }) {
  const celebrate = () => {
    confetti();
    audio.play('fanfare');
    audio.buzz([20, 50, 20, 50, 40]);
  };

  // Ringing up
  events.on('scanned', () => audio.play('beep'));
  events.on('sale', ({ customerId }) => {
    audio.play('chaching');
    audio.buzz([12, 40, 24]);
    const head = customersView.headPosition(customerId);
    if (head) {
      HEARTS.forEach((h, i) => overlay.float(head.clone().add(UP), h, 'heart-rise', { drift: (i - 1) * 22, delay: 0.15 + i * 0.12 }));
    }
    const counter = checkoutView.counterTop();
    if (counter) fx.sparkle(counter.add(new THREE.Vector3(0, 0.2, 0.3)), { count: 6, spread: 0.8 });
  });

  // Customers
  events.on('customerEntered', () => audio.play('bell'));
  events.on('greeted', () => audio.play('hi'));
  events.on('wish', () => audio.play('wish'));
  events.on('peek', () => {
    audio.play('twinkle');
    const p = dollhouseView.worldPosition();
    if (p) fx.sparkle(p, { count: 5, spread: 0.7 });
  });

  // Stock
  events.on('orderPlaced', () => audio.play('pop', 1.3));
  events.on('boxPicked', () => audio.play('lift'));
  events.on('stocked', ({ by }) => { if (by === 'keeper') audio.buzz(10); }); // only buzz for your own work
  events.on('boxEmptied', ({ by }) => {
    audio.play('poof');
    fx.poof(by === 'stocker' ? helpersView.stockerHand() : keeperView.handPosition());
  });
  events.on('shelfFull', () => audio.play('boop'));
  events.on('lunchDelivery', () => audio.play('pop'));

  // The Dream Dollhouse
  events.on('dollhouseChanged', ({ slotId, itemId, gained }) => {
    if (!itemId) return audio.play('pop', 0.8);
    const p = dollhouseView.worldPosition(slotId);
    if (p) fx.sparkle(p, { count: gained > 0 ? 10 : 6 });
    audio.play(gained > 0 ? 'sparkle' : 'pop');
  });

  // The day
  events.on('phaseChanged', ({ phase }) => {
    if (phase === 'open') audio.play('open');
    if (phase === 'evening') audio.play('evening');
  });
  events.on('dayStarted', () => audio.play('morning'));

  // Growing the shop
  events.on('expanded', celebrate);
  events.on('helperHired', celebrate);
  events.on('upgradeBought', celebrate);
  events.on('pageOpened', celebrate);

  // Bouncy UI: a soft tap on every button (the specific sounds above play on top).
  document.getElementById('app').addEventListener('click', (e) => {
    if (e.target.closest('button')) audio.play('tap');
  });

  return {
    /** An item from the shopkeeper's box landed on the shelf: the notes climb with each one. */
    itemLanded(position, step) {
      fx.sparkle(position.clone().add(new THREE.Vector3(0, 0.12, 0.25)), { count: 4, spread: 0.5, life: 0.45 });
      audio.play('land', step);
    },
    celebrate,
  };
}
