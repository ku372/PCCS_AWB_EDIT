// PCCS AWB Tool — Service Worker v3 (Share Target support)
const CACHE_NAME = 'pccs-awb-v3.3.0-preview';
const LOCAL_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './assets/ui-premium.css',
  './assets/ui-premium.js'
];

let sharedFile = null;  // shared file store करने के लिए

// ── Install ──────────────────────────────────────────────────
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME)
      // Fail-soft per-asset: a single 404 must NOT abort SW install.
      .then(c => Promise.all(
        LOCAL_ASSETS.map(url =>
          c.add(url).catch(err => {
            console.warn('[SW] skip cache for', url, err);
          })
        )
      ))
      .then(() => self.skipWaiting())
  );
});

// ── Activate ─────────────────────────────────────────────────
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// ── Fetch ────────────────────────────────────────────────────
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);

  // ── Share Target POST handle करो ──────────────────────────
  if (e.request.method === 'POST' && url.searchParams.get('share-target') === '1') {
    e.respondWith((async () => {
      try {
        const formData = await e.request.formData();
        const file = formData.get('pdf');
        if (file) {
          sharedFile = file;  // file store करो
        }
      } catch (err) {
        console.warn('Share Target error:', err);
      }
      // App page पर redirect करो
      return Response.redirect('/index.html?share-target=1', 303);
    })());
    return;
  }

  // ── Normal fetch — Cache first ────────────────────────────
  e.respondWith(
    caches.match(e.request).then(cached => cached || fetch(e.request))
  );
});

// ── Message — App से file request आए तो दो ──────────────────
self.addEventListener('message', e => {
  if (e.data && e.data.type === 'GET_SHARED_FILE') {
    if (sharedFile) {
      e.source.postMessage({ type: 'SHARED_FILE', file: sharedFile });
      sharedFile = null;  // एक बार देने के बाद clear करो
    }
  }
});
