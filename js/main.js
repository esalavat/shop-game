// Boot: load the save, build the world, wire input and UI, start the loop.

import * as THREE from 'three';
import { loadGame, saveGame, clearSave, isSaveLocked } from './core/save.js';
import { IS_DEV, CHANNEL, BUILD } from './core/channel.js';
import { createState } from './sim/state.js';
import { startLoop } from './core/loop.js';
import { events } from './core/events.js';
import { createRenderer } from './render/renderer.js';
import { createLighting } from './render/lighting.js';
import { createBuilding, ROOM } from './render/building.js';
import { createEnvironment } from './render/environment.js';
import { disposeTree } from './render/models/prims.js';
import { CameraRig } from './render/camera.js';
import { pickAt } from './render/pick.js';
import { createKeeperView } from './render/views/keeper.js';
import { createFx } from './render/fx.js';
import { createBoxesView } from './render/views/boxes.js';
import { createShelvesView } from './render/views/shelves.js';
import { makeThumbnails } from './render/thumbs.js';
import { createCustomersView } from './render/views/customers.js';
import { createCheckoutView } from './render/views/checkout.js';
import { createDollhouseView } from './render/views/dollhouse.js';
import { createHelpersView } from './render/views/helpers.js';
import { createSpotsView } from './render/views/spots.js';
import { DOLLHOUSE } from './render/models/furniture.js';
import { buildNav } from './sim/nav.js';
import { walkTo, walkToFixture, walkToBox, walkToGreeter, walkToShowOff, tickKeeper } from './sim/keeper.js';
import { GREETER, SIDEWALK, STAIRS, groundAt, shopRoom, streetBounds, stairRoom, routeEnd } from './sim/route.js';
import { tickDay, twilightFor } from './sim/day.js';
import { tickCustomers } from './sim/customers.js';
import { tickHelpers } from './sim/helpers.js';
import { tickStockers } from './sim/stocker.js';
import { canCarryMore } from './sim/stock.js';
import { UPGRADES, HELPERS } from './data/upgrades.js';
import { separate } from './sim/crowd.js';
import { checkoutTap, keeperAtCounter } from './sim/checkout.js';
import { displayRoom } from './sim/collection.js';
import { ITEMS, PAGES } from './data/items.js';
import { buildRoom, roomSpots, roomCost } from './sim/building.js';
import { attachGestures } from './input/touch.js';
import { createHud } from './ui/hud.js';
import { createOrderBook } from './ui/orderbook.js';
import { createToaster } from './ui/toast.js';
import { createOverlay } from './ui/overlay.js';
import { createShopBubbles } from './ui/shopBubbles.js';
import { createGuide } from './ui/guide.js';
import { advanceTutorial } from './sim/tutorial.js';
import { createDayUI } from './ui/day.js';
import { createAlbum } from './ui/album.js';
import { createGrow } from './ui/grow.js';
import { createDecorate } from './ui/decorate.js';
import { createStyler } from './ui/styler.js';
import { SETS } from './data/items.js';
import { giftCompleteThemes } from './sim/rewards.js';
import { hasHelper } from './sim/upgrades.js';
import { styleName } from './data/decor.js';
import { createCreator } from './ui/creator.js';
import { createJuice } from './ui/juice.js';
import { createAudio } from './audio/audio.js';
import { createQuality } from './render/quality.js';

const AUTOSAVE_SECONDS = 15;

const state = loadGame();
if (isSaveLocked(state)) {
  // This page is older than the save on the device (a cached copy after an update). The save is
  // left untouched; a fresh load brings the code that can read it.
  document.getElementById('update-needed').hidden = false;
  document.getElementById('update-reload').addEventListener('click', () => location.replace(location.pathname + '?fresh=' + Date.now()));
}
if (IS_DEV) {
  const badge = document.createElement('div');
  badge.id = 'dev-badge';
  badge.textContent = `${CHANNEL.toUpperCase()} · ${BUILD.slice(0, 7)}`;
  document.getElementById('app').append(badge);
}
const app = document.getElementById('app');
const canvas = document.getElementById('game');
const renderer = createRenderer(canvas);
const audio = createAudio(state);
// Phones only allow sound after a touch; this also wakes the audio back up after an interruption.
addEventListener('pointerdown', () => audio.unlock(), { capture: true });
const scene = new THREE.Scene();
const lighting = createLighting(scene);
const rig = new CameraRig();
const hud = createHud(state, audio);
const fx = createFx(scene);
const toast = createToaster();
const thumbs = makeThumbnails(renderer, Object.keys(ITEMS));
const orderBook = createOrderBook(state, thumbs);
const overlay = createOverlay(canvas, () => rig.camera);
const dayUI = createDayUI(state, thumbs, orderBook, toast, audio);
const album = createAlbum(state, thumbs);
lighting.setTwilight(twilightFor(state.day)); // start in the right light (e.g. reopened after closing)

// ---------------------------------------------------------------------------
// World (rebuilt whenever the building changes)
// ---------------------------------------------------------------------------
let world = null;
const navs = new Map(); // roomId -> walk grid
const roomById = (id) => state.building.rooms.find((r) => r.id === id);

/** World position of a room's floor center; room-local (x, z) are offsets from it. */
function roomOrigin(roomId) {
  const room = roomById(roomId), L = world.building.layout;
  return { x: L.roomX(room.col), y: L.roomY(room.floor), z: 0 };
}

let stylePreview = null; // a style tried on in decorate-rooms mode, not bought yet ({ roomId, decor })

function buildWorld() {
  if (world) {
    scene.remove(world.group);
    disposeTree(world.group);
  }
  lighting.resetLamps();
  const building = createBuilding(state.building.rooms, lighting, stylePreview);
  const group = new THREE.Group();
  group.add(building.group, createEnvironment(building.layout, lighting));
  scene.add(group);
  lighting.fitTo(building.layout);
  const { width, roofTop } = building.layout;
  rig.setLimits({ minX: -width / 2 - 1, maxX: width / 2 + 1, minY: 0.5, maxY: roofTop });
  // An invisible strip along the sidewalk, so she can be sent out onto the street.
  const street = new THREE.Mesh(new THREE.PlaneGeometry(width + 1, 0.8), new THREE.MeshBasicMaterial({ visible: false }));
  street.rotation.x = -Math.PI / 2;
  street.position.set(0, groundAt(SIDEWALK.lane) + 0.01, ROOM.D / 2 + 0.5); // world z of shop z 1.8
  street.userData = { street: true };
  group.add(street);
  world = { group, building, street };
  navs.clear();
  for (const room of state.building.rooms) navs.set(room.id, buildNav(room));
}

let focusedRoomId = null;

function focusRoom(room, instant = false) {
  focusedRoomId = room.id;
  const L = world.building.layout;
  rig.frame(L.roomX(room.col), L.roomY(room.floor) + ROOM.H / 2, ROOM.W + 0.6, ROOM.H + 0.8, instant);
}

function focusAll() {
  focusedRoomId = null;
  const { width, roofTop } = world.building.layout;
  const bottom = -0.8;
  rig.frame(0, (roofTop + bottom) / 2, width + 1.6, roofTop - bottom + 0.6);
}

buildWorld();
focusRoom(roomById(state.keeper.roomId), true);
const keeperView = createKeeperView(state, roomOrigin);
const boxesView = createBoxesView(state, roomOrigin);
const shelvesView = createShelvesView(state, roomOrigin, (by) => (by === 'keeper' ? keeperView.handPosition() : helpersView.stockerHand(by)), (p, step) => juice.itemLanded(p, step));
const customersView = createCustomersView(state, roomOrigin);
const checkoutView = createCheckoutView(state, roomOrigin);
const dollhouseView = createDollhouseView(state, roomOrigin);
const helpersView = createHelpersView(state, roomOrigin);
const spotsView = createSpotsView(state, roomOrigin);
const bubbles = createShopBubbles({ state, overlay, customersView, checkoutView, thumbs });
const guide = createGuide({
  state, overlay, roomOrigin,
  isBlocked: () => !!placing || creator.isOpen || decorate.isOpen || styler.isOpen || !state.shopkeeper.created || !!document.querySelector('.sheet:not([hidden])'),
});
const juice = createJuice({ audio, fx, overlay, keeperView, helpersView, customersView, dollhouseView, checkoutView });
scene.add(keeperView.object, helpersView.group, spotsView.group, boxesView.group, shelvesView.group, customersView.group, checkoutView.group, dollhouseView.group);
boxesView.rebuild();
shelvesView.rebuild();
dollhouseView.rebuild();
spotsView.rebuild();
events.on('buildingChanged', () => {
  buildWorld();
  boxesView.rebuild();
  shelvesView.rebuild();
  dollhouseView.rebuild();
  spotsView.rebuild();
  if (decorate.isOpen) decorate.close();
  if (styler.isOpen) styler.close();
  focusAll();
});
events.on('decorChanged', ({ roomId }) => {
  buildWorld();
  const room = roomById(roomId), L = world.building.layout;
  fx.sparkle(new THREE.Vector3(L.roomX(room.col), L.roomY(room.floor) + ROOM.H * 0.45, 0), { count: 10, spread: 2.2 });
});

// ---------------------------------------------------------------------------
// Dream Dollhouse decorate mode
// ---------------------------------------------------------------------------
const decorate = createDecorate(state, thumbs, {
  onSelect: (slotId) => dollhouseView.setSelected(slotId),
  onClose() {
    dollhouseView.setSelected(null);
    const room = displayRoom(state);
    if (room) focusRoom(room);
  },
});
const grow = createGrow(state, { onDecorate: () => enterDecorate(), onPlaceRoom: () => startPlacing(), onStyle: () => enterStyler() });

// ---------------------------------------------------------------------------
// Decorate rooms (GDD #68): style the room above the panel with Ribbons
// ---------------------------------------------------------------------------
const styler = createStyler(state, {
  onRoom(room) {
    focusedRoomId = room.id;
    const L = world.building.layout, cover = styler.coverFraction();
    rig.frame(L.roomX(room.col), L.roomY(room.floor) + ROOM.H / 2 - 0.1, ROOM.W + 0.3, (ROOM.H + 0.3) / (1 - cover), false, cover / 2);
  },
  onPreview(roomId, decor) {
    stylePreview = decor ? { roomId, decor } : null;
    buildWorld();
  },
  onBought: () => { audio.play('sparkle'); audio.buzz(15); },
  onClose: (room) => focusRoom(room),
});

function enterStyler() {
  orderBook.close();
  if (decorate.isOpen) decorate.close();
  stopPlacing();
  styler.open(focusedRoomId ?? state.keeper.roomId);
}

// ---------------------------------------------------------------------------
// Building a room (GDD #58, §18 #8): after "Build a room" in the Grow sheet, tap a glowing + spot.
// Each + shows its price (further out and higher up cost more).
// ---------------------------------------------------------------------------
let placing = false;
const placeBanner = document.getElementById('place-banner');
const shownSpots = new Map(); // key -> what the bubble shows

function startPlacing() {
  placing = true;
  placeBanner.querySelector('span').textContent = 'Tap a ＋ to build a new room';
  placeBanner.hidden = false;
  // Zoom out far enough to see the building and every + spot beside it.
  focusedRoomId = null;
  const L = world.building.layout, xs = roomSpots(state).map((p) => L.roomX(p.col));
  const left = Math.min(-L.width / 2, ...xs.map((x) => x - ROOM.W / 2)), right = Math.max(L.width / 2, ...xs.map((x) => x + ROOM.W / 2));
  rig.frame((left + right) / 2, (L.roofTop - 0.8) / 2, right - left + 0.8, L.roofTop + 1.4);
}

function stopPlacing() {
  placing = false;
  placeBanner.hidden = true;
}

placeBanner.querySelector('button').addEventListener('click', stopPlacing);
overlay.root.addEventListener('click', (e) => {
  const spot = e.target.closest('[data-spot]');
  if (!spot || !placing) return;
  const [col, floor] = spot.dataset.spot.split(',').map(Number);
  const short = roomCost(state, col, floor) - state.coins;
  if (short > 0) return audio.play('boop'), toast(`That spot needs ${short} more coins 🪙`);
  stopPlacing();
  buildRoom(state, col, floor);
});

function updatePlaceSpots() {
  const list = placing ? roomSpots(state) : [];
  const keep = new Set(list.map((p) => `${p.col},${p.floor}`));
  for (const key of shownSpots.keys()) if (!keep.has(key)) { overlay.removeBubble(`place-${key}`); shownSpots.delete(key); }
  for (const p of list) {
    const key = `${p.col},${p.floor}`, cost = roomCost(state, p.col, p.floor);
    const html = `<button data-spot="${key}" aria-label="Build here for ${cost} coins"${cost > state.coins ? ' class="short"' : ''}>＋<small>🪙 ${cost}</small></button>`;
    if (shownSpots.get(key) === html) continue;
    const L = world.building.layout;
    overlay.removeBubble(`place-${key}`);
    overlay.bubble(`place-${key}`, () => new THREE.Vector3(L.roomX(p.col), L.roomY(p.floor) + ROOM.H / 2, 0), html, 'place');
    shownSpots.set(key, html);
  }
}

/** Zoom in on the Dream Dollhouse, kept above the decorate panel. */
function enterDecorate(slotId) {
  const room = displayRoom(state);
  const pedestal = room?.fixtures.find((f) => f.kind === 'pedestal');
  if (!pedestal) return;
  orderBook.close();
  decorate.open(slotId);
  focusedRoomId = room.id;
  const o = roomOrigin(room.id);
  const houseH = (DOLLHOUSE.h + 0.42) * DOLLHOUSE.scale; // walls + roof
  const cover = decorate.coverFraction();
  rig.frame(o.x + pedestal.x, o.y + DOLLHOUSE.y + houseH / 2, 1.8, houseH / (1 - cover) + 0.5, false, cover / 2);
}

// ---------------------------------------------------------------------------
// Shopkeeper creator
// ---------------------------------------------------------------------------
const creator = createCreator(state, {
  onChange: (look) => keeperView.setLook(look),
  onLocked: (text) => { audio.play('boop'); toast(text); },
  onOpen() {
    orderBook.close();
    if (decorate.isOpen) decorate.close();
    if (styler.isOpen) styler.close();
    const o = roomOrigin(state.keeper.roomId);
    const cover = creator.coverFraction();
    if (!state.keeper.path.length) state.keeper.facing = 0; // turn to face you
    focusedRoomId = state.keeper.roomId;
    rig.frame(o.x + state.keeper.x, o.y + groundAt(state.keeper.z) + 0.75, 2.2, 1.9 / (1 - cover) + 0.4, false, cover / 2);
  },
  onClose(first) {
    focusRoom(roomById(state.keeper.roomId));
    save();
    if (first && state.day.number === 1 && state.day.phase === 'morning') toast('Stock your shelves, then tap Open shop ☀️');
    else if (first) toast('Looking lovely! Tap yourself in the morning to change it ✨');
  },
});

// ---------------------------------------------------------------------------
// Input & layout
// ---------------------------------------------------------------------------
attachGestures(canvas, {
  onTap(x, y) {
    if (creator.isOpen || placing) return;
    if (styler.isOpen) {
      const hit = pickAt(rig.camera, canvas, x, y, world.building.hitTargets);
      if (hit?.object.userData.roomId) styler.select(hit.object.userData.roomId);
      return;
    }
    if (decorate.isOpen) {
      const hit = pickAt(rig.camera, canvas, x, y, dollhouseView.hitTargets);
      if (hit) decorate.select(hit.object.userData.dollSlot);
      return;
    }
    // In the morning, tapping the shopkeeper herself opens the creator.
    const keeperTargets = state.day.phase === 'morning' && state.keeper.roomId === focusedRoomId ? keeperView.hitTargets : [];
    const targets = [...keeperTargets, ...world.building.hitTargets, ...boxesView.hitTargets, ...customersView.hitTargets, ...spotsView.hitTargets, world.street];
    const hit = pickAt(rig.camera, canvas, x, y, targets);
    if (!hit) return;
    if (hit.object.userData.keeper) return creator.open();
    if (hit.object.userData.spot) return tapSpot(hit.object.userData.spot);
    if (hit.object.userData.street) return tapStreet(hit.point);
    const { roomId, fixtureId, boxId, customerId, floor } = hit.object.userData;
    const room = roomById(roomId);
    // The Dream Dollhouse opens decorate mode straight away.
    if (room.type === 'display' && fixtureId && room.fixtures.find((f) => f.id === fixtureId)?.kind === 'pedestal') {
      return enterDecorate();
    }
    // First tap on another room just looks at it.
    if (roomId !== focusedRoomId) return focusRoom(room);
    const o = roomOrigin(roomId);
    const counter = room.fixtures.find((f) => f.kind === 'counter');
    const tappedCounter = fixtureId === counter?.id || (customerId && customerId === state.queue[0]);
    if (tappedCounter && state.checkout && keeperAtCounter(state)) {
      checkoutTap(state);
    } else if (tappedCounter && counter) {
      if (walkToFixture(state, navs, counter)) tapFeedback();
    } else if (customerId) {
      // Browsing customers: nothing to do yet.
    } else if (boxId) {
      if (!canCarryMore(state)) return audio.play('boop'), toast(state.keeper.spare ? 'The cart is full! Tap a shelf to unpack.' : 'Hands full! Tap a shelf to unpack this box first.');
      if (walkToBox(state, navs, state.boxes.find((b) => b.id === boxId))) tapFeedback();
    } else if (fixtureId && /^stair/.test(room.fixtures.find((f) => f.id === fixtureId)?.kind)) {
      // The stairs go up a floor; the railing round the hole goes back down. The view follows.
      const kind = room.fixtures.find((f) => f.id === fixtureId).kind;
      const other = stairRoom(state, room.floor + (kind === 'stairs' ? 1 : -1));
      if (other && walkTo(state, navs, { roomId: other.id, x: STAIRS.foot.x, z: STAIRS.foot.z }, { face: 0 })) {
        tapFeedback();
        focusRoom(other);
      }
    } else if (fixtureId) {
      const fixture = room.fixtures.find((f) => f.id === fixtureId);
      const task = state.keeper.carrying && fixture.slots ? { type: 'stock', fixtureId } : null;
      if (walkToFixture(state, navs, fixture, task)) tapFeedback();
    } else if (floor) {
      // She turns to face you when she gets there.
      if (walkTo(state, navs, { roomId, x: hit.point.x - o.x, z: hit.point.z - o.z }, { face: 0 })) tapFeedback();
    }
  },
  onDrag: (dx, dy) => rig.pan(dx, dy, canvas.clientHeight),
  onPinch: (scale) => rig.zoomBy(scale),
  onWheel: (deltaY) => rig.zoomBy(Math.exp(-deltaY * 0.0015)),
});

// ---------------------------------------------------------------------------
// Toolbar & messages
// ---------------------------------------------------------------------------
document.getElementById('btn-order').addEventListener('click', () => orderBook.open());
document.getElementById('btn-album').addEventListener('click', () => album.open());

events.on('orderPlaced', ({ order }) => toast(`Ordered ${ITEMS[order.itemId].name}! Pip brings it ${order.lunch ? 'at lunchtime 🥪' : 'tomorrow 📦'}`));
events.on('lunchDelivery', ({ delivered }) => {
  toast(`Lunchtime! Pip delivered ${delivered.boxes} box${delivered.boxes > 1 ? 'es' : ''} 📦`);
  for (const id of delivered.discovered) toast(`✨ New in your Collection: ${ITEMS[id].name} +2 🎀`);
  pageToasts(delivered);
});
events.on('upgradeBought', ({ id }) => toast(`${UPGRADES[id].icon} ${UPGRADES[id].name}: yours!`));
const HELPER_JOBS = {
  cashier: "She'll mind the register.", stocker: "She'll keep the shelves stocked.",
  stocker2: "He'll help keep the shelves stocked.", stocker3: "She'll help keep the shelves stocked.",
  greeter: "He'll say hello at the door.", dresser: "She'll show off your Dream Dollhouse.",
};
events.on('helperHired', ({ id }) => {
  toast(`${HELPERS[id].name} joined your shop! 💖 ${HELPER_JOBS[id] ?? ''}`);
  spotsView.rebuild(); // Ollie and Rosa take over their bonus spots
});
events.on('dayStarted', ({ day, delivered, rescued }) => {
  const boxes = delivered.boxes ? ` Pip delivered ${delivered.boxes} box${delivered.boxes > 1 ? 'es' : ''} 📦` : '';
  toast(`Good morning! Day ${day}.${boxes}`);
  if (rescued) toast(`Pip left you a free box of ${ITEMS[rescued].name}, just because 🎁`);
  for (const id of delivered.discovered) toast(`✨ New in your Collection: ${ITEMS[id].name} +2 🎀`);
  pageToasts(delivered);
});
function pageToasts(delivered) {
  for (const page of delivered.opened) toast(`${PAGES[page].icon} New page in the Order Book: ${PAGES[page].name}!`);
}
events.on('boxPicked', ({ spare, by }) => {
  if (by !== 'keeper') return; // stockers need no instructions
  if (spare) toast('Two boxes on the cart! Tap a shelf to unpack 🛒');
  else if (canCarryMore(state) && state.boxes.length) toast('Grab another box for the cart, or tap a shelf to unpack!');
  else toast('Now tap a shelf to unpack it!');
});
events.on('phaseChanged', ({ phase }) => {
  if (phase === 'open') toast("We're open! ☀️ Here come the customers.");
  if (phase === 'evening') toast('The sun is setting 🌙 Last customers of the day!');
});
events.on('expanded', ({ room }) => {
  focusRoom(room); // show off the new room
  if (room.type === 'display') {
    toast('Your Window Display is open! 🎉');
    setTimeout(() => toast('Tap the Dream Dollhouse to decorate it ✨'), 1200);
  } else if (room.type === 'stairs') {
    toast('Your 🪜 Stairwell is open! 🎉');
    setTimeout(() => toast('Now you can build rooms upstairs ✨'), 1200);
  } else if (room.type === 'landing') {
    toast(`Floor ${room.floor + 1} is open! 🪜🎉`);
    setTimeout(() => toast('Build rooms up here next to the stairs ✨'), 1200);
  } else {
    toast('Your new room is open! 🎉');
    setTimeout(() => toast('Fill its shelves to sell even more 🛍️'), 1200);
  }
});
// Ribbons (GDD #68): a pop-up at the counter for granted wishes and window wants, a toast for a complete theme.
let toldAboutRibbons = false;
events.on('ribbons', ({ amount, why }) => {
  if (why === 'wish' || why === 'window') {
    const p = checkoutView.counterTop();
    if (p) overlay.float(p.add(new THREE.Vector3(0.3, 0.9, 0)), `+${amount} 🎀`, 'ribbon', { delay: 0.35 });
    if (!toldAboutRibbons) {
      toldAboutRibbons = true;
      toast(why === 'wish' ? 'Wish granted! +1 🎀 Spend Ribbons in Grow → 🎨 Decorate rooms' : 'They got what they saw in the window! +1 🎀');
    }
  }
});
events.on('ribbons', ({ why, set, amount, style }) => {
  if (why !== 'theme') return;
  toast(`🌟 ${SETS[set]} complete! +${amount} 🎀`);
  if (style) setTimeout(() => toast(`🎁 New room style: ${styleName(style.kind, style.id)}! Try it in Grow → 🎨 Decorate rooms`), 1200);
});
// A complete theme's coin gift and shopkeeper style (GDD #70), with confetti. Toasts wait their turn
// behind the Ribbon and room style ones above.
let giftDelay = 0;
events.on('themeGift', ({ set, coins, look }) => {
  const wait = 2400 + giftDelay;
  giftDelay += 2400;
  setTimeout(() => {
    giftDelay -= 2400;
    juice.celebrate();
    toast(`🎁 ${SETS[set]} gift: +${coins} 🪙!`);
    setTimeout(() => toast(`👗 New shopkeeper style: ${look.name}! Tap your shopkeeper in the morning to try it`), 1200);
  }, wait);
});
events.on('wishGranted', () => audio.play('twinkle'));
events.on('dollhouseChanged', ({ slotId, gained }) => {
  const p = dollhouseView.worldPosition(slotId);
  if (p && gained > 0) overlay.float(p, `+${gained} ✨`, 'sparkle');
});
events.on('shelfFull', () => toast('That shelf is full! Try another one.'));
events.on('shelvesChanged', () => { shelvesView.rebuild(); boxesView.rebuild(); });
events.on('keeperEnteredRoom', ({ roomId }) => {
  if (roomById(roomId)?.type === 'display') toast('Showing off the Dream Dollhouse ✨ More window shoppers!');
});
events.on('keeperArrived', ({ greeting }) => { if (greeting) toast('Waiting by the door to greet customers 👋'); });
let toldAboutCounter = false;
events.on('customerArrived', () => {
  if (toldAboutCounter) return;
  toldAboutCounter = true;
  toast('A customer! Stand behind the counter to ring them up 🛎️');
});

/** A ring where she's headed (the end of her route, in the coordinates of the room it ends in). */
function tapFeedback() {
  const spot = routeEnd(state.keeper);
  if (!spot) return;
  audio.play('tap');
  const o = roomOrigin(spot.roomId);
  fx.tapRing(new THREE.Vector3(o.x + spot.x, o.y + spot.y + groundAt(spot.z), o.z + spot.z));
}

/** Bobbing icons over the bonus spots (hidden while decorating or in the creator). */
const shownMarkers = new Set();
function updateSpotMarkers() {
  const list = decorate.isOpen || creator.isOpen || styler.isOpen ? [] : spotsView.markers();
  const keep = new Set(list.map((m) => m.id));
  for (const id of shownMarkers) if (!keep.has(id)) { overlay.removeBubble(`spot-${id}`); shownMarkers.delete(id); }
  for (const m of list) {
    overlay.bubble(`spot-${m.id}`, () => m.position, m.icon, `spot spot-${m.id}`);
    shownMarkers.add(m.id);
  }
}

/** A glowing bonus spot (views/spots.js): the greeter spot or the show-off spot by the dollhouse. */
function tapSpot(id) {
  if (id === 'showoff') {
    const room = displayRoom(state);
    if (room && focusedRoomId !== room.id) focusRoom(room);
    if (walkToShowOff(state, navs)) tapFeedback();
  } else if (walkToGreeter(state, navs)) {
    tapFeedback();
  }
}

/** The sidewalk: in front of the shop door she waits to greet people; anywhere else she just goes there. */
function tapStreet(point) {
  const o = roomOrigin(shopRoom(state).id);
  const x = point.x - o.x;
  const ok = Math.abs(x - GREETER.x) < 0.75 && !hasHelper(state, 'greeter') // Ollie's spot once he's hired
    ? walkToGreeter(state, navs)
    : (() => {
        const b = streetBounds(state);
        const z = Math.min(SIDEWALK.maxZ, Math.max(SIDEWALK.minZ, point.z - o.z));
        return walkTo(state, navs, { street: true, x: Math.min(b.maxX, Math.max(b.minX, x)), z }, { face: 0 });
      })();
  if (ok) tapFeedback();
}

const quality = createQuality(renderer, () => resize());

function resize() {
  const w = app.clientWidth, h = app.clientHeight;
  renderer.setPixelRatio(quality.pixelRatio);
  renderer.setSize(w, h, false);
  rig.resize(w / h);
}
new ResizeObserver(resize).observe(app);
resize();

// ---------------------------------------------------------------------------
// Saving
// ---------------------------------------------------------------------------
let resetting = false;
const save = () => { if (!resetting) saveGame(state); };
setInterval(save, AUTOSAVE_SECONDS * 1000);
document.addEventListener('visibilitychange', () => { if (document.hidden) save(); });
addEventListener('pagehide', save);
for (const e of ['orderPlaced', 'dayStarted', 'stocked', 'sale', 'phaseChanged', 'dayClosed', 'expanded', 'dollhouseChanged', 'upgradeBought', 'helperHired', 'lunchDelivery', 'decorChanged', 'decorBought']) events.on(e, save);

// ---------------------------------------------------------------------------
// Debug (?debug)
// ---------------------------------------------------------------------------
let debug = null;
if (new URLSearchParams(location.search).has('debug')) {
  import('./ui/debug.js').then(({ createDebug }) => {
    debug = createDebug({
      state, renderer, quality,
      onViewAll: focusAll,
      onStockChanged: () => shelvesView.rebuild(),
      onReset() {
        resetting = true;
        saveGame(createState()); // a new game (on the test build, clearing would copy the real save again)
        location.reload();
      },
      // Test build only: drop its own save so the next load copies the real one again.
      onCopyMain: IS_DEV ? () => {
        resetting = true;
        clearSave();
        location.reload();
      } : null,
    });
  });
}

// ---------------------------------------------------------------------------
// Loop
// ---------------------------------------------------------------------------
dayUI.resume();
giftCompleteThemes(state); // themes finished before the update get their gifts now (GDD #70)
if (!state.shopkeeper.created) creator.open(); // new game, or the first time after the update
else if (state.day.number === 1 && state.day.phase === 'morning') toast('Stock your shelves, then tap Open shop ☀️');
fx.warmUp(renderer, rig.camera);
window.__booted = true; // tells the loading guard in index.html the game started

startLoop({
  tickRate: 10,
  tick(dt) {
    keeperView.beforeTick();
    helpersView.beforeTick();
    customersView.beforeTick();
    tickKeeper(state, dt);
    tickHelpers(state, dt);
    tickStockers(state, navs, dt);
    tickCustomers(state, navs, dt);
    separate(state, navs);
    tickDay(state, dt);
    advanceTutorial(state);
  },
  frame(dt, time, alpha) {
    lighting.setTwilight(twilightFor(state.day));
    lighting.update(dt);
    keeperView.frame(dt, alpha);
    helpersView.frame(dt, alpha);
    boxesView.update(dt);
    shelvesView.update(dt);
    customersView.frame(dt, alpha);
    checkoutView.update(dt);
    dollhouseView.update(dt);
    spotsView.update(dt);
    updateSpotMarkers();
    updatePlaceSpots();
    fx.update(dt);
    rig.update(dt, time);
    hud.update();
    dayUI.update();
    grow.update();
    bubbles.update(dt);
    guide.update(dt);
    overlay.update(dt);
    quality.frame(dt);
    debug?.frame(dt);
    renderer.render(scene, rig.camera);
  },
});
