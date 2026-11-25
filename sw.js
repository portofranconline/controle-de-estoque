// Service worker: guarda só os arquivos do próprio app para abrir mais rápido.
// Nunca guarda dados do Supabase (estoque, logins e histórico vêm sempre do banco online).
// Limpeza automática: apaga caches antigos do app e mantém só as cópias mais recentes dos arquivos.
// Não mexe em nenhum dado salvo no aparelho (filial, login, tema) nem no banco.
const PREFIX = 'estoque:' + self.registration.scope + ':';
const CACHE = PREFIX + 'v30';
const CORE = ['./', './index.html', './imagens.js', './ranking.js?v=30', './manifest.json', './supabase-config.js'];
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
// v29: foto compartilhada pelo WhatsApp (Compartilhar → Controle de Estoque): guarda e abre o app para importar
self.addEventListener('fetch', e => {
  const req = e.request, url = new URL(req.url);
  if (req.method !== 'POST' || url.origin !== self.location.origin || url.searchParams.get('compartilhar') !== '1') return;
  e.respondWith((async () => {
    try { const fd = await req.formData(); const f = fd.getAll('foto').find(x => x && x.size) || null;
      if (f) { const c = await caches.open('compartilhado'); await c.put(new URL('foto-compartilhada', self.registration.scope).href, new Response(f, {headers:{'Content-Type': f.type || 'image/jpeg'}})); } } catch (x) {}
    return Response.redirect(new URL('./index.html?compartilhado=1', self.registration.scope).href, 303);
  })());
});
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
