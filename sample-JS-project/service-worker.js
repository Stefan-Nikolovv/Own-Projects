const CACHE_NAME = "emotion-in-motion-v58";
const APP_SHELL = [
  "/",
  "/index.html",
  "/manifest.webmanifest",
  "/service-worker.js",
  "/css/style.css",
  "/js/config.js",
  "/js/booking-access.js",
  "/js/i18n.js",
  "/js/main.js",
  "/js/router.js",
  "/js/script.js",
  "/js/supabase.js",
  "/pages/home/home.html",
  "/pages/home/home.js",
  "/pages/contact/contact.html",
  "/pages/contact/contact.js",
  "/pages/login/login.html",
  "/pages/login/login.js",
  "/pages/schedule/schedule.html",
  "/pages/schedule/schedule.js",
  "/pages/schedule/schedule-features.js",
  "/pages/schedule/schedule-utils.js",
  "/assets/favicon/favicon.ico",
  "/assets/img/output-image.png",
  "/assets/img/633924370_33756133897334957_3532156883998730759_n.jpg",
];

const RUNTIME_ORIGINS = new Set([
  "https://cdn.jsdelivr.net",
  "https://cdnjs.cloudflare.com",
  "https://fonts.googleapis.com",
  "https://fonts.gstatic.com",
]);

function normalizedCacheKey(request) {
  const url = new URL(request.url);
  url.searchParams.delete("v");
  return url.toString();
}

async function cacheResponse(key, response) {
  if (!response || (!response.ok && response.type !== "opaque")) return;
  const cache = await caches.open(CACHE_NAME);
  await cache.put(key, response.clone());
}

async function networkFirstNavigation(request) {
  try {
    const response = await fetch(request);
    await cacheResponse("/index.html", response);
    return response;
  } catch {
    return (await caches.match("/index.html")) || Response.error();
  }
}

async function networkFirstAsset(request, key = request) {
  try {
    const response = await fetch(request);
    await cacheResponse(key, response);
    return response;
  } catch {
    return (await caches.match(key)) || Response.error();
  }
}

async function staleWhileRevalidate(request, key = request) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(key);
  const network = fetch(request)
    .then(async (response) => {
      await cacheResponse(key, response);
      return response;
    })
    .catch(() => null);

  return cached || (await network) || Response.error();
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL))
  );
});

self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key.startsWith("emotion-in-motion-") && key !== CACHE_NAME)
            .map((key) => caches.delete(key))
        )
      )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  const url = new URL(event.request.url);
  if (event.request.mode === "navigate") {
    event.respondWith(networkFirstNavigation(event.request));
    return;
  }

  if (url.origin === self.location.origin) {
    event.respondWith(
      networkFirstAsset(event.request, normalizedCacheKey(event.request))
    );
    return;
  }

  if (RUNTIME_ORIGINS.has(url.origin)) {
    event.respondWith(staleWhileRevalidate(event.request));
  }
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(clients.openWindow("/#schedule"));
});
