// Offline support for camp: Blackwoods has patchy-to-no signal, so the app
// has to open and stay usable on a phone that can't reach anything.
//
// Strategy by request kind:
//   navigations        network-first, falling back to the cached shell
//   build assets       cache-first (hashed URLs, so they never go stale)
//   images + fonts     cache-first (maps, spot photos, Google Fonts)
//   everything else    network-only (Supabase reads/writes stay live)
//
// Data itself is cached separately in localStorage by the data layer — a
// service worker cache of authenticated API responses would be harder to
// reason about and would outlive sign-out.

const VERSION = "abc-v1";
const SHELL = `${VERSION}-shell`;
const ASSETS = `${VERSION}-assets`;

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(SHELL).then((c) => c.addAll(["/", "/manifest.webmanifest"])),
  );
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.filter((k) => !k.startsWith(VERSION)).map((k) => caches.delete(k)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

const cacheFirst = async (req, cacheName) => {
  const cache = await caches.open(cacheName);
  const hit = await cache.match(req);
  if (hit) return hit;
  const res = await fetch(req);
  if (res.ok) cache.put(req, res.clone());
  return res;
};

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;

  const url = new URL(req.url);
  const sameOrigin = url.origin === self.location.origin;

  if (req.mode === "navigate") {
    e.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(SHELL).then((c) => c.put("/", copy));
          return res;
        })
        .catch(async () => (await caches.match("/")) ?? Response.error()),
    );
    return;
  }

  const isBuildAsset = sameOrigin && url.pathname.startsWith("/_next/static/");
  const isLocalMedia =
    sameOrigin && /\.(png|jpg|jpeg|svg|webp|ico|webmanifest)$/.test(url.pathname);
  const isFont =
    url.host === "fonts.googleapis.com" || url.host === "fonts.gstatic.com";
  const isSpotPhoto =
    url.host.endsWith(".supabase.co") && url.pathname.includes("/object/public/");

  if (isBuildAsset || isLocalMedia || isFont || isSpotPhoto) {
    e.respondWith(cacheFirst(req, ASSETS).catch(() => caches.match(req)));
  }
});
