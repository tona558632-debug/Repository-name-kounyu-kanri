// Service Worker — 購入品・在庫管理アプリ
const CACHE_NAME = "kounyu-kanri-v1";

// オフライン時のフォールバック対象 (静的アセット)
const PRECACHE_URLS = [
  "/",
  "/manifest.webmanifest",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS)),
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))),
    ),
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  // GET リクエストのみキャッシュ対象
  if (event.request.method !== "GET") return;

  const url = new URL(event.request.url);

  // Supabase API や外部リクエストはキャッシュしない
  if (!url.origin.includes(self.location.origin)) return;

  // Next.js の _next/static はキャッシュファースト
  if (url.pathname.startsWith("/_next/static")) {
    event.respondWith(
      caches.match(event.request).then(
        (cached) => cached ?? fetch(event.request).then((res) => {
          const clone = res.clone();
          caches.open(CACHE_NAME).then((c) => c.put(event.request, clone));
          return res;
        }),
      ),
    );
    return;
  }

  // ページリクエスト: ネットワークファースト、失敗時にキャッシュ
  event.respondWith(
    fetch(event.request)
      .then((res) => {
        const clone = res.clone();
        caches.open(CACHE_NAME).then((c) => c.put(event.request, clone));
        return res;
      })
      .catch(() => caches.match(event.request)),
  );
});
