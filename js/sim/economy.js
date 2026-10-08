import { events } from '../core/events.js';

export function addCoins(state, amount) {
  state.coins = Math.max(0, state.coins + amount);
  events.emit('coins', { amount, total: state.coins });
}
