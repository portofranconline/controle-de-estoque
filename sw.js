// Service worker: guarda só os arquivos do próprio app para abrir mais rápido.
// Nunca guarda dados do Supabase (estoque, logins e histórico vêm sempre do banco online).
// Limpeza automática: apaga caches antigos do app e mantém só as cópias mais recentes dos arquivos.
// Não mexe em nenhum dado salvo no aparelho (filial, login, tema) nem no banco.
const PREFIX = 'estoque:' + self.registration.scope + ':';
const CACHE = PREFIX + 'v21';
const CORE = ['./', './index.html', './imagens.js', './ranking.js?v=21', './manifest.json', './supabase-config.js'];
const MAX_ARQUIVOS = 40;
self.addEventListener('install', e => e.waitUntil(
  caches.open(CACHE).then(c => Promise.all(CORE.map(u => c.add(u).catch(() => null)))).then(() => self.skipWaiting())
));
self.addEventListener('activate', e => e.waitUntil(
  caches.keys().then(ks => Promise.all(ks.filter(k =>
    (k.startsWith(PREFIX) && k !== CACHE) ||   // versões antigas deste site
    /^estoque-aldo-v\d+$/.test(k)               // cache da versão antiga do app
  ).map(k => caches.delete(k)))).then(() => self.clients.claim())
));
async function aparar(cache){
  const ks = await cache.keys();
  for (let i = 0; i < ks.length - MAX_ARQUIVOS; i++) await cache.delete(ks[i]); // remove as cópias mais antigas
}
self.addEventListener('fetch', e => {
  const req = e.request, url = new URL(req.url);
  if (req.method !== 'GET' || url.origin !== self.location.origin) return; // Supabase e outros sites: direto na rede
  if (!req.url.startsWith(self.registration.scope)) return;                // arquivos de outro site do mesmo domínio
  // Arquivos do app: primeiro a rede (versão mais nova); sem internet, usa a cópia guardada.
  e.respondWith(fetch(req, {cache:'no-cache'}).then(res => {
    if (res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy).then(() => aparar(c))); }
    return res;
  }).catch(() => caches.match(req).then(r => r || caches.match('./index.html'))));
});
