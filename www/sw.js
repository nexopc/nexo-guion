/* Service worker: guarda la app en el celular para que abra SIN internet.
   Cambia VERSION cada vez que publiques cambios: así el celular baja la nueva. */
const VERSION = 'nexo-guion-1.1.0';
const ARCHIVOS = [
  './', 'index.html', 'app.css', 'app.js', 'ganchos.js', 'aprender.js', 'manifest.webmanifest',
  'vendor/jspdf.umd.min.js', 'vendor/html2canvas.min.js',
  'fonts/sora-latin-600-normal.woff2', 'fonts/sora-latin-700-normal.woff2',
  'fonts/inter-latin-400-normal.woff2', 'fonts/inter-latin-500-normal.woff2', 'fonts/inter-latin-600-normal.woff2', 'fonts/inter-latin-700-normal.woff2',
  'icons/icon-192.png', 'icons/icon-512.png', 'icons/apple-touch-icon.png', 'icons/logo-nexo.png', 'icons/maskable-512.png'
];
self.addEventListener('install', e => e.waitUntil(caches.open(VERSION).then(c => c.addAll(ARCHIVOS))));
self.addEventListener('activate', e => e.waitUntil(
  caches.keys().then(ks => Promise.all(ks.filter(k => k !== VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim())
));
self.addEventListener('message', e => { if (e.data === 'skipWaiting') self.skipWaiting(); });
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.origin !== location.origin) return;
  if (url.pathname.endsWith('version.json')) return; // siempre desde internet
  // Primero lo guardado (rápido y sin internet); si no está, se pide a internet
  e.respondWith(caches.match(e.request, { ignoreSearch: true }).then(r => r || fetch(e.request)));
});
