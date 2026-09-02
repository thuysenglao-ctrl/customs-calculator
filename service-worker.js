const CACHE_NAME = "customs-calc-v2";
const ASSETS = ["./customs-calculator.html", "./manifest.json", "./icon-192.png", "./icon-512.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS)).catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Network-first: always try to fetch the latest version. Only fall back to
// cache if the network request fails (offline) or takes too long, so users
// never get stuck on a stale/broken cached copy.
self.addEventListener("fetch", (event) => {
  event.respondWith(
    Promise.race([
      fetch(event.request).then((res) => {
        if (res && res.ok && event.request.method === "GET") {
          const clone = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone)).catch(() => {});
        }
        return res;
      }),
      new Promise((resolve, reject) => setTimeout(() => reject(new Error("timeout")), 6000)),
    ]).catch(() => caches.match(event.request).then((cached) => cached || fetch(event.request)))
  );
});
