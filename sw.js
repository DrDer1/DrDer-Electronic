/* ==========================================================================
   DrDer Electronic - Service Worker v3.0
   Cache Strategy: Cache First with Network Update
   Supports all simulator files for full offline operation
   ========================================================================== */

const CACHE_NAME = 'drder-electronic-v3.0.0';
const RUNTIME_CACHE = 'drder-runtime-v3.0.0';

const PRECACHE_ASSETS = [
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
  './simulator/simulator-ui.js',
  './simulator/simulator-engine.js',
  './simulator/simulator-components.js',
  './simulator/simulator-wires.js',
  './simulator/simulator-canvas.js',
  './simulator/simulator-selection.js',
  './simulator/simulator-drag.js',
  './simulator/simulator-properties.js',
  './simulator/simulator-validation.js',
  './simulator/simulator-power.js',
  './simulator/simulator-project.js',
  './simulator/simulator-history.js',
  './simulator/simulator-library.js',
  './simulator/simulator-utils.js'
];

/* ========== Install Event ========== */
self.addEventListener('install', (event) => {
  self.skipWaiting();

  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        return Promise.allSettled(
          PRECACHE_ASSETS.map((asset) =>
            cache.add(asset).catch((err) => {
              console.warn('[SW] Failed to cache:', asset, err.message);
            })
          )
        );
      })
      .then(() => {
        console.log('[SW] Installation complete -', PRECACHE_ASSETS.length, 'assets');
      })
  );
});

/* ========== Activate Event ========== */
self.addEventListener('activate', (event) => {
  const validCaches = [CACHE_NAME, RUNTIME_CACHE];

  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (!validCaches.includes(cacheName)) {
              console.log('[SW] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        self.clients.claim();
        console.log('[SW] Activation complete');
      })
  );
});

/* ========== Fetch Event ========== */
self.addEventListener('fetch', (event) => {
  const { request } = event;

  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  if (!url.origin.includes(self.location.origin)) return;

  event.respondWith(handleFetch(request));
});

async function handleFetch(request) {
  try {
    const cachedResponse = await caches.match(request);

    if (cachedResponse) {
      updateCacheInBackground(request);
      return cachedResponse;
    }

    const networkResponse = await fetch(request);

    if (networkResponse && networkResponse.ok) {
      const cache = await caches.open(RUNTIME_CACHE);
      cache.put(request, networkResponse.clone());
    }

    return networkResponse;
  } catch (error) {
    const cachedResponse = await caches.match(request);

    if (cachedResponse) {
      return cachedResponse;
    }

    if (request.headers.get('accept') && request.headers.get('accept').includes('text/html')) {
      return caches.match('./index.html');
    }

    return new Response(
      JSON.stringify({
        offline: true,
        message: 'أنت غير متصل بالإنترنت. يرجى الاتصال لتحميل هذا المحتوى.'
      }),
      {
        status: 503,
        headers: { 'Content-Type': 'application/json; charset=utf-8' }
      }
    );
  }
}

async function updateCacheInBackground(request) {
  try {
    const cache = await caches.open(RUNTIME_CACHE);
    const response = await fetch(request);

    if (response && response.ok) {
      await cache.put(request, response);
    }
  } catch (error) {
    // Silently fail - background update
  }
}

/* ========== Message Handler ========== */
self.addEventListener('message', (event) => {
  if (event.data && event.data.action === 'skipWaiting') {
    self.skipWaiting();
  }

  if (event.data && event.data.action === 'clearCaches') {
    caches.keys().then((names) => {
      return Promise.all(names.map((name) => caches.delete(name)));
    }).then(() => {
      if (event.ports && event.ports[0]) {
        event.ports[0].postMessage({ success: true });
      }
    });
  }
});

/* ========== Push Notification ========== */
self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : {};
  const title = data.title || 'DrDer Electronic';
  const options = {
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

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'close') return;

  event.waitUntil(
    self.clients.matchAll({ type: 'window' }).then((clients) => {
      const url = event.notification.data && event.notification.data.url || './';

      for (const client of clients) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          return client.focus();
        }
      }

      return self.clients.openWindow(url);
    })
  );
});
