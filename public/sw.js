/**
 * RK VIDEO - Background Service Worker & Offline Cache Engine
 * Provides persistent background execution, offline access, and fast caching.
 */

const CACHE_NAME = 'rk-video-cache-v1';
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/style.css',
  '/app.js',
  '/firebase-config.js',
  '/manifest.json',
  '/icons/icon.svg',
  '/icons/icon-192.png',
  '/icons/icon-512.png'
];

// Install: Precache shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS).catch((err) => {
        console.warn('PWA precache notice:', err);
      });
    }).then(() => self.skipWaiting())
  );
});

// Activate: Clean old caches and claim clients immediately
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch: Network-first for dynamic content & skip 206 Range video requests
self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // 1. Bypass video uploads, streams, and API endpoints from service worker caching
  if (
    url.pathname.startsWith('/uploads/') ||
    url.pathname.startsWith('/api/') ||
    url.hostname.includes('firebase') ||
    url.hostname.includes('googleapis') ||
    req.headers.has('range') ||
    req.method !== 'GET'
  ) {
    return; // Direct browser network fetch with native Range header streaming
  }

  // 2. Navigation requests: Network first, fall back to cached index.html
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req).catch(() => {
        return caches.match('/index.html');
      })
    );
    return;
  }

  // 3. Static assets: Stale-while-revalidate
  event.respondWith(
    caches.match(req).then((cachedResponse) => {
      const fetchPromise = fetch(req).then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
          const clone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(req, clone));
        }
        return networkResponse;
      }).catch(() => cachedResponse);

      return cachedResponse || fetchPromise;
    })
  );
});

// Background Heartbeat & Keep-Alive Channel
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'PING_BACKGROUND') {
    if (event.ports && event.ports[0]) {
      event.ports[0].postMessage({ type: 'PONG_BACKGROUND', timestamp: Date.now() });
    }
  } else if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
