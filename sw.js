// Service worker: lets the installed game open without a connection (GDD #50).
//
// Network first, always: online, every request goes to the network as usual (so a new deploy is
// picked up right away, and the version-stamped module URLs from scripts/stamp.js keep working);
// each good response is also copied into the cache. Only when the network fails does the cache
// answer. Cache keys drop the query string (?v=..., ?debug), so the cache holds one copy of each
// file, the last one fetched, instead of growing with every deploy.

const CACHE = 'mdds';

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()));

const keyFor = (url) => {
  const u = new URL(url);
  u.search = '';
  u.hash = '';
  return u.href;
};

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  e.respondWith((async () => {
    try {
      const res = await fetch(req);
      if (res.ok) {
        const copy = res.clone();
        e.waitUntil(caches.open(CACHE).then((c) => c.put(keyFor(req.url), copy)));
      }
      return res;
    } catch (err) {
      const hit = await caches.match(keyFor(req.url));
      if (hit) return hit;
      throw err;
    }
  })());
});
