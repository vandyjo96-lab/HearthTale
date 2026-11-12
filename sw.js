// Hearthtale offline support: keeps the app and its helper libraries on this computer,
// so it opens without internet after the first run. (The voice model is kept by the voice engine itself.)
const CACHE = 'hearthtale-v2';
const LIB_HOSTS = /(^|\.)cdn\.jsdelivr\.net$|(^|\.)cdnjs\.cloudflare\.com$|(^|\.)fonts\.googleapis\.com$|(^|\.)fonts\.gstatic\.com$/;

self.addEventListener('install', e => {
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(['./', './index.html', './manifest.webmanifest', './icon-180.png', './icon-192.png', './icon-512.png']).catch(() => {})));
});
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const u = new URL(req.url);
  if (u.origin === self.location.origin){
    // The app itself: use the newest copy when possible, the saved one when offline.
    e.respondWith(fetch(req).then(r => {
      if (r.ok){ const c = r.clone(); caches.open(CACHE).then(x => x.put(req, c)); }
      return r;
    }).catch(() => caches.match(req).then(r => r || caches.match('./index.html'))));
  } else if (LIB_HOSTS.test(u.hostname)){
    // Helper libraries and fonts never change at a given version: keep them.
    e.respondWith(caches.match(req).then(r => r || fetch(req).then(res => {
      if (res.ok || res.type === 'opaque'){ const c = res.clone(); caches.open(CACHE).then(x => x.put(req, c)); }
      return res;
    })));
  }
  // Everything else (voice model downloads, AI speaker detection) goes straight to the internet.
});
