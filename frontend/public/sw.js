// Piyrox Service Worker
// Handles: push notifications + static asset caching + API stale-while-revalidate

const STATIC_CACHE = 'piyrox-static-v1';
const API_CACHE = 'piyrox-api-v1';

// Assets to pre-cache on install (shell assets)
const PRECACHE_URLS = [
  '/',
  '/favicon.png',
  '/logo-new.png',
  '/manifest.json',
];

// ─── Static asset patterns ────────────────────────────────────────────────────
// These are the /_next/static/* chunks, public images and fonts.
function isStaticAsset(url) {
  return (
    url.pathname.startsWith('/_next/static/') ||
    url.pathname.startsWith('/games/') ||
    url.pathname.match(/\.(png|jpg|jpeg|svg|webp|avif|woff2?|ico)$/)
  );
}

// ─── API request patterns ─────────────────────────────────────────────────────
function isApiRequest(url) {
  return url.pathname.startsWith('/api/v1/');
}

// ─── Install: pre-cache shell assets ─────────────────────────────────────────
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => cache.addAll(PRECACHE_URLS).catch(() => {
      // Silently ignore individual failures (e.g. offline at install time)
    }))
  );
});

// ─── Activate: purge stale caches ────────────────────────────────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => k !== STATIC_CACHE && k !== API_CACHE)
          .map((k) => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

// ─── Fetch strategies ─────────────────────────────────────────────────────────
self.addEventListener('fetch', (event) => {
  // Only handle GET requests
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // Must be same-origin or CDN — skip cross-origin analytics, sockets, etc.
  if (url.origin !== self.location.origin && !url.hostname.includes('supabase.co')) return;

  if (isStaticAsset(url)) {
    // Cache-first: static chunks are content-hashed, safe to serve from cache indefinitely
    event.respondWith(cacheFirst(event.request, STATIC_CACHE));
  } else if (isApiRequest(url)) {
    // Stale-while-revalidate: show cached data instantly, refresh in background
    event.respondWith(staleWhileRevalidate(event.request, API_CACHE));
  }
  // All other navigations (HTML) fall through to the network (no offline page yet)
});

// ─── Strategy: Cache-First ────────────────────────────────────────────────────
async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  if (cached) return cached;
  try {
    const response = await fetch(request);
    if (response.ok) cache.put(request, response.clone());
    return response;
  } catch {
    return new Response('Offline', { status: 503 });
  }
}

// ─── Strategy: Stale-While-Revalidate ────────────────────────────────────────
async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);

  const fetchPromise = fetch(request)
    .then((response) => {
      if (response.ok) {
        // Only cache successful, non-streaming responses
        const cloned = response.clone();
        cache.put(request, cloned);
      }
      return response;
    })
    .catch(() => null);

  // Return cached immediately if available; otherwise await the network
  return cached ?? fetchPromise;
}

// ─── Push Notifications ───────────────────────────────────────────────────────
self.addEventListener('push', (event) => {
  const data = event.data?.json() ?? {};
  event.waitUntil(
    self.registration.showNotification(data.title || 'Piyrox', {
      body: data.body || '',
      icon: '/logo-new.png',
      badge: '/logo-new.png',
      data: data.data || {},
      tag: data.data?.type || 'piyrox',
      renotify: true,
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.url || '/';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (const client of windowClients) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.navigate(url);
          return client.focus();
        }
      }
      if (clients.openWindow) return clients.openWindow(url);
    })
  );
});

self.addEventListener('pushsubscriptionchange', (event) => {
  event.waitUntil(
    self.registration.pushManager
      .subscribe({ userVisibleOnly: true })
      .then((subscription) => {
        return fetch('/api/v1/notifications/push/subscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            endpoint: subscription.endpoint,
            keys: {
              p256dh: btoa(String.fromCharCode(...new Uint8Array(subscription.getKey('p256dh')))),
              auth: btoa(String.fromCharCode(...new Uint8Array(subscription.getKey('auth')))),
            },
          }),
        });
      })
  );
});
