const CACHE_NAME = 'devtrack-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.json',
  '/logo192.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});

self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : {};
  const title = data.title || 'DevTrack Reminder';
  const options = {
    body: data.body || 'You have an upcoming task!',
    icon: '/logo192.png',
    badge: '/logo192.png',
  };

  event.waitUntil(self.registration.showNotification(title, options));
});
