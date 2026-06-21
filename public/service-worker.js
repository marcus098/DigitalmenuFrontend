// Minimal service worker — enables PWA installability and provides
// a graceful offline fallback for the app shell. Hashed CRA assets are
// cached on first network response (cache-first).
// Bump CACHE_VERSION whenever the offline shell needs to be invalidated.

const CACHE_VERSION = 'rf-shell-v1';
const OFFLINE_URLS = ['/', '/index.html', '/favicon.ico', '/icon.svg', '/manifest.json'];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_VERSION).then((cache) => cache.addAll(OFFLINE_URLS)).catch(() => undefined)
    );
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((names) =>
            Promise.all(names.filter((n) => n !== CACHE_VERSION).map((n) => caches.delete(n)))
        ).then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', (event) => {
    const req = event.request;
    if (req.method !== 'GET') return;

    const url = new URL(req.url);

    // Never intercept API/WS/SSE/Stripe — let them fail naturally.
    if (url.origin !== self.location.origin) return;
    if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/ws')) return;

    // HTML navigations: network-first so deploys are visible immediately,
    // fall back to cached index for offline.
    if (req.mode === 'navigate') {
        event.respondWith(
            fetch(req).catch(() => caches.match('/index.html').then((r) => r || Response.error()))
        );
        return;
    }

    // Static assets: cache-first.
    if (url.pathname.startsWith('/assets/') || /\.(svg|png|jpg|jpeg|webp|ico|woff2?)$/.test(url.pathname)) {
        event.respondWith(
            caches.match(req).then((cached) => {
                if (cached) return cached;
                return fetch(req).then((res) => {
                    if (res.ok) {
                        const copy = res.clone();
                        caches.open(CACHE_VERSION).then((cache) => cache.put(req, copy));
                    }
                    return res;
                });
            })
        );
    }
});

self.addEventListener('message', (event) => {
    if (event.data === 'SKIP_WAITING') self.skipWaiting();
});
