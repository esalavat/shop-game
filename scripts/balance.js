// Balancing measurements (GDD §18 #10, #15): plays the real sim headless with a simple bot player for
// many days and reports how the economy grows. Not a test; numbers to tune with.
//
//   node scripts/balance.js                 one run, a line per day, then milestones
//   node scripts/balance.js --days 80 --seeds 5   milestone days over several seeds (median)
//   node scripts/balance.js --json out.json      also write every day's numbers
//
// The bot plays like a keen player: in the morning it unpacks boxes, then opens; during the day it
// rings people up (4 taps a second) and restocks; it closes early when sold out. At closing it fills
// the Dream Dollhouse with its sparkliest finds, orders one box of every new item it can (to grow the
// Collection), refills the shelves with the best-paying colors, then spends what's left on growth
// (the cheapest of what the Grow sheet offers: the ladder of helpers and upgrades, rooms, floors, registers).
// It never uses Lunchtime Delivery (it only orders at closing), greets, or shows off the dollhouse.

import { writeFileSync } from 'node:fs';
import { createState } from '../js/sim/state.js';
import { buildNav } from '../js/sim/nav.js';
import { tickKeeper, walkToFixture, walkToBox, walkTo } from '../js/sim/keeper.js';
import { tickHelpers, miaAtTill } from '../js/sim/helpers.js';
import { tickStockers, chooseBox, shelfFor } from '../js/sim/stocker.js';
import { tickCustomers } from '../js/sim/customers.js';
import { separate } from '../js/sim/crowd.js';
import { tickDay, openShop, closeEarly, soldOut, startNextDay } from '../js/sim/day.js';
import { checkoutTap, counterOf, keeperAtCounter, registerOf } from '../js/sim/checkout.js';
import { placeOrder } from '../js/sim/orders.js';
import { canOrder, foundCount, openPageCount, orderableItems } from '../js/sim/catalog.js';
import { stockCount, freeSlots, shopRoomId, canCarryMore } from '../js/sim/stock.js';
import { buyUpgrade, hireHelper, hasUpgrade, hasHelper, canBuyUpgrade, canHire, ladder } from '../js/sim/upgrades.js';
import {
  buildExpansion, nextExpansion, buildRoom, roomSpots, roomCost, canBuildRooms, buildStairwell, canBuildStairwell,
  stairCost, hasStairwell, buildFloor, buildRegister, nextRegisterFloor, registerCost, sellingRooms, isShelfRoom,
} from '../js/sim/building.js';
import { placeInDollhouse, displayRoom, trafficBoost, fitsSlot } from '../js/sim/collection.js';
import { collectionBonus, completeThemes } from '../js/sim/rewards.js';
import { ITEMS, STEPS, ROUNDS, COLLECTION, boxCost, baseOf } from '../js/data/items.js';
import { UPGRADES, HELPERS } from '../js/data/upgrades.js';
import { DOLLHOUSE_SLOTS } from '../js/data/dollhouse.js';
import { rng } from '../js/core/rng.js';

const args = process.argv.slice(2);
const opt = (name, def) => {
  const i = args.indexOf(`--${name}`);
  return i < 0 ? def : args[i + 1];
};
const DAYS = Number(opt('days', 60));
const SEEDS = Number(opt('seeds', 1));
const SEED = Number(opt('seed', 1));
const JSON_OUT = opt('json', null);

const DT = 0.1;
const TAP_EVERY = 0.25;     // a player taps the register about 4 times a second
const MORNING_MAX = 45;     // seconds the bot spends unpacking before it opens anyway
const MENU_TIME = 30;       // seconds a player spends in the closing summary, order book and Grow sheet

/** What the bot builds, cheapest first, besides the helpers and upgrades on the ladder (GDD #83). */
const BUILDS = ['display', 'stairwell', 'room', 'floor', 'register'];

// ---------------------------------------------------------------------------------------------------
// Buying growth
// ---------------------------------------------------------------------------------------------------

function cheapestSpot(state) {
  if (!canBuildRooms(state)) return null;
  return roomSpots(state).map((p) => ({ ...p, cost: roomCost(state, p.col, p.floor) })).sort((a, b) => a.cost - b.cost)[0] ?? null;
}

/** { cost, buy() } for a plan step, or null if it can't be bought (yet or ever). */
function offer(state, what) {
  if (what === 'display') {
    const e = nextExpansion(state);
    return e && { cost: e.cost, buy: () => buildExpansion(state) };
  }
  if (what === 'room') {
    const s = cheapestSpot(state);
    return s && { cost: s.cost, buy: () => buildRoom(state, s.col, s.floor) };
  }
  if (what === 'stairwell') return canBuildStairwell(state) ? { cost: stairCost(state), buy: () => buildStairwell(state) } : null;
  if (what === 'floor') return hasStairwell(state) ? { cost: stairCost(state), buy: () => buildFloor(state) } : null;
  if (what === 'register') return nextRegisterFloor(state) !== null ? { cost: registerCost(state), buy: () => buildRegister(state) } : null;
  if (UPGRADES[what]) {
    return !hasUpgrade(state, what) && canBuyUpgrade(state, what) ? { cost: UPGRADES[what].cost, buy: () => buyUpgrade(state, what) } : null;
  }
  if (HELPERS[what]) return !hasHelper(state, what) && canHire(state, what) ? { cost: HELPERS[what].cost, buy: () => hireHelper(state, what) } : null;
  throw new Error(`unknown plan step ${what}`);
}

/**
 * Spend leftover coins on growth, cheapest first: whatever the ladder offers now (GDD #83), the Window
 * Display and the Stairwell, and rooms, floors and register rooms (keeping half their price in hand: more
 * rooms bring more customers, CUSTOMER.perRoom). Returns what was bought ([{ what, cost }]).
 */
function buyGrowth(state) {
  const bought = [];
  for (;;) {
    const opts = [
      ...ladder(state).available.map((r) => ({ what: r.id, o: offer(state, r.id), keep: 1 })),
      ...BUILDS.map((w) => ({ what: w, o: offer(state, w), keep: ['display', 'stairwell'].includes(w) ? 1 : 1.5 })),
    ].filter((x) => x.o).sort((a, b) => a.o.cost - b.o.cost);
    const pick = opts.find((x) => state.coins >= x.o.cost * x.keep);
    // Saving up: never skip a ladder rung for a dearer room.
    if (!pick || opts.some((x) => x.keep === 1 && x.o.cost < pick.o.cost)) break;
    if (!pick.o.buy()) break;
    bought.push({ what: pick.what, cost: pick.o.cost });
  }
  return bought;
}

// ---------------------------------------------------------------------------------------------------
// Ordering and the dollhouse
// ---------------------------------------------------------------------------------------------------

const shelfCapacity = (state) => sellingRooms(state).flatMap((r) => r.fixtures).reduce((n, f) => n + (f.slots?.length ?? 0), 0);

function stockTotal(state) {
  let n = 0;
  for (const id of Object.keys(ITEMS)) {
    const c = stockCount(state, id);
    n += c.shelf + c.boxed + c.coming;
  }
  return n;
}

/** Order for tomorrow. Returns { boxes, spent, newItems }. */
function orderStock(state, soldToday) {
  let spent = 0, boxes = 0, newItems = 0;
  const order = (id) => {
    const cost = boxCost(id);
    if (!placeOrder(state, id)) return false;
    spent += cost; boxes++;
    return true;
  };
  // 1. One box of everything new you can order (cheapest first): that's how the Collection grows.
  const coming = new Set(state.orders.map((o) => o.itemId));
  const fresh = orderableItems(state).filter((id) => !state.collection[id] && !coming.has(id)).sort((a, b) => boxCost(a) - boxCost(b));
  for (const id of fresh) if (state.coins >= boxCost(id) && order(id)) newItems++;
  // 2. Fill the shelves: for each item, its best-paying color you can afford, best items first, a box at a time.
  // Stock for about two days of sales (a full shop on day 1), never more than the shelves hold.
  let gap = Math.min(shelfCapacity(state), Math.max(18, 2 * soldToday)) - stockTotal(state);
  const bases = [...new Set(orderableItems(state).map(baseOf))];
  for (let pass = 0; pass < 3 && gap > 0; pass++) {
    const best = (base) => orderableItems(state)
      .filter((id) => baseOf(id) === base && state.coins >= boxCost(id))
      .sort((a, b) => ITEMS[b].price - ITEMS[b].cost - (ITEMS[a].price - ITEMS[a].cost))[0];
    const picks = bases.map(best).filter(Boolean).sort((a, b) => ITEMS[b].price - ITEMS[b].cost - (ITEMS[a].price - ITEMS[a].cost));
    let any = false;
    for (const id of picks) {
      if (gap <= 0) break;
      if (state.coins >= boxCost(id) && order(id)) { gap -= ITEMS[id].perBox; any = true; }
    }
    if (!any) break;
  }
  return { boxes, spent, newItems };
}

/** The sparkliest finds in the Dream Dollhouse, one per room, no repeats. */
function fillDollhouse(state) {
  if (!displayRoom(state)) return;
  const used = new Set();
  for (const slot of DOLLHOUSE_SLOTS) {
    const best = Object.keys(state.collection)
      .filter((id) => state.collection[id] && fitsSlot(slot.id, id) && !used.has(id))
      .sort((a, b) => ITEMS[b].sparkle - ITEMS[a].sparkle)[0];
    if (!best) continue;
    used.add(best);
    placeInDollhouse(state, slot.id, best);
  }
}

// ---------------------------------------------------------------------------------------------------
// The shopkeeper during the day
// ---------------------------------------------------------------------------------------------------

const idle = (k) => !k.path.length && !k.task && !k.arriveRoom && !k.legs?.length;
const shelfSpace = (state) => sellingRooms(state).flatMap((r) => r.fixtures).filter((f) => f.slots).reduce((n, f) => n + freeSlots(f).length, 0);

function goToCounter(state, navs) {
  const counter = counterOf(state, shopRoomId(state));
  if (state.keeper.roomId !== shopRoomId(state) || !keeperAtCounter(state)) walkToFixture(state, navs, counter);
}

function tickBot(state, navs, bot, rand) {
  const k = state.keeper;
  const reg = registerOf(state, shopRoomId(state));
  const shopping = state.day.phase === 'open' || state.day.phase === 'evening';
  const atCounter = k.roomId === shopRoomId(state) && keeperAtCounter(state);

  // Taps at the register whenever she's behind it and someone is paying.
  bot.tap -= DT;
  if (atCounter && reg.checkout && bot.tap <= 0) {
    checkoutTap(state, rand);
    bot.tap = TAP_EVERY;
  }
  if (!idle(k)) return;

  const waiting = shopping && (reg.checkout || reg.queue.length) && !miaAtTill(state);
  if (waiting && !atCounter) return void goToCounter(state, navs);
  if (waiting) return;
  // Unpack what she's holding, or fetch another box if there's room for it.
  if (k.carrying) {
    const target = shelfFor(state, k);
    if (target && freeSlots(target.fixture).length) return void walkToFixture(state, navs, target.fixture, { type: 'stock', fixtureId: target.fixture.id });
  }
  const held = (k.carrying?.qty ?? 0) + (k.spare?.qty ?? 0);
  if (canCarryMore(state, k) && shelfSpace(state) > held) {
    const box = chooseBox(state);
    if (box && walkToBox(state, navs, box)) return;
  }
  // Nothing to stock: behind the counter (for the tips, even with Mia there).
  if (shopping && !atCounter) goToCounter(state, navs);
}

// ---------------------------------------------------------------------------------------------------
// One run
// ---------------------------------------------------------------------------------------------------

function run(seed, days, { log = false } = {}) {
  const rand = rng(seed);
  const state = createState(0);
  state.tutorial = 'done';
  state.shopkeeper.created = true;
  const navs = new Map();
  const rebuildNavs = () => { navs.clear(); for (const r of state.building.rooms) navs.set(r.id, buildNav(r)); };
  rebuildNavs();
  const bot = { tap: 0 };
  const rows = [];
  const milestones = {}; // name -> { day, minutes }
  const mark = (name, day, clock) => { if (!milestones[name]) milestones[name] = { day, minutes: +(clock / 60).toFixed(1) }; };
  let clock = 0; // seconds of play
  let lastPages = openPageCount(state);

  for (let day = 1; day <= days; day++) {
    const start = { coins: state.coins, clock };
    let morning = 0;
    // Morning: unpack, then open.
    while (state.day.phase === 'morning') {
      tickBot(state, navs, bot, rand);
      tick(state, navs, rand);
      morning += DT; clock += DT;
      const busy = state.boxes.length && shelfSpace(state) > 0 || state.keeper.carrying && shelfSpace(state) > 0 || !idle(state.keeper);
      if (!busy || morning >= MORNING_MAX) openShop(state);
    }
    // Open hours and evening.
    let guard = 0;
    while (state.day.phase !== 'close' && guard++ < 6000) {
      tickBot(state, navs, bot, rand);
      tick(state, navs, rand);
      clock += DT;
      if (state.day.phase === 'open' && soldOut(state)) closeEarly(state);
    }
    if (state.day.phase !== 'close') throw new Error(`day ${day} never closed (seed ${seed})`);
    const stats = state.day.stats;
    const earned = state.coins - start.coins;
    // Closing: the menus.
    state.customers = state.customers.filter((c) => c.state !== 'leaving'); // walking off behind the summary
    clock += MENU_TIME;
    fillDollhouse(state);
    const sold = Object.values(stats.sold).reduce((a, b) => a + b, 0);
    const ordered = orderStock(state, sold);
    const bought = buyGrowth(state);
    if (bought.length) rebuildNavs();
    fillDollhouse(state);
    for (const b of bought) mark(b.what === 'room' || b.what === 'floor' || b.what === 'register' ? `${b.what} #${countOf(state, b.what)}` : b.what, day, clock);

    const row = {
      day, minutes: +((clock - start.clock) / 60).toFixed(1), earned, sales: stats.coins, tips: stats.tips, served: stats.served,
      wishes: stats.wishes.length, coins: state.coins, stockSpend: ordered.spent, newItems: ordered.newItems,
      hearts: state.hearts, found: foundCount(state), themes: completeThemes(state).length, sparkle: state.sparkle,
      traffic: +trafficBoost(state).toFixed(2), collBonus: +collectionBonus(state).toFixed(2),
      capacity: shelfCapacity(state), shelfRooms: state.building.rooms.filter(isShelfRoom).length,
      bought: bought.map((b) => `${b.what}(${b.cost})`).join(' '),
    };
    rows.push(row);
    const pages = openPageCount(state);
    for (let p = lastPages; p < pages; p++) mark(`step ${p} (${ROUNDS[STEPS[p].round].name || 'round 1'} page ${STEPS[p].page + 1})`, day, clock);
    lastPages = pages;
    if (foundCount(state) === Object.keys(ITEMS).length) mark('whole Collection found', day, clock);
    if (collectionBonus(state) >= COLLECTION.maxBonus) mark('Collection bonus maxed', day, clock);
    if (log) printRow(row);
    startNextDay(state);
  }
  return { rows, milestones, state };
}

function countOf(state, what) {
  if (what === 'room') return state.building.rooms.filter(isShelfRoom).length;
  if (what === 'register') return state.building.rooms.filter((r) => r.type === 'register').length;
  return state.building.rooms.filter((r) => r.type === 'stairs' || r.type === 'landing').length - 1; // floors above the ground
}

function tick(state, navs, rand) {
  tickKeeper(state, DT);
  tickHelpers(state, DT, rand);
  tickStockers(state, navs, DT);
  tickCustomers(state, navs, DT, rand);
  separate(state, navs);
  tickDay(state, DT);
}

// ---------------------------------------------------------------------------------------------------
// Output
// ---------------------------------------------------------------------------------------------------

const COLS = [
  ['day', 4], ['minutes', 5, 'min'], ['earned', 8], ['served', 4, 'cust'], ['tips', 5], ['wishes', 4, 'wish'], ['coins', 9],
  ['stockSpend', 8, 'stock$'], ['hearts', 6], ['found', 5], ['themes', 4, 'thm'], ['sparkle', 4, 'spk'], ['traffic', 5, 'trfc'],
  ['collBonus', 5, 'coll'], ['capacity', 4, 'cap'], ['bought', 0],
];
const fmt = (v) => (typeof v === 'number' && Math.abs(v) >= 1e6 ? `${(v / 1e6).toFixed(1)}M` : typeof v === 'number' && Math.abs(v) >= 1e4 ? `${Math.round(v / 1e3)}k` : String(v));
function printHeader() { console.log(COLS.map(([k, w, label]) => (label ?? k).padStart(w)).join(' ')); }
function printRow(row) { console.log(COLS.map(([k, w]) => fmt(row[k]).padStart(w)).join(' ')); }

function printMilestones(milestones) {
  console.log('\nMilestones (day, minutes of play):');
  const list = Object.entries(milestones).sort((a, b) => a[1].minutes - b[1].minutes);
  for (const [name, { day, minutes }] of list) console.log(`  day ${String(day).padStart(3)}  ${String(minutes).padStart(6)} min  ${name}`);
}

const median = (xs) => { const s = [...xs].sort((a, b) => a - b); return s[Math.floor((s.length - 1) / 2)]; };

if (SEEDS === 1) {
  printHeader();
  const { rows, milestones } = run(SEED, DAYS, { log: true });
  printMilestones(milestones);
  if (JSON_OUT) writeFileSync(JSON_OUT, JSON.stringify({ seed: SEED, rows, milestones }, null, 2));
} else {
  const runs = [];
  for (let s = SEED; s < SEED + SEEDS; s++) runs.push(run(s, DAYS));
  const names = [...new Set(runs.flatMap((r) => Object.keys(r.milestones)))];
  console.log(`Milestones over ${SEEDS} seeds, ${DAYS} days (median day / minutes; how many runs got there):`);
  const rowsOut = names.map((n) => {
    const hits = runs.map((r) => r.milestones[n]).filter(Boolean);
    return { n, day: median(hits.map((h) => h.day)), minutes: median(hits.map((h) => h.minutes)), hits: hits.length };
  }).sort((a, b) => a.minutes - b.minutes);
  for (const r of rowsOut) console.log(`  day ${String(r.day).padStart(3)}  ${String(r.minutes).padStart(6)} min  ${r.n}  (${r.hits}/${SEEDS})`);
  for (const d of [10, 20, 40, DAYS].filter((d) => d <= DAYS)) {
    const at = runs.map((r) => r.rows[d - 1]);
    console.log(`  by day ${d}: median earned/day ${median(at.map((x) => x.earned))}, coins ${median(at.map((x) => x.coins))}, found ${median(at.map((x) => x.found))}`);
  }
  if (JSON_OUT) writeFileSync(JSON_OUT, JSON.stringify(runs.map((r, i) => ({ seed: SEED + i, rows: r.rows, milestones: r.milestones })), null, 2));
}
