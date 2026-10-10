// Sharing a shop as a link (GDD #91): everything a friend needs to see the shop in 3D, packed into the
// part of the link after the `#` (never sent to any server). packShop / unpackShop turn the state into a
// small plain object and back; encodeShop / decodeShop squeeze that into link-safe text and out again.
//
// A link can be hand-made by anyone, so unpackShop trusts nothing: unknown room types, fixtures, items and
// looks are dropped or swapped for defaults, numbers are bounded, and the name goes through the same
// filter as typing one (sim/shopName.js). Whatever comes in, the visit page gets a shop it can draw.
//
// Link text: `v1.` + base64url(deflate-raw(JSON)). A later format gets a new prefix; old links keep working.

import { ROOM_TYPES } from '../data/rooms.js';
import { FIXTURES } from '../data/fixtures.js';
import { ITEMS } from '../data/items.js';
import { DOLLHOUSE_SLOTS } from '../data/dollhouse.js';
import { CREATOR } from '../data/customers.js';
import { safeName } from './shopName.js';

export const SHARE_FORMAT = 'v1';
const LIMITS = { rooms: 200, col: 60, floor: 40, fixtures: 12, slots: 24, text: 24 };
const DEFAULT_LOOK = { body: 'girl', hair: 'bun', hairColor: '#c2563a', skin: '#ffd9c2', outfit: '#9fe0c8', accessory: 'none' };

const round = (n) => Math.round(n * 100) / 100;

/** The parts of a shop a visitor sees: its rooms (styles, fixtures, shelf items), Dream Dollhouse, shopkeeper and name. */
export function packShop(state) {
  const k = state.shopkeeper;
  return {
    n: state.shopName || '',
    k: { body: k.body, hair: k.hair, hairColor: k.hairColor, skin: k.skin, outfit: k.outfit, accessory: k.accessory },
    h: { ...state.dollhouse.slots },
    r: state.building.rooms.map((room) => [
      room.type, room.col, room.floor, room.style ?? null, room.decor ?? null,
      room.fixtures.map((f) => [f.kind, round(f.x), round(f.z), f.slots ?? 0]),
    ]),
  };
}

const int = (v, min, max) => (Number.isInteger(v) && v >= min && v <= max ? v : null);
const num = (v, lim) => (typeof v === 'number' && Number.isFinite(v) && Math.abs(v) <= lim ? v : null);
const item = (v) => (typeof v === 'string' && Object.hasOwn(ITEMS, v) ? v : null);

/** Room styles are drawn with fallbacks (data/decor.js roomLook), so short strings are enough here. */
function cleanDecor(d) {
  if (!d || typeof d !== 'object' || Array.isArray(d)) return null;
  const out = {};
  for (const [kind, id] of Object.entries(d).slice(0, 12)) {
    if (/^[a-z]{1,12}$/.test(kind) && typeof id === 'string' && id.length <= LIMITS.text) out[kind] = id;
  }
  return Object.keys(out).length ? out : null;
}

function cleanLook(k) {
  const look = { ...DEFAULT_LOOK };
  if (!k || typeof k !== 'object') return look;
  const has = (list, v) => list.some((o) => (Array.isArray(o) ? o[0] : o) === v);
  if (has(CREATOR.bodies, k.body)) look.body = k.body;
  const hair = CREATOR.hair[look.body];
  look.hair = has(hair, k.hair) ? k.hair : has(hair, DEFAULT_LOOK.hair) ? DEFAULT_LOOK.hair : hair[0][0];
  look.accessory = has(CREATOR.accessories[look.body], k.accessory) ? k.accessory : 'none';
  if (has(CREATOR.hairColors, k.hairColor)) look.hairColor = k.hairColor;
  if (has(CREATOR.skins, k.skin)) look.skin = k.skin;
  if (has(CREATOR.outfits, k.outfit)) look.outfit = k.outfit;
  return look;
}

/**
 * A packed shop back into the pieces of state the visit page draws: { shopName, shopkeeper, dollhouse,
 * building }. Throws if there's no shop to show at all.
 */
export function unpackShop(p) {
  if (!p || typeof p !== 'object' || !Array.isArray(p.r)) throw new Error('not a shop');
  const rooms = [], taken = new Set();
  for (const raw of p.r.slice(0, LIMITS.rooms)) {
    if (!Array.isArray(raw)) continue;
    const [type, c, f, style, decor, fixtures] = raw;
    const col = int(c, -LIMITS.col, LIMITS.col), floor = int(f, 0, LIMITS.floor);
    if (!Object.hasOwn(ROOM_TYPES, type) || col === null || floor === null || taken.has(`${col},${floor}`)) continue;
    taken.add(`${col},${floor}`);
    const id = `r${rooms.length + 1}`;
    const room = { id, type, col, floor, fixtures: [] };
    if (int(style, 0, 99) !== null) room.style = style;
    const d = cleanDecor(decor);
    if (d) room.decor = d;
    for (const fx of (Array.isArray(fixtures) ? fixtures : []).slice(0, LIMITS.fixtures)) {
      if (!Array.isArray(fx)) continue;
      const [kind, x, z, slots] = fx;
      if (!Object.hasOwn(FIXTURES, kind) || num(x, 3) === null || num(z, 3) === null) continue;
      const fixture = { id: `${id}-f${room.fixtures.length}`, kind, x, z };
      if (FIXTURES[kind].slots) {
        const list = Array.isArray(slots) ? slots.slice(0, LIMITS.slots) : [];
        fixture.slots = list.length ? list.map(item) : Array(FIXTURES[kind].slots).fill(null);
      }
      room.fixtures.push(fixture);
    }
    rooms.push(room);
  }
  // Nothing floats: drop rooms with nothing under them, from the bottom up.
  const cells = new Set(rooms.filter((r) => r.floor === 0).map((r) => `${r.col},0`));
  for (const r of [...rooms].sort((a, b) => a.floor - b.floor)) if (r.floor > 0 && cells.has(`${r.col},${r.floor - 1}`)) cells.add(`${r.col},${r.floor}`);
  const standing = rooms.filter((r) => cells.has(`${r.col},${r.floor}`));
  if (!standing.some((r) => r.type === 'shop')) throw new Error('no shop');

  const slots = {};
  const h = p.h && typeof p.h === 'object' ? p.h : {};
  for (const s of DOLLHOUSE_SLOTS) if (item(h[s.id])) slots[s.id] = h[s.id];
  return {
    shopName: safeName(typeof p.n === 'string' ? p.n.slice(0, 64) : ''),
    shopkeeper: { ...cleanLook(p.k), created: true },
    dollhouse: { slots },
    building: { rooms: standing },
  };
}

// --- link text ---

function toBase64Url(bytes) {
  let bin = '';
  for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromBase64Url(text) {
  const bin = atob(text.replace(/-/g, '+').replace(/_/g, '/'));
  return Uint8Array.from(bin, (c) => c.charCodeAt(0));
}

async function pipe(bytes, stream) {
  const out = new Response(new Blob([bytes]).stream().pipeThrough(stream));
  return new Uint8Array(await out.arrayBuffer());
}

const MAX_TEXT = 40000, MAX_LINK_BYTES = 256 * 1024; // a real shop is a few KB; anything much bigger isn't one

/** The shop as link text ("v1.…"). */
export async function encodeShop(state) {
  const json = new TextEncoder().encode(JSON.stringify(packShop(state)));
  return `${SHARE_FORMAT}.${toBase64Url(await pipe(json, new CompressionStream('deflate-raw')))}`;
}

/** Link text back into a shop to draw (unpackShop); throws if it isn't one. */
export async function decodeShop(text) {
  const m = /^v1\.([A-Za-z0-9_-]+)$/.exec(String(text).trim());
  if (!m || m[1].length > MAX_TEXT) throw new Error('not a shop link');
  const bytes = await pipe(fromBase64Url(m[1]), new DecompressionStream('deflate-raw'));
  if (bytes.length > MAX_LINK_BYTES) throw new Error('too big');
  return unpackShop(JSON.parse(new TextDecoder().decode(bytes)));
}

/** The visit page's address for this build (the public game or the test build), with the shop after the #. */
export function visitUrl(pageUrl, text) {
  return `${new URL('visit.html', pageUrl).href}#${text}`;
}
