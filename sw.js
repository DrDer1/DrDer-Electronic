/* ==========================================================================
   DrDer Electronic - Service Worker
   Cache Strategy: Cache First with Network Update
   Version: 2.0.0
   ========================================================================== */

const CACHE_NAME = 'drder-electronic-v2.0.0';
const RUNTIME_CACHE = 'drder-runtime-v2.0.0';

const PRECACHE_ASSETS = [
  './',
  './index.html',
  './style.css',
  './app.js',
  './data.js',
  './quiz-data.js',
  './quiz.js',
  './simulator.js',
  './manifest.json',
  './192.png',
  './512.png'
];

const CACHE_STRATEGIES = {
  CACHE_FIRST: 'cache-first',
  NETWORK_FIRST: 'network-first',
  STALE_WHILE_REVALIDATE: 'stale-while-revalidate'
};

/* ========== Install ========== */
self.addEventListener('install', (event) => {
  self.skipWaiting();

  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        return Promise.allSettled(
          PRECACHE_ASSETS.map((asset) =>
            cache.add(asset).catch((err) => {
              console.warn(`[SW] Failed to cache: ${asset}`, err.message);
            })
          )
        );
      })
      .then(() => {
        console.log('[SW] Installation complete');
      })
  );
});

/* ========== Activate ========== */
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

/* ========== Fetch ========== */
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (request.method !== 'GET') return;

  if (!url.origin.includes(self.location.origin)) {
    return;
  }

  if (url.pathname.includes('sockjs') || url.pathname.includes('hot-update')) {
    return;
  }

  event.respondWith(handleFetch(request));
});

async function handleFetch(request) {
  try {
    const cachedResponse = await caches.match(request);

    if (cachedResponse) {
      updateCacheInBackground(request, RUNTIME_CACHE);
      return cachedResponse;
    }

    const networkResponse = await fetch(request, { mode: 'cors', credentials: 'same-origin' });

    if (networkResponse && networkResponse.ok) {
      const responseClone = networkResponse.clone();
      const cache = await caches.open(RUNTIME_CACHE);
      await cache.put(request, responseClone);
    }

    return networkResponse;
  } catch (error) {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) return cachedResponse;

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

async function updateCacheInBackground(request, cacheName) {
  try {
    const cache = await caches.open(cacheName);
    const response = await fetch(request, { mode: 'cors', credentials: 'same-origin' });

    if (response && response.ok) {
      await cache.put(request, response);
    }
  } catch (error) {
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
      event.ports[0]?.postMessage({ success: true });
    });
  }
});

/* ========== Push Notification (Ready) ========== */
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
      const url = event.notification.data?.url || './';

      for (const client of clients) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          return client.focus();
        }
      }

      return self.clients.openWindow(url);
    })
  );
});
