// The first-day guide (GDD #57): one step at a time, an arrow points at the next thing to tap. Only
// in a brand-new game; it only moves forward, and catches up if the player skips ahead.
//
// state.tutorial: 'box' (pick up a doorstep box) → 'shelf' (unpack it) → 'open' (Open shop) →
// 'register' (ring up the first customer) → 'done'.

export const TUTORIAL_STEPS = ['box', 'shelf', 'open', 'register', 'done'];

const anyStocked = (state) => state.building.rooms.some((r) => r.fixtures.some((f) => f.slots?.some(Boolean)));
const opened = (state) => state.day.phase !== 'morning' || state.day.number > 1;

/** When each step is finished. */
const FINISHED = {
  box: (s) => !!s.keeper.carrying || anyStocked(s) || opened(s),
  shelf: (s) => anyStocked(s) || opened(s),
  open: opened,
  register: (s) => s.day.stats.served > 0,
};

/** Move past every finished step. Returns the current step. */
export function advanceTutorial(state) {
  while (state.tutorial !== 'done' && FINISHED[state.tutorial]?.(state) !== false) {
    state.tutorial = TUTORIAL_STEPS[TUTORIAL_STEPS.indexOf(state.tutorial) + 1] ?? 'done';
  }
  return state.tutorial;
}
