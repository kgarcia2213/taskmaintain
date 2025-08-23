self.addEventListener('install', (e) => {
  e.waitUntil(caches.open('taskmaintain').then((cache) => cache.addAll(['./'])));
});

self.addEventListener('fetch', (e) => {
  e.respondWith(caches.match(e.request).then((r) => r || fetch(e.request)));
});