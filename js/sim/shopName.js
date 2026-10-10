// The shop's name (GDD #91): typed by the player, shown on the roof sign, the share picture's frame and
// the visit page. An empty name means the game's own sign, "My Dream Dollhouse Shop". Names reach
// whoever a player sends a link to, so they're cleaned and checked (data/badwords.js), and the visit
// page checks them again, since anyone can hand-make a link.

import { ANYWHERE, WHOLE } from '../data/badwords.js';
import { events } from '../core/events.js';

export const NAME_MAX = 20;
export const DEFAULT_SIGN = ['My Dream', 'Dollhouse Shop'];

const LOOKALIKE = { 0: 'o', 1: 'i', 3: 'e', 4: 'a', 5: 's', 7: 't', 8: 'b', 9: 'g', '!': 'i' };
const squeeze = (s) => s.replace(/(.)\1+/g, '$1');

/** Letters (any language), digits, spaces and a little punctuation; no emoji, no @ or /. At most NAME_MAX characters. */
export function cleanName(raw) {
  const s = String(raw ?? '').normalize('NFC')
    .replace(/[’‘]/g, "'")
    .replace(/[^\p{L}\p{M}\p{N} '&!.,?-]/gu, '')
    .replace(/\s+/g, ' ')
    .trim();
  return [...s].slice(0, NAME_MAX).join('').trim();
}

/** The name as words to check: lowercase, no accents, look-alikes undone; runs of single letters ("f u n") joined. */
function words(name) {
  const plain = name.toLowerCase().normalize('NFD').replace(/\p{M}/gu, '')
    .replace(/[0-9!]/g, (c) => LOOKALIKE[c] ?? c);
  const out = [];
  for (const w of plain.split(/[^a-z]+/).filter(Boolean)) {
    if (w.length === 1 && out.length && out.at(-1).single) out.at(-1).text += w;
    else out.push({ text: w, single: w.length === 1 });
  }
  return out.map((w) => w.text);
}

/** Why a (cleaned) name can't be used, as a friendly line; null when it's fine. */
export function nameProblem(name) {
  if (!name) return null;
  if ((name.match(/\d/g) ?? []).length >= 5) return 'No phone numbers or long numbers, please!';
  if (/www|https?|\.(com|net|org|co|io|ie|uk|au|gg|ly|me)\b/i.test(name)) return 'No websites in shop names, please!';
  for (const w of words(name)) {
    const sq = squeeze(w);
    if (WHOLE.includes(w) || WHOLE.includes(sq)) return 'Oops! Try a different name.';
    if (ANYWHERE.some((bad) => w.includes(bad) || (squeeze(bad).length >= 4 && sq.includes(squeeze(bad))))) return 'Oops! Try a different name.';
  }
  return null;
}

/** A name that's safe to show (a link's name is checked again on the visit page); '' if it isn't. */
export function safeName(raw) {
  const name = cleanName(raw);
  return nameProblem(name) ? '' : name;
}

/** Names the shop. Returns { ok, name } or { ok: false, problem }. An empty name goes back to the game's sign. */
export function setShopName(state, raw) {
  const name = cleanName(raw);
  const problem = nameProblem(name);
  if (problem) return { ok: false, problem };
  if (name !== state.shopName) {
    state.shopName = name;
    events.emit('shopNamed', { name });
  }
  return { ok: true, name };
}

/** The roof sign's lines: the game's own sign, or the name on one line, or two lines split near the middle. */
export function signLines(name) {
  if (!name) return DEFAULT_SIGN;
  if (name.length <= 12 || !name.includes(' ')) return [name];
  let best = -1;
  for (let i = name.indexOf(' '); i !== -1; i = name.indexOf(' ', i + 1)) {
    if (best === -1 || Math.abs(i - name.length / 2) < Math.abs(best - name.length / 2)) best = i;
  }
  return [name.slice(0, best), name.slice(best + 1)];
}
