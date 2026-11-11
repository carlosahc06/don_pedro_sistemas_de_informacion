const CACHE_NAME = "don-pedro-v2";
const APP_SHELL = [
  "/",
  "/index.html",
  "/css/base.css",
  "/css/layout.css",
  "/css/views.css",
  "/css/responsive.css",
  "/js/main.js",
  "/js/app-core.js",
  "/js/events.js",
  "/js/state.js",
  "/js/utils/format.js",
  "/js/data/api.js",
  "/js/data/errors.js",
  "/js/data/local-store.js",
  "/js/data/seed.js",
  "/js/components/helpers.js",
  "/js/components/modals.js",
  "/js/views/tables.js",
  "/js/views/menu.js",
  "/js/views/confirmation.js",
  "/js/views/kitchen.js",
  "/js/views/admin.js",
  "/manifest.webmanifest",
  "/icons/icon.svg",
  "/icons/icon-192.png",
  "/icons/icon-512.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.pathname.startsWith("/api/")) {
    event.respondWith(fetch(request));
    return;
  }

  event.respondWith(
    fetch(request)
      .then((response) => {
        const copy = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
        return response;
      })
      .catch(() => caches.match(request).then((cached) => cached || caches.match("/index.html")))
  );
});
