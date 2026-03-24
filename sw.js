// साथी AI — Service Worker v4
// Cache name change forces all clients to get fresh files
var CACHE_NAME = 'saathai-v4';
var OFFLINE_CACHE = [
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png'
];
// NOTE: index.html and landing.html are NOT cached
// This ensures users always get the latest version

self.addEventListener('install', function(e) {
  e.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      return cache.addAll(OFFLINE_CACHE);
    }).then(function() {
      return self.skipWaiting();
    })
  );
});

self.addEventListener('activate', function(e) {
  e.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(
        keys.filter(function(k) { return k !== CACHE_NAME; })
            .map(function(k) { return caches.delete(k); })
      );
    }).then(function() {
      return self.clients.claim();
    })
  );
});

self.addEventListener('fetch', function(e) {
  // NEVER cache HTML files — always fetch fresh
  if(e.request.url.includes('.html') || 
     e.request.url.endsWith('/app') || 
     e.request.url.endsWith('/') ||
     e.request.url.includes('/api/')) {
    e.respondWith(fetch(e.request).catch(function() {
      return caches.match('/icon-192.png');
    }));
    return;
  }
  // Cache only icons and manifest
  e.respondWith(
    caches.match(e.request).then(function(cached) {
      return cached || fetch(e.request);
    })
  );
});

// Push notifications
self.addEventListener('push', function(e) {
  var data = {};
  try { data = e.data.json(); } catch(err) { data = {title:'साथी AI', body: e.data ? e.data.text() : ''}; }
  e.waitUntil(self.registration.showNotification(data.title || 'साथी AI', {
    body: data.body || 'Saathi yaad dila raha hai!',
    icon: '/icon-192.png',
    vibrate: [200, 100, 200]
  }));
});
