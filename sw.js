const CACHE = "apollum-v3";
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
  const url = new URL(e.request.url);
  if (url.hostname !== location.hostname) {
    e.respondWith(
      fetch(e.request).catch(() => caches.match(e.request))
    );
    return;
  }
  // Network first pour l'app shell — toujours récupérer la dernière version
  e.respondWith(
    fetch(e.request).then(response => {
      caches.open(CACHE).then(c => c.put(e.request, response.clone()));
      return response;
    }).catch(() => caches.match(e.request))
  );
});
