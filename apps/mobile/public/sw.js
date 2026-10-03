// Wandro service worker: lets the web app install on desktops and open offline.
// Network first (always fresh when online); cached copy when offline. Map tiles are not cached.
const CACHE = 'wandro-v2';

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET' || new URL(request.url).origin !== self.location.origin) return;
  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response.ok) {
          const copy = response.clone();
          caches.open(CACHE).then((cache) => cache.put(request, copy));
        }
        return response;
      })
      .catch(
        async () =>
          (await caches.match(request)) ||
          (request.mode === 'navigate' ? caches.match(self.registration.scope) : undefined),
      ),
  );
});
