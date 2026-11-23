// Service worker: só guarda os arquivos do próprio app para abrir mais rápido.
// Nunca guarda respostas do Supabase (dados sempre vêm do banco online).
// O nome do cache leva o endereço do site, para não misturar com outro site do mesmo domínio.
const PREFIX = 'estoque:' + self.registration.scope + ':';
const CACHE = PREFIX + 'v3';
const CORE = ['./', './index.html', './manifest.json', './supabase-config.js'];
self.addEventListener('install', e => e.waitUntil(
  caches.open(CACHE).then(c => Promise.all(CORE.map(u => c.add(u).catch(() => null)))).then(() => self.skipWaiting())
));
self.addEventListener('activate', e => e.waitUntil(
  caches.keys().then(ks => Promise.all(ks.filter(k => k.startsWith(PREFIX) && k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())
));
self.addEventListener('fetch', e => {
  const req = e.request, url = new URL(req.url);
  if (req.method !== 'GET' || url.origin !== self.location.origin) return; // Supabase e outros sites: direto na rede
  if (!req.url.startsWith(self.registration.scope)) return; // arquivos de outro site do mesmo domínio: não mexe
  // Arquivos do app: primeiro a rede (versão mais nova); sem internet, usa a cópia guardada.
  e.respondWith(fetch(req).then(res => {
    if (res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); }
    return res;
  }).catch(() => caches.match(req).then(r => r || caches.match('./index.html'))));
});
