const CACHE_NAME = 'masters-codex-v1';
const PRECACHE_ASSETS = [
  '/',
  '/logo.png',
  '/manifest.webmanifest',
];

// Install: Cache essential shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS).catch((err) => {
        console.warn('PWA Precache partial fail:', err);
      });
    })
  );
  self.skipWaiting();
});

// Activate: Clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch: Stale-while-revalidate for static assets, network-first for others
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests or chrome extension schemes
  if (request.method !== 'GET' || !url.protocol.startsWith('http')) {
    return;
  }

  // Skip Next.js hot reload / dev server websockets & Supabase API
  if (
    url.pathname.includes('/_next/webpack-hmr') ||
    url.hostname.includes('supabase.co') ||
    url.pathname.startsWith('/api/')
  ) {
    return;
  }

  // Static assets (images, fonts, scripts): Stale-While-Revalidate
  if (
    url.pathname.startsWith('/_next/static/') ||
    url.pathname.match(/\.(png|jpg|jpeg|svg|webp|woff2|woff|mp3|ogg)$/)
  ) {
    event.respondWith(
      caches.open(CACHE_NAME).then(async (cache) => {
        const cachedResponse = await cache.match(request);
        const fetchPromise = fetch(request)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              cache.put(request, networkResponse.clone());
            }
            return networkResponse;
          })
          .catch(() => cachedResponse);

        return cachedResponse || fetchPromise;
      })
    );
    return;
  }

  // HTML navigation: Network first, fallback to cache
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() => {
        return caches.match('/') || caches.match(request);
      })
    );
  }
});
