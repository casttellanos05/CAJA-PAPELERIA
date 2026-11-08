// Caja Papelería — la app abre aunque no haya internet ni señal.
// Al subir una versión nueva de index.html, cambia el número de CACHE (caja-v1.1 -> caja-v1.2)
// y abre la app dos veces con internet: la primera descarga lo nuevo, la segunda ya lo usa.
const CACHE = 'caja-v1.1';
const FILES = ['./', './index.html', './manifest.webmanifest', './icon-180.png', './icon-192.png', './icon-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(c => Promise.all(FILES.map(f => c.add(new Request(f, { cache: 'reload' })).catch(() => {}))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// Primero lo guardado (abre al instante, con o sin señal) y en segundo plano se actualiza.
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return; // Google Sheets va directo
  e.respondWith((async () => {
    const cache = await caches.open(CACHE);
    const key = req.mode === 'navigate' ? './index.html' : req;
    const cached = await cache.match(key, { ignoreSearch: true });
    const net = fetch(req)
      .then(r => { if (r && r.ok) cache.put(key, r.clone()); return r; })
      .catch(() => null);
    if (cached) { e.waitUntil(net); return cached; }
    const r = await net;
    return r || new Response('Sin conexión', { status: 503, headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
  })());
});
