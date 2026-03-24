// ══════════════════════════════════════════════════════
//  साथी AI — Service Worker
//  File: sw.js (root of project)
//  Handles: offline cache, background sync, push notifications
// ══════════════════════════════════════════════════════

var CACHE_NAME = 'saathai-v2';
var OFFLINE_CACHE = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
  'https://fonts.googleapis.com/css2?family=Baloo+2:wght@400;600;700;800&family=Noto+Sans+Devanagari:wght@400;700&display=swap'
];

// ── INSTALL: Cache core assets ──
self.addEventListener('install', function(e) {
  e.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      return cache.addAll(OFFLINE_CACHE);
    }).then(function() {
      return self.skipWaiting();
    })
  );
});

// ── ACTIVATE: Clean old caches ──
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

// ── FETCH: Serve from cache, fallback to network ──
self.addEventListener('fetch', function(e) {
  // Don't cache API calls
  if(e.request.url.includes('/api/')) {
    e.respondWith(
      fetch(e.request).catch(function() {
        return new Response(
          JSON.stringify({error:'Offline — network nahi hai. Thodi der baad try karein.'}),
          {headers:{'Content-Type':'application/json'}, status:503}
        );
      })
    );
    return;
  }

  // Cache-first for static assets
  e.respondWith(
    caches.match(e.request).then(function(cached) {
      if(cached) return cached;
      return fetch(e.request).then(function(response) {
        // Only cache successful GET requests
        if(!response || response.status !== 200 || e.request.method !== 'GET') {
          return response;
        }
        var toCache = response.clone();
        caches.open(CACHE_NAME).then(function(cache) {
          cache.put(e.request, toCache);
        });
        return response;
      }).catch(function() {
        // Offline fallback for navigation
        if(e.request.mode === 'navigate') {
          return caches.match('/index.html');
        }
      });
    })
  );
});

// ── PUSH NOTIFICATIONS (for medicine reminders) ──
self.addEventListener('push', function(e) {
  var data = {};
  try { data = e.data.json(); } catch(err) { data = {title:'साथी AI', body:e.data ? e.data.text() : 'Notification'}; }

  var options = {
    body:    data.body || 'Saathi yaad dila raha hai!',
    icon:    '/icon-192.png',
    badge:   '/icon-192.png',
    vibrate: [200, 100, 200],
    data:    {url: data.url || '/'},
    actions: [
      {action:'open',    title:'Open Saathi'},
      {action:'dismiss', title:'Dismiss'}
    ]
  };

  e.waitUntil(
    self.registration.showNotification(data.title || 'साथी AI', options)
  );
});

// ── NOTIFICATION CLICK ──
self.addEventListener('notificationclick', function(e) {
  e.notification.close();
  if(e.action === 'dismiss') return;

  var url = (e.notification.data && e.notification.data.url) || '/';
  e.waitUntil(
    clients.matchAll({type:'window', includeUncontrolled:true}).then(function(list) {
      for(var i=0; i<list.length; i++) {
        if(list[i].url === url && 'focus' in list[i]) {
          return list[i].focus();
        }
      }
      if(clients.openWindow) return clients.openWindow(url);
    })
  );
});
