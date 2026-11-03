const CACHE = 'keyring-v1';
const FILES = ['./', 'index.html', 'manifest.webmanifest', 'icon-192.png', 'icon-512.png', 'icon-maskable-512.png'];
self.addEventListener('install', e => e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting())));
self.addEventListener('activate', e => e.waitUntil(caches.keys()
  .then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))
  .then(() => self.clients.claim())));
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const same = new URL(e.request.url).origin === location.origin;
  const fonts = /fonts\.(googleapis|gstatic)\.com$/.test(new URL(e.request.url).hostname);
  if (!same && !fonts) return;
  /* 네트워크가 되면 새 버전을 받아 두고, 안 되면 저장본으로 동작 */
  e.respondWith(caches.open(CACHE).then(async c => {
    try {
      const r = await fetch(e.request);
      if (r.ok || r.type === 'opaque') c.put(e.request, r.clone());
      return r;
    } catch (err) {
      const hit = await c.match(e.request) || (e.request.mode === 'navigate' ? await c.match('index.html') : null);
      if (hit) return hit;
      throw err;
    }
  }));
});
