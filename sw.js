// Slambient Service Worker - Offline Caching & App Shell
const CACHE_NAME = 'slambient-v16';
const PRECACHE_URLS = [
  './',
  'index.html',
  'css/slambient.css',
  'css/field-recorder.css',
  'js/theory/scales.js',
  'js/ui/presets.js',
  'js/ui/keyboard.js',
  'js/ui/mobile-macro.js',
  'js/ui/header-utils.js',
  'js/ui/palette.js',
  'js/ui/visualizers.js',
  'js/audio/drums.js',
  'js/audio/ambient-noise.js',
  'js/audio/recorder.js',
  'js/audio/field-recorder.js',
  'js/midi/constants.js',
  'js/midi/file-writer.js',
  'js/midi/recorder.js',
  'js/midi/engine.js',
  'js/midi/web-midi.js',
  'js/visualizers/chord-wheel.js',
  'js/visualizers/scope.js',
  'js/visualizers/orbital.js',
  'clock-processor.js',
  'dsp-engines.js',
  'manifest.webmanifest',
  'manifest.json',
  'icon.svg',
  'icon-192.png',
  'icon-512.png',
  'apple-touch-icon.png'
];

// Precache essential assets on install
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_URLS);
    }).then(() => {
      return self.skipWaiting();
    })
  );
});

// Clean up stale caches on activate
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((name) => {
          if (name !== CACHE_NAME) {
            return caches.delete(name);
          }
        })
      );
    }).then(() => {
      return self.clients.claim();
    })
  );
});

// Fetch event handler
self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Only handle GET requests
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // 1. Navigation requests (HTML document) - Network First with Cache Fallback
  if (request.mode === 'navigate' || (request.headers.get('accept') && request.headers.get('accept').includes('text/html'))) {
    event.respondWith(
      fetch(request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, responseClone));
          }
          return networkResponse;
        })
        .catch(async () => {
          const cachedResponse = await caches.match(request);
          if (cachedResponse) return cachedResponse;
          return caches.match('./') || caches.match('index.html');
        })
    );
    return;
  }

  // 2. Google Fonts stylesheets & webfont binaries - Cache First with Network Fallback
  if (url.origin === 'https://fonts.googleapis.com' || url.origin === 'https://fonts.gstatic.com') {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        if (cachedResponse) return cachedResponse;
        return fetch(request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, responseClone));
          }
          return networkResponse;
        }).catch(() => {
          // Offline and not cached, return empty or fail gracefully
          return cachedResponse;
        });
      })
    );
    return;
  }

  // 3. Local static assets (icons, manifest) - Stale-While-Revalidate
  if (url.origin === self.location.origin) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        const fetchPromise = fetch(request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, responseClone));
          }
          return networkResponse;
        }).catch(() => cachedResponse);

        return cachedResponse || fetchPromise;
      })
    );
    return;
  }
});
