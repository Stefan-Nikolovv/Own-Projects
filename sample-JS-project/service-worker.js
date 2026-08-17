const CACHE_NAME = "emotion-in-motion-v36";
const APP_SHELL = [
  "/",
  "/index.html",
  "/manifest.webmanifest",
  "/css/style.css",
  "/js/script.js",
  "/js/router.js",
  "/js/i18n.js",
  "/pages/schedule/schedule.html",
  "/pages/schedule/schedule.js",
  "/pages/schedule/schedule-features.js",
  "/pages/schedule/schedule-utils.js",
  "/assets/img/output-image.png"
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
  const requestUrl = new URL(event.request.url);
  if (event.request.method !== "GET" || requestUrl.origin !== self.location.origin) return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        const copy = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
        return response;
      })
      .catch(() => caches.match(event.request).then((cached) => cached || caches.match("/index.html")))
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(clients.openWindow("/#schedule"));
});
