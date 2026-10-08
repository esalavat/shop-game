// What the shopkeeper does when she reaches where she was sent.

import { pickUpBox, stockShelf } from './stock.js';

export function performTask(state, task) {
  switch (task?.type) {
    case 'pickup': return pickUpBox(state, task.boxId);
    case 'stock': return stockShelf(state, task.fixtureId);
    default: return null;
  }
}
