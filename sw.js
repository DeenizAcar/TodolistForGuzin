// Sitenin dosyalarını önbelleğe alır, internet yokken de açılsın.
// Kendi dosyalarımız için önce ağ (güncellemeler hemen gelsin), Firebase ve
// fontlar için önce önbellek (sürümlü adresler, değişmezler).
const CACHE = 'oda-v1';
const ASSETS = [
  './', './index.html', './deniz.html', './manifest.webmanifest',
  './css/style.css', './css/deniz.css',
  './js/app.js', './js/deniz.js', './js/store.js', './js/logic.js', './js/catalog.js', './js/room.js', './js/config.js',
  './icons/icon.svg', './icons/icon-192.png', './icons/icon-512.png', './icons/apple-touch-icon.png',
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  if (url.origin === location.origin) {
    e.respondWith(
      fetch(req)
        .then(res => {
          if (res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); }
          return res;
        })
        .catch(() => caches.match(req, { ignoreSearch: true }).then(r => r || caches.match('./index.html'))),
    );
    return;
  }

  const cacheFirst = url.hostname === 'www.gstatic.com' || url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com';
  if (cacheFirst) {
    e.respondWith(
      caches.match(req).then(hit => hit || fetch(req).then(res => {
        if (res.ok || res.type === 'opaque') { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); }
        return res;
      })),
    );
  }
});
