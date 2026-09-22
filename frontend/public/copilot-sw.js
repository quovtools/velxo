/**
 * Piyrox Copilot Service Worker
 *
 * Scoped to /admin/ai — registered only on the Copilot page so it never
 * interferes with the main marketplace service worker.
 *
 * Strategies:
 *  - App shell (/admin/ai, _next/static/*)  →  Cache-first (instant loads)
 *  - Streaming SSE  (/api/v1/ai/admin/chat) →  Network-only (never cache streams)
 *  - Other AI API   (/api/v1/ai/*)          →  Network-first, 5 s timeout, fall to cache
 *  - Everything else                         →  Network-only (pass-through)
 */

const SHELL_CACHE  = 'copilot-shell-v1';
const API_CACHE    = 'copilot-api-v1';

// Assets to pre-cache on install so the login screen works offline
const PRECACHE = [
  '/admin/ai',
  '/favicon.png',
  '/logo-new.png',
  '/copilot-manifest.json',
];

// ── Install ───────────────────────────────────────────────────────────────────
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(SHELL_CACHE).then((cache) =>
      // addAll is atomic — if any URL fails we still install; use individual
      // adds with catch so a missing asset doesn't block the SW.
      Promise.allSettled(PRECACHE.map((url) => cache.add(url).catch(() => {})))
    )
  );
});

// ── Activate: prune stale caches ─────────────────────────────────────────────
self.addEventListener('activate', (event) => {
  const KNOWN = [SHELL_CACHE, API_CACHE];
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => !KNOWN.includes(k)).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// ── Fetch ─────────────────────────────────────────────────────────────────────
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // ── 1. Never cache SSE streaming endpoint ──────────────────────────────────
  if (url.pathname.startsWith('/api/v1/ai/admin/chat')) {
    // Let the browser handle it natively (ReadableStream won't clone cleanly)
    return;
  }

  // ── 2. Other AI API calls: network-first with 5 s timeout ──────────────────
  if (url.pathname.startsWith('/api/v1/ai/') || url.pathname.startsWith('/api/v1/admin/')) {
    event.respondWith(networkFirstWithTimeout(event.request, API_CACHE, 5000));
    return;
  }

  // ── 3. Next.js static chunks: cache-first ──────────────────────────────────
  if (
    url.pathname.startsWith('/_next/static/') ||
    url.pathname.match(/\.(png|jpg|jpeg|svg|webp|woff2?|ico)$/)
  ) {
    event.respondWith(cacheFirst(event.request, SHELL_CACHE));
    return;
  }

  // ── 4. /admin/ai navigation: network-first, fall back to cached shell ───────
  if (url.pathname === '/admin/ai' || url.pathname.startsWith('/admin/ai/')) {
    event.respondWith(networkFirstWithTimeout(event.request, SHELL_CACHE, 4000));
    return;
  }

  // Everything else: pass through
});

// ── Strategy helpers ──────────────────────────────────────────────────────────

async function cacheFirst(request, cacheName) {
  const cache  = await caches.open(cacheName);
  const cached = await cache.match(request);
  if (cached) return cached;
  try {
    const response = await fetch(request);
    if (response.ok) cache.put(request, response.clone());
    return response;
  } catch {
    return new Response('Offline', { status: 503, statusText: 'Service Unavailable' });
  }
}

async function networkFirstWithTimeout(request, cacheName, timeoutMs) {
  const cache = await caches.open(cacheName);

  // Race the network against a timeout
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(request, { signal: controller.signal });
    clearTimeout(timer);
    if (response.ok) cache.put(request, response.clone());
    return response;
  } catch {
    clearTimeout(timer);
    // Network failed / timed out — serve stale cache
    const cached = await cache.match(request);
    if (cached) return cached;
    return new Response(
      JSON.stringify({ success: false, message: 'You appear to be offline.' }),
      { status: 503, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
