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

// Bump VERSION whenever a cached asset changes behind a URL that stays the
// same — a replaced photo in the `spots` bucket, say. Cached entries are
// served without revalidating, so an old copy would otherwise stick around on
// phones that already have it.
const VERSION = "abc-v3";
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

// Waiting for a photo to scroll into view is too late — by then you're at the
// campsite with no bars. The page posts its media list (lib/content.ts stays
// the single source of truth) and we fetch whatever isn't already on disk.
// Failures are silent: a phone that's offline right now simply tries again on
// the next launch.
async function precache(urls) {
  const cache = await caches.open(ASSETS);
  const missing = [];
  for (const url of urls) if (!(await cache.match(url))) missing.push(url);

  let next = 0;
  const worker = async () => {
    while (next < missing.length) {
      const url = missing[next++];
      // A hanging request on a weak connection would otherwise sit on one of
      // the browser's few sockets and starve the app's own requests.
      const abort = new AbortController();
      const timer = setTimeout(() => abort.abort(), 15000);
      try {
        const res = await fetch(url, {
          mode: "cors",
          credentials: "omit",
          signal: abort.signal,
        });
        // Only store real responses — an opaque one can't be checked and
        // would report success while caching an error page.
        if (res.ok && res.type !== "opaque") await cache.put(url, res);
      } catch {
        /* no network for this one; next launch picks it up */
      } finally {
        clearTimeout(timer);
      }
    }
  };
  // Two at a time: this is background work and must never be the reason a
  // tap feels slow.
  await Promise.all(Array.from({ length: 2 }, worker));
}

self.addEventListener("message", (e) => {
  const msg = e.data;
  if (!msg || msg.type !== "precache" || !Array.isArray(msg.urls)) return;
  e.waitUntil(precache(msg.urls));
});

const cacheFirst = async (req, cacheName) => {
  const cache = await caches.open(cacheName);
  const hit = await cache.match(req);
  if (hit) return hit;
  let res = await fetch(req);
  // A freshly uploaded avatar can 404 for a minute at the storage CDN, and
  // that 404 can then sit in the browser's HTTP cache — every retry re-serves
  // it and the photo looks permanently broken. One reload-mode retry punches
  // through both caches; only ever taken on a failure, so it costs nothing
  // when things work.
  if (!res.ok && req.url.includes("/object/public/")) {
    try {
      const fresh = await fetch(req, { cache: "reload" });
      if (fresh.ok) res = fresh;
    } catch {
      /* keep the original failure */
    }
  }
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
