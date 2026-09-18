// Service worker for GIDS ERP apps.
//
// Strategy: network-first, cache-as-fallback. This app is under active
// development — a cache-first strategy would risk serving people a stale,
// possibly-buggy old version even while online. Instead: always try the
// network first (so everyone gets the latest deployed code), and only fall
// back to the cache when there's genuinely no connection (so the app still
// opens offline, just possibly showing the last-seen version).
//
// Bump CACHE_NAME's version suffix whenever you want to force clients to
// drop old cached entries after a deploy.
const CACHE_NAME = "gids-owner-v1";
const APP_SHELL = ["./"];

self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)).catch(() => {})
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        const copy = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy)).catch(() => {});
        return response;
      })
      .catch(() => caches.match(event.request).then((cached) => cached || caches.match("./")))
  );
});
