const CACHE = "fittrack-v1";
const ASSETS = ["/", "/index.html", "/manifest.json"];

self.addEventListener("install", e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", e => {
  // Network first for CDN scripts, cache first for app shell
  const url = new URL(e.request.url);
  if (url.hostname !== location.hostname) {
    // CDN resources — try network, fall back to cache
    e.respondWith(
      fetch(e.request).catch(() => caches.match(e.request))
    );
    return;
  }
  // App shell — cache first
  e.respondWith(
    caches.match(e.request).then(cached => {
      const networkFetch = fetch(e.request).then(response => {
        caches.open(CACHE).then(c => c.put(e.request, response.clone()));
        return response;
      });
      return cached || networkFetch;
    })
  );
});
