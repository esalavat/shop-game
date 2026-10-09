// Which build this is: 'main' (the public game, and local development) or 'dev' (the test build at
// /dev/). scripts/stamp.js writes it into <html data-channel>; in Node tests there's no document.
// Both builds share one origin, so anything stored in the browser must be kept apart by channel.

export const CHANNEL = globalThis.document?.documentElement.dataset.channel || 'main';
export const IS_DEV = CHANNEL !== 'main';
export const BUILD = globalThis.document?.documentElement.dataset.version || 'local';
