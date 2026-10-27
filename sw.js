// 추억은방울방울 서비스 워커: 앱 파일은 네트워크 우선(업데이트 즉시 반영), 오프라인이면 캐시. 글꼴은 캐시해 두고 재사용.
const V = 'bangul-v1';
const CORE = ['./', './index.html', './manifest.webmanifest', './icon-192.png', './icon-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(V).then(c => c.addAll(CORE)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(ks => Promise.all(ks.filter(k => k !== V && k !== 'fonts').map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const u = new URL(req.url);

  if (u.hostname === 'fonts.googleapis.com' || u.hostname === 'fonts.gstatic.com') {
    e.respondWith(
      caches.open('fonts').then(async c => {
        const hit = await c.match(req);
        const net = fetch(req).then(r => { c.put(req, r.clone()); return r; }).catch(() => hit);
        return hit || net;
      })
    );
    return;
  }

  if (u.origin === location.origin) {
    e.respondWith(
      fetch(req)
        .then(r => { const copy = r.clone(); caches.open(V).then(c => c.put(req, copy)); return r; })
        .catch(() => caches.match(req).then(m => m || caches.match('./index.html')))
    );
  }
});
