// Tiny event bus. The sim emits; render and UI listen (coin pops, sounds, dialogue).

export function createEmitter() {
  const handlers = new Map();
  return {
    on(name, fn) {
      if (!handlers.has(name)) handlers.set(name, new Set());
      handlers.get(name).add(fn);
      return () => handlers.get(name).delete(fn);
    },
    emit(name, payload) {
      for (const fn of handlers.get(name) ?? []) fn(payload);
    },
  };
}

export const events = createEmitter();
