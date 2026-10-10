// Customers: walk in, browse shelves for what they want, take it, queue at the counter, pay, leave.
// If something they want isn't on the shelves, they leave a wish note instead (never upset).
// With more rooms (GDD #58) they head for the room that has what they want, walk over along the
// sidewalk or up the Stairwell (sim/route.js), and come back to the shop's counter to pay.
//
// States: [toWindow -> peeking (stop at the Window Display first)] -> arriving (walking in from the
//         street) -> entering -> toShelf -> browsing -> (next want...; toRoom -> entering to try
//         another room) -> toQueue -> queued -> paying -> paid -> leaving (out the door and off
//         along the street). waitingQueue when the line is full; straight to leaving if they found nothing.

import { events } from '../core/events.js';
import { orderableItems } from './catalog.js';
import { CUSTOMER, LOOKS, ADULT_SCALE, KID_SCALE } from '../data/customers.js';
import { findPath } from './nav.js';
import { newId, shopRoomId, findFixture, freeSlots, dropBox } from './stock.js';
import { sellingRooms, isShelfRoom } from './building.js';
import { doorOf, finishRoute, roomOffset, routeTo, streetBounds, stairRoom, walkRoute, routeEndPath } from './route.js';
import { startCheckout, registerOf, registerFor, registerRooms } from './checkout.js';
import { cashierReady } from './helpers.js';
import { recordWish, DAY_LENGTH } from './day.js';
import { SPARKLE } from '../data/dollhouse.js';
import { peekChance, peekWantChance, trafficBoost, windowX, dollhouseItems } from './collection.js';
import { keeperGreeting } from './keeper.js';
import { greeterOnDuty } from './helpers.js';

/** Just inside the shop's open front, where customers step in and out (room-local). */
export const ENTRY = { x: 0.4, z: 1.1 };
/**
 * The sidewalk in front of the shop (room-local; below floor level). People walk in from off-screen
 * along one lane and leave along the other, then disappear near the end of the road.
 */
export const STREET = { inLane: 2.25, outLane: 2.65, offEnd: 6.5, edgeZ: 1.3 }; // offEnd: how far past the building they appear / vanish
/**
 * The line for the counter; spot 0 is being served. They come up to the counter's end, side-on,
 * so they don't hide the counter (or the shopkeeper) from the camera, then the line snakes forward.
 */
export const QUEUE_SPOTS = [{ x: -0.3, z: 0.12 }, { x: 0.15, z: 0.3 }, { x: 0.1, z: 0.75 }, { x: -0.4, z: 0.9 }];
const BROWSE_DZ = 0.62;
/** States where a customer is still shopping (not in line, paying or leaving): see CUSTOMER.patience and closing time. */
const GIVE_UP = new Set(['toWindow', 'peeking', 'arriving', 'entering', 'toShelf', 'browsing', 'toRoom']);
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

/** Everything on the shelves, in every room customers shop in. */
const stockedItems = (state) => [...new Set(sellingRooms(state).flatMap((r) => stockedSlots(state, r.id).map((s) => s.itemId)))];

const roomById = (state, id) => state.building.rooms.find((r) => r.id === id);

/** Where to look for an item: right here if it's here, else the nearest room with one. */
function roomWith(state, hereId, itemId) {
  if (findSlot(state, hereId, itemId)) return hereId;
  const here = roomById(state, hereId);
  const far = (r) => Math.abs(r.col - here.col) + Math.abs(r.floor - here.floor) * 2;
  return sellingRooms(state).filter((r) => findSlot(state, r.id, itemId)).sort((a, b) => far(a) - far(b))[0]?.id ?? null;
}

/** Off-screen along the street, on one side of the building or the other (shop coordinates). */
function roadEnd(state, side) {
  const b = streetBounds(state);
  return side < 0 ? b.minX - STREET.offEnd : b.maxX + STREET.offEnd;
}

/** In from the sidewalk through the front of the room that has what they want first. */
function headInside(state, c) {
  const shopId = shopRoomId(state);
  let room = roomById(state, (c.wants[0] && roomWith(state, shopId, c.wants[0])) ?? shopId);
  if (room.floor > 0) room = stairRoom(state, 0) ?? roomById(state, shopId); // it's upstairs: in by the stairs
  const off = roomOffset(state, room), door = doorOf(room);
  c.path = [{ x: door.x + off, z: STREET.inLane }, { x: door.x + off, z: door.z }];
  c.arriveRoom = room.id === shopId ? null : { roomId: room.id, offset: off, from: shopId };
  c.arriveFacing = null;
  c.state = 'arriving';
}

function chooseWants(state, rand) {
  const stocked = stockedItems(state);
  const all = orderableItems(state); // wishes point at things you can order now (GDD #66)
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
    id: newId(state, 'c'), roomId, x: 0, z: STREET.inLane, facing: -side * Math.PI / 2,
    path: [], arriveFacing: null, legs: [], y: 0,
    side, state: 'arriving', timer: 0.3, look, wants: chooseWants(state, rand), basket: [], target: null,
    windowWant: null, arriveRoom: null,
  };
  c.x = roadEnd(state, side);
  headInside(state, c);
  // Drawn in by the Dream Dollhouse: look in the window first, and maybe want something from it.
  const chance = peekChance(state);
  if (chance && rand() < chance) {
    // Off to the side they came from, so they don't block the view of the dollhouse.
    c.path = [{ x: windowX(state) + side * between(rand, SPARKLE.peekOffset), z: STREET.inLane }];
    c.arriveRoom = null; // they pick a room to go in once they've looked (headInside)
    c.arriveFacing = Math.PI;
    c.state = 'toWindow';
    const onShow = [...dollhouseItems(state)];
    if (onShow.length && rand() < peekWantChance(state)) c.wants[0] = c.windowWant = pick(rand, onShow);
  }
  state.customers.push(c);
  events.emit('customerArrived', { customer: c });
  return c;
}

/** Welcomed at the door by the shopkeeper: often they'll pick up one more thing while they're here. */
function greet(state, c, rand) {
  c.greeted = true;
  const stocked = stockedItems(state);
  if (c.wants.length < 2 && stocked.length && rand() < CUSTOMER.greetedSecondItem) c.wants.push(pick(rand, stocked));
  events.emit('greeted', { customerId: c.id });
}

function walk(c, nav, x, z, face = null) {
  c.path = findPath(nav, c, { x, z }) ?? [];
  c.arriveFacing = face;
}

function addWish(state, c, itemId) {
  state.wishes.push({ itemId, day: state.day.number });
  if (state.wishes.length > MAX_WISHES) state.wishes.shift();
  recordWish(state, itemId);
  events.emit('wish', { customerId: c.id, itemId });
}

/** Head for the next thing on the list, or to the line / the door when done. */
function nextWant(state, c, navs, rand) {
  const itemId = c.wants[0];
  if (itemId) {
    const where = roomWith(state, c.roomId, itemId);
    if (where && where !== c.roomId) { // it's in another room: walk over
      const door = doorOf(roomById(state, where));
      if (routeTo(state, navs, c, { roomId: where, x: door.x, z: door.z - 0.3 })) {
        c.arriveFacing = null;
        c.state = 'toRoom';
        return;
      }
    }
    const nav = navs.get(c.roomId);
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
    return nextWant(state, c, navs, rand);
  }
  if (c.basket.length) joinQueue(state, c, navs);
  else leave(state, c, navs);
}

/** Done looking at a shelf: take the item, or try elsewhere, or wish for it. */
function finishBrowsing(state, c, navs, rand) {
  const t = c.target;
  c.target = null;
  const shelf = t && findFixture(state, t.fixtureId)?.fixture;
  if (t && shelf && t.slot != null && shelf.slots[t.slot] === t.itemId) {
    shelf.slots[t.slot] = null;
    c.basket.push(t.itemId);
    c.takenFrom = [...(c.takenFrom ?? []), { fixtureId: shelf.id, slot: t.slot }]; // to put it back (sendEveryoneHome)
    c.wants.shift();
    events.emit('itemTaken', { roomId: c.roomId, fixtureId: shelf.id, slot: t.slot, itemId: t.itemId, customerId: c.id });
  } else if (t && roomWith(state, c.roomId, t.itemId)) {
    // Someone else took it, but there's another one (here or in another room): go look there.
  } else if (t) {
    c.wants.shift();
    addWish(state, c, t.itemId);
  }
  nextWant(state, c, navs, rand);
}

function queueFace(i) {
  if (i === 0) return -Math.PI / 2; // facing the counter (to their left)
  const ahead = QUEUE_SPOTS[i - 1], me = QUEUE_SPOTS[i];
  return Math.atan2(ahead.x - me.x, ahead.z - me.z);
}

/** Where they'll pay: the register on the floor they're on, else the nearest one below (GDD #73). */
function payingAt(state, c) {
  const roomId = c.arriveRoom?.roomId ?? c.roomId;
  const floor = state.building.rooms.find((r) => r.id === roomId)?.floor ?? 0;
  return registerFor(state, floor).id;
}

/** The register they're lined up at (the shop's if they never picked one). */
const regIdOf = (state, c) => c.registerId ?? shopRoomId(state);

function joinQueue(state, c, navs) {
  c.registerId = payingAt(state, c);
  const queue = registerOf(state, c.registerId).queue;
  if (queue.length >= QUEUE_SPOTS.length) {
    c.state = 'waitingQueue';
    return;
  }
  queue.push(c.id);
  goToQueueSpot(state, c, queue.length - 1, navs);
}

/** To their place in line at their register's counter (from another room: along the sidewalk or the stairs). */
function goToQueueSpot(state, c, i, navs) {
  const s = QUEUE_SPOTS[i];
  c.state = 'toQueue';
  if (c.arriveRoom) return; // still walking over from another room: they find their place on arrival
  const regId = regIdOf(state, c);
  if (c.roomId === regId) walk(c, navs.get(regId), s.x, s.z, queueFace(i));
  else if (routeTo(state, navs, c, { roomId: regId, x: s.x, z: s.z })) c.arriveFacing = queueFace(i);
}

function leave(state, c, navs) {
  const queue = registerOf(state, regIdOf(state, c))?.queue ?? [];
  const i = queue.indexOf(c.id);
  if (i >= 0) {
    queue.splice(i, 1);
    // Everyone behind steps up.
    queue.forEach((id, j) => {
      const other = state.customers.find((x) => x.id === id);
      if (j >= i && other && (other.state === 'toQueue' || other.state === 'queued')) goToQueueSpot(state, other, j, navs);
    });
  }
  // Out the front of their room, onto the sidewalk, and off the far end of the road from where they came.
  const far = roadEnd(state, -c.side);
  // (From upstairs: down the stairs first, then out under the room they were in.)
  const room = roomById(state, c.arriveRoom?.roomId ?? c.roomId);
  const doorX = doorOf(room).x + roomOffset(state, room);
  if (routeTo(state, navs, c, { street: true, x: doorX, z: STREET.outLane })) routeEndPath(c).push({ x: far, z: STREET.outLane });
  else { c.path = [{ x: far, z: STREET.outLane }]; c.legs = []; }
  c.arriveFacing = null;
  c.state = 'leaving';
}

export function tickCustomers(state, navs, dt, rand = Math.random) {
  // New visitors only arrive while the shop is open.
  if (state.day.phase === 'open' && (state.spawnTimer -= dt) <= 0) {
    const anyStock = stockedItems(state).length > 0;
    const max = CUSTOMER.maxInShop + CUSTOMER.perRoom * state.building.rooms.filter(isShelfRoom).length;
    if (state.customers.length < max) spawnCustomer(state, rand);
    state.spawnTimer = between(rand, anyStock ? CUSTOMER.spawnEvery : CUSTOMER.spawnEveryEmpty) / trafficBoost(state);
  }

  for (const c of [...state.customers]) {
    const speed = c.z > STREET.edgeZ ? CUSTOMER.streetSpeed : CUSTOMER.speed;
    if (walkRoute(state, c, speed, dt)) {
      finishRoute(c); // walked over from another room (or in from the street)
      if (c.arriveFacing !== null) c.facing = c.arriveFacing;
    }
    const walking = c.path.length > 0;
    // Backstop: nobody shops forever. Someone who has been browsing far too long pays for what they
    // have (or goes home), so a stuck customer can never keep the shop from closing.
    c.age = (c.age ?? 0) + dt;
    // The same when the evening is over (GDD #62): everyone still shopping heads for the counter with
    // what they have, or home, so the day ends quickly however big the building is.
    const closing = state.day.phase === 'evening' && state.day.time >= DAY_LENGTH.evening;
    if ((c.age > CUSTOMER.patience || closing) && GIVE_UP.has(c.state) && !c.gaveUp) {
      c.gaveUp = true;
      c.wants = [];
      c.target = null;
      if (c.basket.length) joinQueue(state, c, navs);
      else leave(state, c, navs);
      continue;
    }
    switch (c.state) {
      case 'toWindow':
        if (!walking) {
          c.state = 'peeking';
          c.timer = between(rand, SPARKLE.peekTime);
          events.emit('peek', { customerId: c.id, itemId: c.windowWant });
        }
        break;
      case 'peeking':
        if ((c.timer -= dt) <= 0) headInside(state, c);
        break;
      case 'arriving':
        if (!walking) {
          c.state = 'entering';
          events.emit('customerEntered', { customerId: c.id });
          if (c.roomId === shopRoomId(state) && (keeperGreeting(state) || greeterOnDuty(state))) greet(state, c, rand);
        }
        break;
      case 'toRoom':
        if (!walking) { c.state = 'entering'; c.timer = 0.2; }
        break;
      case 'entering':
        if ((c.timer -= dt) <= 0) nextWant(state, c, navs, rand);
        break;
      case 'toShelf':
        if (!walking) { c.state = 'browsing'; c.timer = between(rand, CUSTOMER.browseTime); }
        break;
      case 'browsing':
        if ((c.timer -= dt) <= 0) finishBrowsing(state, c, navs, rand);
        break;
      case 'waitingQueue':
        if (registerOf(state, c.registerId ?? payingAt(state, c)).queue.length < QUEUE_SPOTS.length) joinQueue(state, c, navs);
        break;
      case 'toQueue':
        if (!walking) {
          // Walked over from another room: the line may have moved up while they were on the way.
          const i = registerOf(state, regIdOf(state, c)).queue.indexOf(c.id), s = QUEUE_SPOTS[i];
          if (s && !c.requeued && Math.hypot(c.x - s.x, c.z - s.z) > 0.05) {
            c.requeued = true;
            goToQueueSpot(state, c, i, navs);
          } else {
            c.requeued = false;
            c.state = 'queued';
          }
        }
        break;
      case 'queued':
        {
          const regId = regIdOf(state, c), reg = registerOf(state, regId);
          if (reg.queue[0] === c.id && !reg.checkout && cashierReady(state, regId)) startCheckout(state, c);
        }
        break;
      case 'paid':
        leave(state, c, navs);
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

/** Put an item back where it came from: its own slot, else that shelf, else any shelf, else a box on the doorstep. */
function putBack(state, itemId, from) {
  const shelf = from && findFixture(state, from.fixtureId)?.fixture;
  if (shelf?.slots && shelf.slots[from.slot] === null) return void (shelf.slots[from.slot] = itemId);
  const any = [shelf, ...sellingRooms(state).flatMap((r) => r.fixtures)].find((f) => f?.slots && freeSlots(f).length);
  if (any) any.slots[freeSlots(any)[0]] = itemId;
  else dropBox(state, itemId, 1);
}

/**
 * Closing up right now in the evening (GDD #63): everyone still here goes home at once, and whatever
 * they were holding goes back on the shelves. Nobody pays.
 */
export function sendEveryoneHome(state) {
  for (const c of state.customers) {
    if (c.state === 'leaving') continue;
    c.basket.forEach((itemId, i) => putBack(state, itemId, c.takenFrom?.[i]));
  }
  for (const room of registerRooms(state)) {
    const reg = registerOf(state, room.id);
    if (reg.checkout) {
      reg.checkout = null;
      events.emit('checkoutCancelled', { roomId: room.id });
    }
    if (reg.cashier) reg.cashier.serving = null;
    reg.queue = [];
  }
  state.customers = [];
  events.emit('shelvesChanged');
}
