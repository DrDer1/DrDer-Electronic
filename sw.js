/* ==========================================================================
   DrDer Electronic - Service Worker v4.2
   Updated asset list - removed deleted simulator files
   ========================================================================== */

var CACHE_NAME = 'drder-electronic-v4.2.0';
var RUNTIME_CACHE = 'drder-runtime-v4.2.0';

var PRECACHE_ASSETS = [
  './',
  './index.html',
  './style.css',
  './app.js',
  './data.js',
  './quiz-data.js',
  './quiz.js',
  './manifest.json',
  './192.png',
  './512.png',
  './simulator/simulator.css',
  './simulator/simulator.js',
  './simulator/simulator-utils.js',
  './simulator/simulator-components.js',
  './simulator/simulator-history.js',
  './simulator/simulator-selection.js',
  './simulator/simulator-drag.js',
  './simulator/simulator-canvas.js',
  './simulator/simulator-wires.js',
  './simulator/simulator-properties.js',
  './simulator/simulator-validation.js',
  './simulator/simulator-power.js',
  './simulator/simulator-engine.js',
  './simulator/simulator-project.js'
];

self.addEventListener('install', function (event) {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(function (cache) {
      return Promise.allSettled(
        PRECACHE_ASSETS.map(function (asset) {
          return cache.add(asset).catch(function (err) {
            console.warn('[SW] Failed to cache: ' + asset);
          });
        })
      );
    }).then(function () {
      console.log('[SW] Installation complete');
    })
  );
});

self.addEventListener('activate', function (event) {
  var validCaches = [CACHE_NAME, RUNTIME_CACHE];
  event.waitUntil(
    caches.keys().then(function (cacheNames) {
      return Promise.all(
        cacheNames.map(function (cacheName) {
          if (validCaches.indexOf(cacheName) === -1) {
            console.log('[SW] Deleting old cache: ' + cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(function () {
      self.clients.claim();
      console.log('[SW] Activation complete');
    })
  );
});

self.addEventListener('fetch', function (event) {
  var request = event.request;
  if (request.method !== 'GET') return;
  var url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  event.respondWith(handleFetch(request));
});

function handleFetch(request) {
  return caches.match(request).then(function (cachedResponse) {
    if (cachedResponse) {
      updateCacheInBackground(request);
      return cachedResponse;
    }

    return fetch(request).then(function (networkResponse) {
      if (networkResponse && networkResponse.ok) {
        var responseClone = networkResponse.clone();
        caches.open(RUNTIME_CACHE).then(function (cache) {
          cache.put(request, responseClone);
        });
      }
      return networkResponse;
    }).catch(function () {
      return caches.match(request).then(function (cached) {
        if (cached) return cached;
        if (request.headers.get('accept') && request.headers.get('accept').indexOf('text/html') !== -1) {
          return caches.match('./index.html');
        }
        return new Response(JSON.stringify({ offline: true, message: 'أنت غير متصل بالإنترنت.' }), {
          status: 503,
          headers: { 'Content-Type': 'application/json; charset=utf-8' }
        });
      });
    });
  });
}

function updateCacheInBackground(request) {
  caches.open(RUNTIME_CACHE).then(function (cache) {
    fetch(request).then(function (response) {
      if (response && response.ok) {
        cache.put(request, response);
      }
    }).catch(function () {});
  });
}

self.addEventListener('message', function (event) {
  if (event.data && event.data.action === 'skipWaiting') {
    self.skipWaiting();
  }
  if (event.data && event.data.action === 'clearCaches') {
    caches.keys().then(function (names) {
      return Promise.all(names.map(function (name) { return caches.delete(name); }));
    });
  }
});

self.addEventListener('push', function (event) {
  var data = event.data ? event.data.json() : {};
  var options = {
    body: data.body || 'تحديث جديد من مختبر الهندسة الكهربائية',
    icon: './192.png',
    badge: './192.png',
    vibrate: [200, 100, 200],
    data: { url: data.url || './' },
    actions: [
      { action: 'open', title: 'فتح' },
      { action: 'close', title: 'إغلاق' }
    ]
  };
  event.waitUntil(self.registration.showNotification(data.title || 'DrDer Electronic', options));
});

self.addEventListener('notificationclick', function (event) {
  event.notification.close();
  if (event.action === 'close') return;
  event.waitUntil(
    self.clients.matchAll({ type: 'window' }).then(function (clients) {
      var url = event.notification.data && event.notification.data.url || './';
      for (var i = 0; i < clients.length; i++) {
        if (clients[i].url.indexOf(self.location.origin) !== -1 && 'focus' in clients[i]) {
          return clients[i].focus();
        }
      }
      return self.clients.openWindow(url);
    })
  );
});
