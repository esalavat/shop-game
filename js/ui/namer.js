// Name your shop (GDD #91): a panel at the top of the screen (so the phone's keyboard doesn't cover it),
// opened from the Grow sheet or by tapping the roof sign. Type a name, or tap 🎲 for an idea; Save puts it
// on the sign. A name the filter turns down (sim/shopName.js) gets a friendly note and isn't saved.

import { setShopName, NAME_MAX, DEFAULT_SIGN } from '../sim/shopName.js';

const IDEAS = {
  first: ['Sparkly', 'Cozy', 'Tiny', 'Sweet', 'Dreamy', 'Starry', 'Rosy', 'Little', 'Happy', 'Magic', 'Velvet', 'Sunny', 'Twinkle', 'Lucky'],
  second: ['Teacup', 'Bunny', 'Cottage', 'Ribbon', 'Daisy', 'Cupcake', 'Button', 'Petal', 'Kitten', 'Moonbeam', 'Acorn', 'Pony', 'Lantern'],
  last: ['Shop', 'Boutique', 'Corner', 'House', 'Nook', 'Store', 'Market'],
};

/** A made-up name that fits the sign, like "Cozy Cupcake Corner" or "The Tiny Petal". */
export function nameIdea(rand = Math.random) {
  const any = (list) => list[Math.floor(rand() * list.length)];
  for (;;) {
    const name = rand() < 0.3 ? `The ${any(IDEAS.first)} ${any(IDEAS.second)}` : `${any(IDEAS.first)} ${any(IDEAS.second)} ${any(IDEAS.last)}`;
    if (name.length <= NAME_MAX) return name;
  }
}

export function createNamer(state, { onBoop }) {
  const sheet = document.getElementById('namer');
  const input = sheet.querySelector('input');
  const note = sheet.querySelector('.namer-note');
  input.maxLength = NAME_MAX;
  input.placeholder = DEFAULT_SIGN.join(' ');

  const close = () => { input.blur(); sheet.hidden = true; };
  const say = (text, bad = false) => { note.textContent = text; note.classList.toggle('bad', bad); };
  const hint = () => say('Make up a fun name, not your real one! ✨');

  sheet.querySelector('.close').addEventListener('click', close);
  sheet.addEventListener('click', (e) => { if (e.target === sheet) close(); });
  sheet.querySelector('.namer-idea').addEventListener('click', () => { input.value = nameIdea(); hint(); });
  sheet.querySelector('.namer-reset').addEventListener('click', () => { input.value = ''; save(); });
  sheet.querySelector('form').addEventListener('submit', (e) => { e.preventDefault(); save(); });
  input.addEventListener('input', () => { if (note.classList.contains('bad')) hint(); });

  function save() {
    const result = setShopName(state, input.value);
    if (!result.ok) { onBoop(); return say(result.problem, true); }
    close(); // the sign changes on the sim's shopNamed event (main.js)
  }

  return {
    get isOpen() { return !sheet.hidden; },
    open() {
      input.value = state.shopName;
      hint();
      sheet.hidden = false;
      input.focus();
    },
    close,
  };
}
