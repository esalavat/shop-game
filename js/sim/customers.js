// Customers: walk in, browse shelves for what they want, take it, queue at the counter, pay, leave.
// If something they want isn't on the shelves, they leave a wish note instead (never upset).
//
// States: arriving (walking in from the street) -> entering -> toShelf -> browsing -> (next want...)
//         -> toQueue -> queued -> paying -> paid -> leaving (out the door and off along the street)
//         waitingQueue when the line is full; straight to leaving if they found nothing.

import { events } from '../core/events.js';
import { ITEMS } from '../data/items.js';
import { CUSTOMER, LOOKS, ADULT_SCALE, KID_SCALE } from '../data/customers.js';
import { findPath } from './nav.js';
import { stepAlong } from './walker.js';
import { newId, shopRoomId, findFixture } from './stock.js';
import { keeperAtCounter, startCheckout } from './checkout.js';

/** Just inside the shop's open front, where customers step in and out (room-local). */
export const ENTRY = { x: 0.4, z: 1.1 };
/**
 * The sidewalk in front of the shop (room-local; below floor level). People walk in from off-screen
 * along one lane and leave along the other, then disappear near the end of the road.
 */
export const STREET = { inLane: 2.25, outLane: 2.65, farX: 8, edgeZ: 1.3 };
/**
 * The line for the counter; spot 0 is being served. They come up to the counter's end, side-on,
 * so they don't hide the counter (or the shopkeeper) from the camera, then the line snakes forward.
 */
export const QUEUE_SPOTS = [{ x: -0.3, z: 0.12 }, { x: 0.15, z: 0.3 }, { x: 0.1, z: 0.75 }, { x: -0.4, z: 0.9 }];
const BROWSE_DZ = 0.62;
const MAX_WISHES = 12;

const pick = (rand, list) => list[Math.floor(rand() * list.length)];
const between = (rand, [lo, hi]) => lo + rand() * (hi - lo);

function shelvesIn(state, roomId) {
  return state.building.rooms.find((r) => r.id === roomId)?.fixtures.filter((f) => f.slots) ?? [];
}

const reservedSlots = (state) =>
  new Set(state.customers.filter((c) => c.target?.slot != null).map((c) => `${c.target.fixtureId}:${c.target.slot}`));

/** Every stocked slot in a room: [{ fixture, slot, itemId }]. */
export function stockedSlots(state, roomId) {
  const out = [];
  for (const f of shelvesIn(state, roomId)) f.slots.forEach((itemId, slot) => { if (itemId) out.push({ fixture: f, slot, itemId }); });
  return out;
}

function findSlot(state, roomId, itemId) {
  const reserved = reservedSlots(state);
  return stockedSlots(state, roomId).find((s) => s.itemId === itemId && !reserved.has(`${s.fixture.id}:${s.slot}`)) ?? null;
}

function chooseWants(state, roomId, rand) {
  const stocked = [...new Set(stockedSlots(state, roomId).map((s) => s.itemId))];
  const all = Object.keys(ITEMS);
  const first = stocked.length && rand() < CUSTOMER.wantsStocked ? pick(rand, stocked) : pick(rand, all);
  const wants = [first];
  if (stocked.length && rand() < CUSTOMER.secondItem) wants.push(pick(rand, stocked));
  return wants;
}

export function spawnCustomer(state, rand = Math.random) {
  const roomId = shopRoomId(state);
  const kid = rand() < CUSTOMER.kidChance;
  const look = {
    hair: pick(rand, LOOKS.hair), hairColor: pick(rand, LOOKS.hairColors),
    skin: pick(rand, LOOKS.skins), outfit: pick(rand, LOOKS.outfits),
    scale: kid ? KID_SCALE : ADULT_SCALE,
  };
  const side = rand() < 0.5 ? -1 : 1;
  const c = {
    id: newId(state, 'c'), roomId, x: side * STREET.farX, z: STREET.inLane, facing: -side * Math.PI / 2,
    path: [{ x: ENTRY.x, z: STREET.inLane }, { x: ENTRY.x, z: ENTRY.z }], arriveFacing: null,
    side, state: 'arriving', timer: 0.3, look, wants: chooseWants(state, roomId, rand), basket: [], target: null,
  };
  state.customers.push(c);
  events.emit('customerArrived', { customer: c });
  return c;
}

function walk(c, nav, x, z, face = null) {
  c.path = findPath(nav, c, { x, z }) ?? [];
  c.arriveFacing = face;
}

function addWish(state, c, itemId) {
  state.wishes.push({ itemId, day: state.day.number });
  if (state.wishes.length > MAX_WISHES) state.wishes.shift();
  events.emit('wish', { customerId: c.id, itemId });
}

/** Head for the next thing on the list, or to the line / the door when done. */
function nextWant(state, c, nav, rand) {
  const itemId = c.wants[0];
  if (itemId) {
    const found = findSlot(state, c.roomId, itemId);
    const shelves = shelvesIn(state, c.roomId);
    const shelf = found?.fixture ?? pick(rand, shelves);
    if (shelf) {
      const col = found ? found.slot % 3 : Math.floor(rand() * 3);
      c.target = { fixtureId: shelf.id, slot: found ? found.slot : null, itemId };
      walk(c, nav, shelf.x + (col - 1) * 0.3, shelf.z + BROWSE_DZ, Math.PI);
      c.state = 'toShelf';
      return;
    }
    c.wants.shift();
    addWish(state, c, itemId);
    return nextWant(state, c, nav, rand);
  }
  if (c.basket.length) joinQueue(state, c, nav);
  else leave(state, c, nav);
}

/** Done looking at a shelf: take the item, or try elsewhere, or wish for it. */
function finishBrowsing(state, c, nav, rand) {
  const t = c.target;
  c.target = null;
  const shelf = t && findFixture(state, t.fixtureId)?.fixture;
  if (t && shelf && t.slot != null && shelf.slots[t.slot] === t.itemId) {
    shelf.slots[t.slot] = null;
    c.basket.push(t.itemId);
    c.wants.shift();
    events.emit('itemTaken', { roomId: c.roomId, fixtureId: shelf.id, slot: t.slot, itemId: t.itemId, customerId: c.id });
  } else if (t && findSlot(state, c.roomId, t.itemId)) {
    // Someone else took it, but there's another one: go look there.
  } else if (t) {
    c.wants.shift();
    addWish(state, c, t.itemId);
  }
  nextWant(state, c, nav, rand);
}

function queueFace(i) {
  if (i === 0) return -Math.PI / 2; // facing the counter (to their left)
  const ahead = QUEUE_SPOTS[i - 1], me = QUEUE_SPOTS[i];
  return Math.atan2(ahead.x - me.x, ahead.z - me.z);
}

function joinQueue(state, c, nav) {
  if (state.queue.length >= QUEUE_SPOTS.length) {
    c.state = 'waitingQueue';
    return;
  }
  state.queue.push(c.id);
  goToQueueSpot(c, state.queue.length - 1, nav);
}

function goToQueueSpot(c, i, nav) {
  const s = QUEUE_SPOTS[i];
  walk(c, nav, s.x, s.z, queueFace(i));
  c.state = 'toQueue';
}

function leave(state, c, nav) {
  const i = state.queue.indexOf(c.id);
  if (i >= 0) {
    state.queue.splice(i, 1);
    // Everyone behind steps up.
    state.queue.forEach((id, j) => {
      const other = state.customers.find((x) => x.id === id);
      if (j >= i && other && (other.state === 'toQueue' || other.state === 'queued')) goToQueueSpot(other, j, nav);
    });
  }
  // Out the door, onto the sidewalk, and off the far end of the road from where they came.
  const side = -c.side;
  c.path = [
    ...(findPath(nav, c, ENTRY) ?? []),
    { x: ENTRY.x, z: STREET.outLane },
    { x: side * STREET.farX, z: STREET.outLane },
  ];
  c.arriveFacing = null;
  c.state = 'leaving';
}

export function tickCustomers(state, navs, dt, rand = Math.random) {
  state.spawnTimer -= dt;
  if (state.spawnTimer <= 0) {
    const anyStock = stockedSlots(state, shopRoomId(state)).length > 0;
    if (state.customers.length < CUSTOMER.maxInShop) spawnCustomer(state, rand);
    state.spawnTimer = between(rand, anyStock ? CUSTOMER.spawnEvery : CUSTOMER.spawnEveryEmpty);
  }

  for (const c of [...state.customers]) {
    const nav = navs.get(c.roomId);
    const speed = c.z > STREET.edgeZ ? CUSTOMER.streetSpeed : CUSTOMER.speed;
    if (stepAlong(c, speed, dt) && c.arriveFacing !== null) c.facing = c.arriveFacing;
    const walking = c.path.length > 0;
    switch (c.state) {
      case 'arriving':
        if (!walking) c.state = 'entering';
        break;
      case 'entering':
        if ((c.timer -= dt) <= 0) nextWant(state, c, nav, rand);
        break;
      case 'toShelf':
        if (!walking) { c.state = 'browsing'; c.timer = between(rand, CUSTOMER.browseTime); }
        break;
      case 'browsing':
        if ((c.timer -= dt) <= 0) finishBrowsing(state, c, nav, rand);
        break;
      case 'waitingQueue':
        if (state.queue.length < QUEUE_SPOTS.length) joinQueue(state, c, nav);
        break;
      case 'toQueue':
        if (!walking) c.state = 'queued';
        break;
      case 'queued':
        if (state.queue[0] === c.id && !state.checkout && keeperAtCounter(state)) startCheckout(state, c);
        break;
      case 'paid':
        leave(state, c, nav);
        break;
      case 'leaving':
        if (!walking) {
          state.customers.splice(state.customers.indexOf(c), 1);
          events.emit('customerLeft', { customer: c });
        }
        break;
    }
  }
}
