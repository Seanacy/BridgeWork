const CACHE_NAME = 'bridgework-v25';
const STATIC_ASSETS = ['/', '/index.html', '/app.js', '/favicon.svg', '/icon-192.png', '/icon-512.png', '/manifest.json'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE_NAME).then((c) => c.addAll(STATIC_ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))));
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  if (url.hostname.includes('supabase') || url.hostname.includes('mapbox') || url.hostname.includes('esm.sh') || url.hostname.includes('api.mapbox')) return;
  e.respondWith(
    caches.match(e.request).then((cached) => {
      if (cached) return cached;
      return fetch(e.request).then((r) => {
        if (r.ok && e.request.method === 'GET') {
          const clone = r.clone();
          caches.open(CACHE_NAME).then((c) => c.put(e.request, clone));
        }
        return r;
      });
    }).catch(() => e.request.mode === 'navigate' ? caches.match('/index.html') : undefined)
  );
});
