// Ranking de vendas posto (carregado antes do app; usa as funções do index.html na hora do uso).
/* ---------- ranking de vendas posto: abas, funções, metas, equipe e fotos ---------- */
const RK = [
  {k:"loja", t:"Loja", ico:"🛒", p:"Vendedor", lt:false},
  {k:"diesel", t:"Frentista Diesel", ico:"🛢️", p:"Frentista", lt:true},
  {k:"gasolina", t:"Frentista Gasolina", ico:"⛽", p:"Frentista", lt:true},
  {k:"caixa", t:"Caixa", ico:"💵", p:"Caixa", lt:false},
  {k:"opcaixa", t:"Operações Caixa", ico:"🧾", p:"Operador", lt:false}
];
/* abas só de visualização: juntam Diesel + Gasolina de uma função */
const RKV = [
  {k:"lubrificador", t:"Frentista Lubrificador", ico:"🔧", p:"Frentista", lt:true, fun:"lubrificador"},
  {k:"madrugada", t:"Frentista Madrugada", ico:"🌙", p:"Frentista", lt:true, fun:"frentista_madrugada"}
];
const RKT = {k:"todos", t:"Todos", ico:"👥", p:"Colaborador", lt:true, fun:null};
const rkVirtual = k => k === "todos" || RKV.some(v => v.k === k);
const FRENT = {diesel:"Frentista Diesel", gasolina:"Frentista Gasolina", lubrificador:"Frentista Lubrificador", madrugada:"Frentista Madrugada"};
const FUNC_SETOR = {diesel:"frentista", gasolina:"frentista", lubrificador:"lubrificador", madrugada:"frentista_madrugada"};
/* setor escolhido em ⚙️ → Frentistas; sem escolha, vale a função da pessoa ou o relatório de onde veio */
function setorDe(p, r){ if (p && FRENT[p.setor]) return p.setor; return r.funcao === "lubrificador" ? "lubrificador" : r.funcao === "frentista_madrugada" ? "madrugada" : r.src; }
function frentistasDe(k){ const ord = S.rkOrdem || "q"; return ["diesel", "gasolina"].filter(t => rkAbas().some(c => c.k === t)).flatMap(t => vendasDoMes(t).map(r => ({...r, id:t + "~" + r.id}))).filter(r => r.setor === k).sort((a, b) => b[ord] - a[ord] || b.q - a.q); }
/* id "diesel~abc" (vindo das abas Lubrificador/Madrugada) → ["diesel", "abc"] */
const rkDividir = id => { const s = String(id || ""), i = s.indexOf("~"); return i > 0 ? [s.slice(0, i), s.slice(i + 1)] : [S.rkTipo, s]; };
/* abas ligadas nesta filial (Configurar → Opções). Operações Caixa vem desligada. */
const rkAbas = () => { const a = S.cfg && S.cfg.rkAbas, v = RK.filter(c => Array.isArray(a) ? a.includes(c.k) : c.k !== "opcaixa"); return v.length ? v : RK.slice(0, 1); };
const FUNCOES_BASE = {loja:"Loja", caixa:"Caixa", caixa_madrugada:"Caixa Madrugada", frentista:"Frentista", frentista_madrugada:"Frentista Madrugada", lubrificador:"Frentista Lubrificador"};
const GRUPO_ABA = {loja:"loja", caixa:"caixa", opcaixa:"caixa", diesel:"frentista", gasolina:"frentista"};
const BASE_GRUPO = {loja:["loja"], caixa:["caixa", "caixa_madrugada"], frentista:["frentista", "frentista_madrugada", "lubrificador"]};
/* funções criadas pelo administrador (ex.: Frentista Tarde), cada uma com sua meta */
const funcoesExtras = () => Object.fromEntries(Object.entries((S.cfg && S.cfg.rkFuncoes) || {}).filter(([, f]) => f && !f.x && f.nome));
const funcoesTodas = () => ({...FUNCOES_BASE, ...Object.fromEntries(Object.entries(funcoesExtras()).map(([k, f]) => [k, f.nome]))});
const nomeFuncao = k => funcoesTodas()[k] || FUNCOES_BASE[k] || k;
const funcoesDaAba = t => [...BASE_GRUPO[GRUPO_ABA[t] || "loja"], ...Object.entries(funcoesExtras()).filter(([, f]) => f.grupo === (GRUPO_ABA[t] || "loja")).map(([k]) => k)];
const funcaoPadrao = t => BASE_GRUPO[GRUPO_ABA[t] || "loja"][0];
const campoPadrao = t => (t === "diesel" || t === "gasolina" || rkVirtual(t)) ? "lt" : t === "opcaixa" ? "q" : "mc";
const CAMPOS = {q:"Quantidade", mc:"Venda MC", lt:"Litragem"};
const rkCat = () => RK.find(c => c.k === S.rkTipo) || RKV.find(c => c.k === S.rkTipo) || (S.rkTipo === "todos" ? RKT : RK[0]);
/* abas do seletor: as ligadas + Lubrificador e Madrugada (se Diesel ou Gasolina estiver ligada) */
const rkAbasVer = () => { const a = rkAbas(), out = [RKT]; for (const c of a) { out.push(c); if (c.k === "gasolina" || (c.k === "diesel" && !a.some(x => x.k === "gasolina"))) out.push(...RKV); } return out; };
/* lista que aparece na tela: Diesel/Gasolina sem Lubrificador e Madrugada (eles têm aba própria) */
const listaRk = c => FRENT[c.k] ? frentistasDe(c.k) : vendasDoMes(c.k);
const rankingAtivo = () => !!(S.cfg && S.cfg.ranking);
const rkFotosAtivas = () => !!(S.cfg && S.cfg.rkFotos);
const moeda = v => num(v).toLocaleString("pt-BR", {minimumFractionDigits:2, maximumFractionDigits:2});
const fmt2 = v => num(v).toLocaleString("pt-BR", {minimumFractionDigits:2, maximumFractionDigits:2});
const fmtCampo = (campo, v) => campo === "mc" ? "R$ " + moeda(v) : campo === "lt" ? fmt2(v) + " L" : num(v).toLocaleString("pt-BR", {maximumFractionDigits:2});
function proxMes(n){ const h = new Date(), d = new Date(h.getFullYear(), h.getMonth() + n, 1); return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0"); }
function rkMesAtual(){ const h = new Date(); return h.getFullYear() + "-" + String(h.getMonth() + 1).padStart(2, "0"); }
function rkLayout(){ return (S.cfg && S.cfg.rkLayout) || "cartoes"; }

/* equipe: cadastrada automaticamente na importação; o que o administrador muda não é trocado pelas próximas importações */
const pessoasRk = () => Object.fromEntries(Object.entries((S.cfg && S.cfg.rkPessoas) || {}).filter(([id]) => !id.startsWith("c_")));
function acharPessoa(nome){
  const n = semAcento(nome).replace(/\s+/g, " ").trim(), P = pessoasRk();
  for (const [id, p] of Object.entries(P)) { if (!p || p.x) continue; if (semAcento(p.nome || "") === n || (p.chaves || []).includes(n)) return {id, ...p}; }
  return null;
}
function funcaoDe(p, tab){ const f = p && p.funcao; return funcoesDaAba(tab).includes(f) ? f : funcaoPadrao(tab); }
/* cadastra quem ainda não existe; devolve {nomeLido: id} */
async function registrarPessoas(nomes, tab){
  const patch = {}, ids = {};
  nomes.forEach((nome, i) => {
    const ja = acharPessoa(nome);
    if (ja) { ids[nome] = ja.id; return; }
    const chave = semAcento(nome).replace(/\s+/g, " ").trim(), novo = Object.entries(patch).find(([, v]) => v.chaves[0] === chave);
    if (novo) { ids[nome] = novo[0]; return; }
    const id = "p" + Date.now().toString(36) + i;
    patch[id] = {nome:nome.trim(), funcao:funcaoPadrao(tab), chaves:[chave], x:0}; ids[nome] = id;
  });
  if (Object.keys(patch).length) {
    await S.db.doc("cfg/main").update({rkPessoas:patch});
    S.cfg = {...(S.cfg || {}), rkPessoas:{...pessoasRk(), ...patch}};
  }
  return ids;
}

/* lançamentos do mês, com a pessoa e a função de cada um */
function vendasDoMes(tipo){
  const V = RKV.find(v => v.k === tipo);
  if (V) return frentistasDe(V.k);
  if (tipo === "todos") { const ord = S.rkOrdem || "q", ativa = t => rkAbas().some(c => c.k === t);
    return ["diesel", "gasolina", "loja", "caixa"].filter(ativa).flatMap(t => vendasDoMes(t).map(r => ({...r, id:t + "~" + r.id}))).sort((a, b) => b[ord] - a[ord] || b.q - a.q); }
  const d = (S.vendas || {})[S.rkMes] || {}, P = pessoasRk(), venc = DEDUP_TABS.includes(tipo) ? rkVencedores() : null;
  const ents = new Map([...(tipo === "diesel" ? Object.entries(d.frentista || {}).map(([id, v]) => [id, ["frentista", v]]) : []), ...Object.entries(d[tipo] || {}).map(([id, v]) => [id, [tipo, v]])]);
  const arr = [...ents].filter(([id, [tb, v]]) => v && !v.x && v.nome && (!venc || venc.has(tb + "/" + id))).map(([id, [, v]]) => {
    const p = (v.pid && P[v.pid] && !P[v.pid].x) ? {id:v.pid, ...P[v.pid]} : acharPessoa(v.nome);
    const r = {id, tab:tipo, src:tipo, pid:p ? p.id : null, nome:p ? p.nome : v.nome, funcao:funcaoDe(p, tipo), q:num(v.q), mc:num(v.mc), lt:num(v.lt)};
    if (tipo === "diesel" || tipo === "gasolina") { r.setor = setorDe(p, r); r.funcao = FUNC_SETOR[r.setor] === "frentista" && r.funcao !== "lubrificador" && r.funcao !== "frentista_madrugada" ? r.funcao : FUNC_SETOR[r.setor]; if (r.setor === "diesel" || r.setor === "gasolina") r.tab = r.setor; }
    return r;
  });
  const ord = S.rkOrdem || "q", chaves = [ord, ...["q", "mc", "lt"].filter(k => k !== ord)];
  arr.sort((a, b) => { for (const k of chaves) if (b[k] !== a[k]) return b[k] - a[k]; return a.nome.localeCompare(b.nome, "pt-BR"); });
  return arr;
}

/* metas: por aba e função (por pessoa ou total da equipe dividido) e individual; valem a partir do mês em que foram salvas */
function ultimoMes(fn){
  const meses = Object.keys(S.vendas || {}).filter(m => /^\d{4}-\d{2}$/.test(m) && m <= S.rkMes).sort().reverse();
  for (const m of meses) { const v = fn(S.vendas[m] || {}); if (v != null) return {v, mes:m}; }
  return null;
}
function metaGrupo(tab, funcao, campoF){
  const tem = g => g && (num(g.mc) > 0 || num(g.lt) > 0 || num(g.q) > 0 || num(g.valor) > 0);
  const r = ultimoMes(d => { const g = ((d.metas2 || {})[tab] || {})[funcao]; if (tem(g)) return g;
    if (funcao === funcaoPadrao(tab)) { const a = (d.metas || {})[tab]; if (a && num(a.valor) > 0) return {campo:a.campo || "mc", modo:"pessoa", valor:a.valor}; } return null; });
  if (!r) return null;
  const v = r.v, antigo = k => v.campo === k ? num(v.valor) : 0, mc = num(v.mc) || antigo("mc"), lt = num(v.lt) || antigo("lt"), q = num(v.q) || antigo("q");
  const campo = campoF || (lt > 0 ? "lt" : q > 0 ? "q" : "mc"), valor = {mc, lt, q}[campo] || 0;
  if (!(valor > 0)) return null;
  return {campo, modo:v.modo || "pessoa", valor, mc, lt, q, herdada:r.mes !== S.rkMes};
}
function metaIndividual(tab, pid){
  if (!pid) return null;
  const r = ultimoMes(d => { const v = ((d.metasInd || {})[tab] || {})[pid]; return num(v) > 0 ? num(v) : null; });
  return r ? r.v : null;
}
/* meta de uma pessoa: a individual, se houver; senão a da função (por pessoa, ou o total dividido pela equipe) */
function metaDaPessoa(r, tab, lista, campoF){
  tab = r.tab || tab;
  const g = metaGrupo(tab, r.funcao, campoF), ind = campoF ? null : metaIndividual(tab, r.pid), campo = campoF || (g ? g.campo : campoPadrao(tab));
  if (ind) return {campo, valor:ind, origem:"individual"};
  if (!g) return null;
  if (g.modo === "equipe") { const n = lista.filter(x => x.funcao === r.funcao).length || 1; return {campo, valor:g.valor / n, origem:"dividida"}; }
  return {campo, valor:g.valor, origem:"funcao"};
}
/* meta de Venda MC (venda da loja) da pessoa; para frentistas é a 2ª meta, além da litragem */
function metaMcDaPessoa(r, tab, lista){ const m = metaDaPessoa(r, tab, lista); return m && m.campo === "mc" ? m : metaDaPessoa(r, tab, lista, "mc"); }
/* logo do Aldo: vira um endereço curto uma vez só (a imagem base64 é grande) */
let RK_LOGO_URL = null, RK_LOGO_IMG = null;
function rkLogoAntigo(){
  try { const d = (typeof LOGO !== "undefined" && LOGO.POSTO) || ""; if (d) { const [cab, b64] = d.split(","), bin = atob(b64), u = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i); return URL.createObjectURL(new Blob([u], {type:(cab.match(/data:([^;]+)/) || [])[1] || "image/png"})); } } catch (e) {}
  return "";
}
/* logo nova (PNG sem fundo, arquivo logo-aldo.png); se o arquivo faltar, usa a logo antiga */
function rkLogo(){
  if (RK_LOGO_URL !== null) return RK_LOGO_URL;
  RK_LOGO_URL = "logo-aldo.png?v=1"; RK_LOGO_IMG = new Image();
  RK_LOGO_IMG.onerror = () => { RK_LOGO_IMG.onerror = null; RK_LOGO_URL = rkLogoAntigo(); if (RK_LOGO_URL) RK_LOGO_IMG.src = RK_LOGO_URL; };
  RK_LOGO_IMG.src = RK_LOGO_URL;
  return RK_LOGO_URL;
}
function situacao(v, meta){
  if (!meta || !(meta.valor > 0)) return null;
  const real = v[meta.campo], pct = Math.floor(real / meta.valor * 100), bateu = real >= meta.valor, dif = Math.abs(real - meta.valor);
  return {pct, bateu, cor:bateu ? "var(--good)" : pct >= 70 ? "var(--warn)" : "var(--crit)", texto:bateu ? `✅ ${pct}% · passou ${fmtCampo(meta.campo, dif)}` : `${pct}% · faltam ${fmtCampo(meta.campo, dif)}`};
}
function barra(st, alto){
  if (!st) return "";
  const passou = st.pct > 100 ? Math.min(100, st.pct - 100) : 0;
  return `<div style="position:relative;height:${alto || 8}px;background:var(--line);border-radius:99px;overflow:hidden;margin-top:5px"><i style="position:absolute;left:0;top:0;bottom:0;width:${Math.min(100, st.pct)}%;background:${st.cor}"></i>${passou ? `<i style="position:absolute;right:0;top:0;bottom:0;width:${passou}%;background:repeating-linear-gradient(45deg,var(--good),var(--good) 4px,color-mix(in srgb,var(--good) 55%,#fff) 4px,color-mix(in srgb,var(--good) 55%,#fff) 8px)"></i>` : ""}</div><small style="color:${st.cor};font-weight:700">${st.texto}</small>`;
}
function fotoPessoa(r, tam){
  if (!rkFotosAtivas()) return "";
  const f = r.pid && (S.rkFotos || {})[r.pid];
  return `<span style="width:${tam}px;height:${tam}px;border-radius:50%;flex:none;overflow:hidden;background:var(--surface2);border:1px solid var(--line);display:flex;align-items:center;justify-content:center;font-weight:800;font-size:${Math.round(tam / 2.6)}px;color:var(--muted)">${f ? `<img src="${f}" alt="" style="width:100%;height:100%;object-fit:cover">` : esc((r.nome || "?").split(" ").map(x => x[0]).slice(0, 2).join(""))}</span>`;
}
function carregaFotosRk(forcar){
  if (!rkFotosAtivas() || (S.rkFotosLidas && !forcar) || !S.db) return;
  S.rkFotosLidas = true; let parar = null;
  parar = S.db.collection("rkfoto").onSnapshot(q => { const o = {}; for (const d of q.docs) { const v = d.data(); if (v && typeof v.d === "string") o[d.id] = v.d; } S.rkFotos = o; if (parar) parar(); if (S.view === "ranking" || S.view === "rkcfg") render(); }, () => {});
}
async function gravaVendas(patch){
  await S.db.doc("vendas/" + S.rkMes).update(patch);
  S.vendas = {...(S.vendas || {}), [S.rkMes]:deepMerge((S.vendas || {})[S.rkMes] || {}, patch)}; S.vendasK = JSON.stringify(S.vendas);
  if (!patch.batidas) await marcarBatidas();
  if (S.view === "ranking" || S.view === "rkcfg") render();
}
const nomeMes = ym => { const [a, m] = ym.split("-"); return MESES[Number(m) - 1] + " de " + a; };

function vRanking(){
  S.rkMes = S.rkMes || rkMesAtual(); S.rkTipo = rkAbasVer().some(c => c.k === S.rkTipo) ? S.rkTipo : rkAbas()[0].k; S.rkOrdem = S.rkOrdem || "q";
  carregaFotosRk();
  const c = rkCat(), lista = listaRk(c), med = ["🥇", "🥈", "🥉"], lay = rkLayout(), junta = rkVirtual(c.k);
  const meses = [...new Set([rkMesAtual(), S.rkMes, ...Object.keys(S.vendas || {}).filter(m => /^\d{4}-\d{2}$/.test(m))])].sort().reverse();
  const ordens = [["q", "Quantidade"], ["mc", "Venda MC"], ...(c.lt ? [["lt", "Litragem"]] : [])];
  const linhas = lista.map(r => ({...r, meta:metaDaPessoa(r, c.k, lista)})).map(r => { const st = situacao(r, r.meta), mm = r.meta && r.meta.campo !== "mc" ? metaDaPessoa(r, c.k, lista, "mc") : null; return {...r, st, mcSt:situacao(r, mm), mcMeta:mm}; });
  // resumo por função: realizado x meta total (soma das metas de cada um)
  const resumo = (c.k === "todos" ? [] : rkVirtual(c.k) ? [c.fun] : funcoesDaAba(c.k)).map(f => {
    const g = linhas.filter(r => r.funcao === f); if (!g.length) return "";
    const comMeta = g.filter(r => r.meta); if (!comMeta.length) return `<div style="margin-top:8px"><b>${nomeFuncao(f)}</b> <span class="meta">· ${g.length} pessoa(s) · sem meta</span></div>`;
    const campos = [comMeta[0].meta.campo]; if (campos[0] !== "mc" && g.some(r => metaDaPessoa(r, c.k, lista, "mc"))) campos.push("mc");
    const bat = comMeta.filter(r => r.st && r.st.bateu).length;
    const rotulo = campo => campo === "lt" ? "⛽ Litragem" : campo === "mc" ? "🛒 Venda da loja" : c.k === "opcaixa" ? "🧾 Operações" : CAMPOS[campo];
    /* % que passou ou faltou: +12% = passou 12% da meta; -8% = faltou 8% */
    const dif = st => st ? (st.bateu ? `<b style="color:var(--good)">✅ passou ${st.pct - 100}%</b>` : `<b style="color:${st.cor}">faltou ${100 - st.pct}%</b>`) : `<span class="meta">sem meta</span>`;
    let stPrin = null;
    const barras = campos.map(campo => { const ms = g.map(r => campo === campos[0] ? r.meta : metaDaPessoa(r, c.k, lista, campo)).filter(Boolean), metaTot = ms.reduce((a, m) => a + m.valor, 0), real = g.reduce((a, r) => a + r[campo], 0), st = situacao({[campo]:real}, {campo, valor:metaTot}); if (!stPrin) stPrin = st;
      return `<div style="font-size:12px;color:var(--muted);margin-top:6px">${rotulo(campo)}: ${fmtCampo(campo, real)} de ${fmtCampo(campo, metaTot)} · ${dif(st)}</div>${barra(st, 8)}`; }).join("");
    const pessoas = g.map(r => `<div style="display:flex;justify-content:space-between;gap:8px;font-size:12px;padding:5px 0;border-top:1px solid var(--line)"><span style="min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(r.nome)}</span><span style="white-space:nowrap">${campos.map(campo => { const m = campo === campos[0] ? r.meta : metaDaPessoa(r, c.k, lista, campo), st = situacao(r, m); return st ? `${campo === "lt" ? "⛽" : "🛒"} ${dif(st)}` : ""; }).filter(Boolean).join(" · ") || dif(null)}</span></div>`).join("");
    return `<details style="margin-top:8px;border:1px solid var(--line);border-radius:12px;padding:8px 10px"><summary style="cursor:pointer;display:flex;justify-content:space-between;gap:8px;flex-wrap:wrap;list-style:none"><b>${nomeFuncao(f)}</b><span style="font-size:12px">${dif(stPrin)} · ${bat}/${g.length} bateram ▾</span></summary>${barras}<div style="margin-top:8px">${pessoas}</div></details>`;
  }).join("");
  const dq = rkDestaqueAtivo() ? destaqueDe(c.k) : null;
  const nomeL = r => `<button data-act="rkPessoa" data-id="${r.id}" style="all:unset;cursor:pointer;display:flex;gap:8px;align-items:center;min-width:0">${fotoPessoa(r, 34)}<span style="min-width:0"><b style="display:block">${esc(r.nome)}${dq && dq.r.pid && dq.r.pid === r.pid ? ` <span title="Primeiro a bater a meta">⭐</span>` : ""}</b><span class="meta" style="font-size:11px">${nomeFuncao(r.funcao)}${r.meta && r.meta.origem === "individual" ? " · meta individual" : ""}</span></span></button>`;
  const acoes = r => `<div style="display:flex;flex-direction:column;gap:4px"><button class="btn sm" style="padding:4px 8px;min-width:0;width:auto" data-act="cartaoPessoa" data-id="${r.id}" aria-label="Cartão individual">📤</button>${S.admin ? `<button class="btn sm" style="padding:4px 8px;min-width:0;width:auto" data-act="editarVenda" data-id="${r.id}" aria-label="Alterar">✏️</button><button class="btn sm" style="padding:4px 8px;min-width:0;width:auto;color:var(--crit)" data-act="excluirVenda" data-id="${r.id}" aria-label="Excluir">🗑️</button>` : ""}</div>`;
  let corpo = "";
  if (!linhas.length) corpo = `<p class="meta">Nenhum lançamento em ${c.t} · ${nomeMes(S.rkMes)}.${S.admin ? (junta ? " Lance pelas abas Diesel ou Gasolina, com a pessoa cadastrada nesta função (⚙️ → Equipe)." : " Use 📷 (importar da imagem) ou ➕ (lançar à mão).") : ""}</p>`;
  else if (lay === "tabela") corpo = `<div style="overflow-x:auto"><table class="tbl"><tr><th>#</th><th>${c.p}</th><th class="n">Qtd.</th><th class="n">Venda MC</th>${c.lt ? `<th class="n">Litragem</th>` : ""}<th class="n">Meta</th><th class="n">%</th></tr>
      ${linhas.map((r, i) => `<tr><td>${med[i] || i + 1}</td><td><b data-act="rkPessoa" data-id="${r.id}" style="cursor:pointer">${esc(r.nome)}</b><br><span class="meta" style="font-size:11px">${nomeFuncao(r.funcao)}</span></td><td class="n">${fmt2(r.q)}</td><td class="n">${moeda(r.mc)}</td>${c.lt ? `<td class="n">${fmt2(r.lt)}</td>` : ""}<td class="n">${r.meta ? fmtCampo(r.meta.campo, r.meta.valor) : "—"}</td><td class="n" style="color:${r.st ? r.st.cor : "inherit"};font-weight:700">${r.st ? r.st.pct + "%" : "—"}</td></tr>`).join("")}</table></div>`;
  else if (lay === "grafico") corpo = linhas.map((r, i) => `<div style="padding:8px 0;border-bottom:1px solid var(--line)"><div style="display:flex;justify-content:space-between;gap:8px;align-items:center"><div style="display:flex;gap:6px;align-items:center;min-width:0"><span style="font-weight:800;min-width:24px">${med[i] || i + 1}</span>${nomeL(r)}</div><b style="white-space:nowrap">${r.meta ? fmtCampo(r.meta.campo, r[r.meta.campo]) : fmtCampo(S.rkOrdem, r[S.rkOrdem])}</b></div>${r.st ? barra(r.st, 14) : `<small class="meta">sem meta</small>`}</div>`).join("");
  else corpo = linhas.map((r, i) => `<div style="display:flex;gap:10px;align-items:flex-start;padding:10px 0;border-bottom:1px solid var(--line)">
        <div style="font-size:20px;min-width:28px;text-align:center;font-weight:800">${med[i] || i + 1}</div>
        <div style="flex:1;min-width:0">${nomeL(r)}
          <div class="meta" style="display:flex;flex-wrap:wrap;gap:4px 12px;margin-top:4px"><span>Qtd. <b>${fmt2(r.q)}</b></span><span>Venda MC <b>R$ ${moeda(r.mc)}</b></span>${c.lt ? `<span>Litragem <b>${fmt2(r.lt)} L</b></span>` : ""}${r.meta ? `<span>Meta <b>${fmtCampo(r.meta.campo, r.meta.valor)}</b></span>` : ""}</div>
          ${barra(r.st)}${r.mcSt ? `<div class="meta" style="font-size:11px;margin-top:4px">🛒 Venda da loja · meta R$ ${moeda(r.mcMeta.valor)}</div>${barra(r.mcSt, 6)}` : ""}${opDaPessoa(r)}</div>${acoes(r)}</div>`).join("");
  const total = k => lista.reduce((a, r) => a + r[k], 0);
  return `<div class="top"><button class="back" data-act="${S.admin ? "admin" : "home"}">Voltar</button><h1>Ranking de vendas posto</h1></div><div class="pad">
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px">
      <select id="rkTipoSel" class="inp" aria-label="Setor">${rkAbasVer().map(x => `<option value="${x.k}" ${x.k === c.k ? "selected" : ""}>${x.ico} ${x.t}</option>`).join("")}</select>
      <select id="rkMes" class="inp" aria-label="Mês">${meses.map(m => `<option value="${m}" ${m === S.rkMes ? "selected" : ""}>${MESES[Number(m.slice(5)) - 1].slice(0, 3)}/${m.slice(0, 4)}</option>`).join("")}</select></div>
    <div style="display:flex;gap:6px;margin-top:6px;align-items:center">
      <select id="rkOrdemSel" class="inp" aria-label="Ordenar" style="flex:1;min-width:0">${ordens.map(([k, t]) => `<option value="${k}" ${k === S.rkOrdem ? "selected" : ""}>↕ ${({q:"Qtd.", mc:"Venda MC", lt:"Litros"})[k] || t}</option>`).join("")}</select>
      ${S.admin ? `<button class="btn" style="width:auto;flex:none;padding:8px 11px;margin:0" data-act="rkCfg" title="Configurar metas" aria-label="Configurar">⚙️</button><label class="btn brand" style="width:auto;flex:none;padding:8px 11px;margin:0;cursor:pointer" title="Importar da imagem" aria-label="Importar">📷<input type="file" accept="image/*" data-rk-img="1" hidden></label>${junta ? "" : `<button class="btn" style="width:auto;flex:none;padding:8px 11px;margin:0" data-act="novaVenda" title="Lançar à mão" aria-label="Lançar">➕</button>`}` : ""}<button class="btn" style="width:auto;flex:none;padding:8px 11px;margin:0" data-act="rkBaixar" title="Baixar e enviar" aria-label="Baixar">⬇️</button><button class="btn" style="width:auto;flex:none;padding:8px 11px;margin:0" data-act="rkRecarregar" title="Atualizar página" aria-label="Atualizar">🔄</button></div>
    ${c.k === "caixa" && S.admin ? cardOperacoes() : ""}
    ${cardMetaGeral()}
    ${dq ? `<div class="card" style="border:1px solid #fbbf24"><h2>⭐ Destaque do mês · ${c.t}</h2><div style="display:flex;gap:10px;align-items:center;margin-top:6px">${fotoPessoa(dq.r, 46)}<div><b>${esc(dq.r.nome)}</b><br><span class="meta">Primeiro a bater a meta · ${new Date(dq.t).toLocaleDateString("pt-BR")}</span></div></div></div>` : ""}
    ${c.k === "todos" ? "" : `<details class="card"><summary style="cursor:pointer;font-weight:800">🎯 Metas por função · ${c.t}</summary>${resumo || `<p class="meta" style="margin:4px 0">Sem lançamentos neste mês.</p>`}</details>`}
    <div class="card">${corpo}${linhas.length ? `<div class="meta" style="display:flex;flex-wrap:wrap;gap:4px 12px;padding-top:10px"><b>Total</b><span>Qtd. <b>${fmt2(total("q"))}</b></span><span>Venda MC <b>R$ ${moeda(total("mc"))}</b></span>${c.lt ? `<span>Litragem <b>${fmt2(total("lt"))} L</b></span>` : ""}</div>` : ""}</div>${cardProdutos(c)}</div>`;
}

/* ⚙️ configurar: metas por função, metas individuais, equipe e opções */
/* metas organizadas por setor: gerais, Venda MC por setor, frentistas, loja e caixa */
function categoriasMeta(){
  const ativa = k => rkAbas().some(c => c.k === k), extras = g => Object.entries(funcoesExtras()).filter(([, f]) => f.grupo === g);
  const fr = [], lj = [], cx = [];
  if (ativa("diesel")) fr.push({t:"Frentista Diesel", alvos:[["diesel", "frentista"]]});
  if (ativa("gasolina")) fr.push({t:"Frentista Gasolina", alvos:[["gasolina", "frentista"]]});
  const ambos = f => ["diesel", "gasolina"].filter(ativa).map(t => [t, f]);
  if (ambos("x").length) { fr.push({t:"Frentista Lubrificador", alvos:ambos("lubrificador")}, {t:"Frentista Madrugada", alvos:ambos("frentista_madrugada")}); extras("frentista").forEach(([k, f]) => fr.push({t:f.nome, alvos:ambos(k)})); }
  if (ativa("loja")) { lj.push({t:"Vendedor da Loja", alvos:[["loja", "loja"]]}); extras("loja").forEach(([k, f]) => lj.push({t:f.nome, alvos:[["loja", k]]})); }
  for (const [tab, nome] of [["caixa", "Caixa"], ["opcaixa", "Operações Caixa"]]) if (ativa(tab)) { cx.push({t:nome, alvos:[[tab, "caixa"]]}, {t:nome + " Madrugada", alvos:[[tab, "caixa_madrugada"]]}); extras("caixa").forEach(([k, f]) => cx.push({t:f.nome + (tab === "opcaixa" ? " (Operações)" : ""), alvos:[[tab, k]]})); }
  return [["⛽ Meta Frentistas", fr, true], ["🛒 Meta Loja", lj, false], ["💵 Meta Caixa", cx, false]].filter(([, l]) => l.length);
}
function telaMetasSetores(mg){
  S.rkCats = [];
  const v = (x, f) => x ? esc(f(x.valor)) : "", salvar = `<button class="btn pri" style="margin-top:12px" data-act="salvarMetasSetores">💾 Salvar metas</button>`;
  const campoGeral = (id, rot, x, f, ex) => `<label class="f" style="margin-top:8px">${rot}<input class="inp" data-mgs="${id}" inputmode="decimal" placeholder="${ex}" value="${v(x, f)}"></label>`;
  const grupos = categoriasMeta().map(([tit, cats, comLt]) => `<div class="card"><h2>${tit} · ${nomeMes(S.rkMes)}</h2>
      <p style="margin:4px 0 6px;font-size:12px;color:var(--muted);line-height:1.4"><b>Venda da loja (MC):</b> quanto a categoria vende em R$ (entra no total da loja).${comLt ? " <b>Litragem:</b> litros da categoria." : ""} <b>Por pessoa</b> vale para cada um; <b>Total da equipe</b> é dividido entre as pessoas. Em branco: sem meta.</p>
      ${cats.map(cat => { const n = S.rkCats.push(cat) - 1, [t0, f0] = cat.alvos[0], g = metaGrupo(t0, f0) || {};
        return `<div style="border:1px solid var(--line);border-radius:12px;padding:8px 10px;margin-top:8px"><div style="display:flex;justify-content:space-between;gap:8px;align-items:center"><b>${esc(cat.t)}</b>
          <select class="inp" data-cat-modo="${n}" style="padding:6px;width:auto"><option value="pessoa" ${g.modo !== "equipe" ? "selected" : ""}>Por pessoa</option><option value="equipe" ${g.modo === "equipe" ? "selected" : ""}>Total da equipe</option></select></div>
        <div style="display:grid;grid-template-columns:${comLt ? "1fr 1fr" : "1fr"};gap:6px;margin-top:6px">
          ${t0 === "opcaixa" ? `<label class="meta" style="font-size:11px">🧾 Meta de operações (quantidade)<input class="inp" data-cat-mc="${n}" data-cat-q="1" inputmode="decimal" placeholder="Ex.: 1.500" value="${g.q ? esc(fmtCampo("q", g.q)) : ""}" style="padding:8px"></label>` : `<label class="meta" style="font-size:11px">🛒 Venda da loja (R$)<input class="inp" data-cat-mc="${n}" inputmode="decimal" placeholder="Ex.: 9.000,00" value="${g.mc ? esc(moeda(g.mc)) : ""}" style="padding:8px"></label>`}
          ${comLt ? `<label class="meta" style="font-size:11px">⛽ Litragem (L)<input class="inp" data-cat-lt="${n}" inputmode="decimal" placeholder="Ex.: 90.000" value="${g.lt ? esc(fmt2(g.lt)) : ""}" style="padding:8px"></label>` : ""}</div></div>`; }).join("")}
      ${salvar}</div>`).join("");
  return `<div class="card"><h2>🏪 Metas gerais do posto · ${nomeMes(S.rkMes)}</h2>
      <p style="margin:4px 0 0;font-size:12px;color:var(--muted);line-height:1.4">Vale desse mês em diante, até ser trocada. A Venda da Loja soma a Venda MC de todos (loja, caixa e frentistas).</p>
      ${rkAbas().some(c => c.lt) ? campoGeral("litros", "⛽ Litros no mês · todos os frentistas", mg.litros, fmt2, "Ex.: 900.000") : ""}
      ${campoGeral("loja", "🛒 Venda da Loja no mês (R$) · soma de todos", mg.loja, moeda, "Ex.: 129.000,00")}${rkAbas().some(c => c.k === "opcaixa") ? campoGeral("operacoes", "🧾 Operações Caixa no mês (quantidade) · meta dos caixas", mg.operacoes, v => fmtCampo("q", v), "Ex.: 6.000") : ""}${salvar}</div>
    ${grupos}`;
}
async function salvarMetasSetores(b){
  const geral = {}, metas2 = {}, ler = el => { const t = el ? el.value.trim() : ""; return t ? parse(t) : 0; };
  for (const el of document.querySelectorAll("[data-mgs]")) { const x = ler(el); if (!(x >= 0)) return toast("Valor inválido. Ex.: 129.000,00"); geral[el.dataset.mgs] = x; }
  if ("loja" in geral) geral.valor = geral.loja;
  for (const el of document.querySelectorAll("[data-cat-mc]")) {
    const n = el.dataset.catMc, cat = (S.rkCats || [])[n]; if (!cat) continue;
    const mc = ler(el), lt = ler(document.querySelector(`[data-cat-lt="${n}"]`)); if (!(mc >= 0) || !(lt >= 0)) return toast("Valor inválido em " + cat.t + ". Ex.: 9.000,00");
    const modo = (document.querySelector(`[data-cat-modo="${n}"]`) || {}).value || "pessoa";
    const ehQ = el.dataset.catQ === "1";
    for (const [tab, f] of cat.alvos) (metas2[tab] = metas2[tab] || {})[f] = ehQ ? {modo, q:mc, mc:0, lt:0, campo:"", valor:0} : {modo, mc, lt, campo:"", valor:0};
  }
  b.disabled = true; await safe(() => gravaVendas({metaGeral:geral, metas2}), "Metas salvas."); b.disabled = false;
}
function vRkCfg(){
  S.rkMes = S.rkMes || rkMesAtual(); S.rkTipo = rkAbas().some(c => c.k === S.rkTipo) ? S.rkTipo : rkAbas()[0].k; S.rkCfgAba = S.rkCfgAba || "metas";
  carregaFotosRk();
  const c = rkCat(), aba = S.rkCfgAba, P = pessoasRk(), lista = vendasDoMes(c.k);
  const abas = [["metas", "🎯 Metas"], ...(rkAbas().some(x => x.k === "diesel" || x.k === "gasolina") ? [["setores", "⛽ Frentistas"]] : []), ["individual", "👤 Metas individuais"], ["equipe", "👥 Equipe"], ["opcoes", "⚙️ Opções"]];
  let corpo = "";
  const mg = metasGerais();
  if (aba === "metas") corpo = telaMetasSetores(mg);
  else if (aba === "setores") corpo = telaSetores();
  else if (aba === "individual") {
    const gente = [...new Map([...lista.map(r => [r.pid || r.nome, r]), ...Object.entries(P).filter(([, p]) => p && !p.x && funcoesDaAba(c.k).includes(p.funcao)).map(([id, p]) => [id, {pid:id, nome:p.nome, funcao:funcaoDe(p, c.k)}])]).values()].filter(r => r.pid);
    corpo = `<div class="card"><h2>Metas individuais · ${c.t} · ${nomeMes(S.rkMes)}</h2>
      <p class="meta" style="margin:4px 0 10px">Preencha só para quem tem meta diferente da função. Em branco: usa a meta da função. Medida: <b>${CAMPOS[(metaGrupo(c.k, funcaoPadrao(c.k)) || {}).campo || campoPadrao(c.k)]}</b>.</p>
      ${gente.length ? gente.map(r => `<div style="display:flex;gap:8px;align-items:center;padding:6px 0;border-bottom:1px solid var(--line)">${fotoPessoa(r, 30)}<div style="flex:1;min-width:0"><b>${esc(r.nome)}</b><br><span class="meta" style="font-size:11px">${nomeFuncao(r.funcao)}</span></div><input class="inp" style="max-width:140px" data-mi="${r.pid}" inputmode="decimal" placeholder="usa a da função" value="${metaIndividual(c.k, r.pid) ? esc(fmt2(metaIndividual(c.k, r.pid))) : ""}"></div>`).join("") : `<p class="meta">Ninguém cadastrado nesta aba ainda. Importe uma imagem ou lance à mão primeiro.</p>`}
      ${gente.length ? `<button class="btn pri" style="margin-top:12px" data-act="salvarMetasInd">Salvar metas individuais</button>` : ""}</div>`;
  }
  else if (aba === "equipe") {
    /* puxa os nomes de todos os lançamentos do ranking (todos os meses: frentistas, caixa e loja) que ainda não estão na equipe */
    const ABAS_V = {loja:"loja", diesel:"diesel", gasolina:"gasolina", frentista:"diesel", caixa:"caixa", opcaixa:"opcaixa"}, puxados = new Map();
    for (const d of Object.values(S.vendas || {})) for (const [ab, tab] of Object.entries(ABAS_V)) for (const v of Object.values((d && d[ab]) || {})) {
      if (!v || v.x || !v.nome || (v.pid && P[v.pid]) || acharPessoa(v.nome)) continue;
      const id = "p_" + semAcento(v.nome).replace(/[^a-z0-9]/gi, "").toLowerCase();
      if (!puxados.has(id)) puxados.set(id, {nome:String(v.nome).trim(), funcao:funcaoPadrao(tab)});
    }
    const ORD = Object.keys(grupoOpcoes()), grupoP = p => { const i = ORD.indexOf(grupoKey(p)); return i < 0 ? ORD.length : i; };
    const gente = [...Object.entries(P).filter(([, p]) => p && !p.x), ...puxados].sort((a, b) => grupoP(a[1]) - grupoP(b[1]) || a[1].nome.localeCompare(b[1].nome, "pt-BR"));
    corpo = `<div class="card"><h2>Equipe do ranking <small style="font-size:11px;color:var(--muted);font-weight:400">· versão 15</small></h2>
      <input class="inp" id="eqBusca" placeholder="🔎 Buscar nome (equipe e relatórios)" autocomplete="off" style="margin:6px 0">
      <div id="eqNada" hidden style="font-size:12px;color:var(--muted);margin-bottom:6px">Nome não encontrado. Use <b>➕ Adicionar membro</b> no fim da tela.</div>
      <p style="margin:4px 0 10px;font-size:12px;color:var(--muted);line-height:1.4">Toque no grupo de cada pessoa: salva na hora, e a venda e a meta passam a ser desse grupo. Os nomes vêm dos relatórios do ranking.</p>
      ${puxados.size ? `<p class="note" style="margin:0 0 8px">${puxados.size} nome(s) dos lançamentos do ranking ainda não estavam na equipe. Confira a função e toque em <b>Salvar equipe</b>.</p>` : ""}
      ${gente.length ? gente.map(([id, p], i) => `${i === 0 || grupoP(gente[i - 1][1]) !== grupoP(p) ? `<h3 style="margin:14px 0 0;font-size:15px">${grupoOpcoes()[grupoKey(p)] || "Outros"}</h3>` : ""}<div data-eq-row="${esc(semAcento(p.nome))}" style="border:1px solid var(--line);border-radius:12px;padding:8px;margin-top:8px"><div style="display:flex;gap:8px;align-items:center">${fotoPessoa({pid:id, nome:p.nome}, 40)}<input class="inp" data-eq-nome="${id}" value="${esc(p.nome)}" style="flex:1"></div>
        <div style="font-size:11px;color:var(--muted);margin-top:6px">Função (toque para trocar · salva na hora):</div>
        <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:4px;margin-top:4px">${Object.entries(grupoOpcoes()).filter(([k]) => k !== "frentista").map(([k, t]) => `<button class="chip ${grupoKey(p) === k && P[id] ? "on" : ""}" style="justify-content:flex-start;padding:7px 8px;font-size:12px;margin:0" data-act="rkGrupo" data-id="${id}" data-g="${k}" data-n="${esc(p.nome)}">${t}</button>`).join("")}</div>
        <div class="row" style="flex-wrap:wrap;margin-top:6px;align-items:center">
        ${rkFotosAtivas() ? `<label class="btn" style="width:auto;margin:0;cursor:pointer;padding:8px 10px">📷 Foto<input type="file" accept="image/*" data-rk-foto="${id}" hidden></label>${(S.rkFotos || {})[id] ? `<button class="btn" style="width:auto;margin:0;padding:8px 10px" data-act="tirarFotoPessoa" data-id="${id}">Tirar foto</button>` : ""}` : ""}
        <button class="btn" style="width:auto;margin:0;padding:8px 10px;color:var(--crit)" data-act="removerPessoa" data-id="${id}">🗑️</button></div></div>`).join("") : `<p class="meta">Ninguém cadastrado ainda. Importe a primeira imagem no ranking.</p>`}
      ${gente.length ? `<button class="btn pri" style="margin-top:12px" data-act="salvarEquipe">Salvar nomes</button>` : ""}
      <details style="border:1px dashed var(--line);border-radius:12px;padding:10px;margin-top:14px"><summary style="cursor:pointer;font-weight:800">📋 Colar lista da equipe (nome = grupo)</summary>
        <p style="font-size:12px;color:var(--muted);margin:6px 0">Um por linha ou separados por vírgula. Grupos: frentista diesel, frentista gasolina, frentista lubrificador, frentista madrugada, caixa, caixa madrugada, vendedor(a). Quem já está na equipe só muda de grupo (o nome do relatório é reconhecido mesmo com pequenas diferenças).</p>
        <textarea class="inp" id="listaEquipe" rows="6" placeholder="sergio silva araujo = frentista diesel"></textarea>
        <button class="btn pri" style="margin-top:6px" data-act="aplicarListaEquipe">Aplicar lista</button></details>
      <div style="border:1px dashed var(--line);border-radius:12px;padding:10px;margin-top:14px"><b>➕ Adicionar membro à equipe</b>
        <input class="inp" id="novoMembro" placeholder="Nome do colaborador" style="margin-top:6px">
        <div class="row" style="margin-top:6px"><select class="inp" id="novoMembroFuncao" style="flex:1">${Object.entries(FUNCOES_EQUIPE).map(([k, t]) => `<option value="${k}">${t}</option>`).join("")}</select>
        <button class="btn" style="width:auto;margin:0" data-act="addMembro">Adicionar</button></div></div>
</div>
    <div class="card"><h2>Dividir funções</h2>
      <p class="meta" style="margin:4px 0 8px">Crie funções novas (ex.: <b>Frentista Tarde</b>, <b>Caixa Noite</b>). Cada uma ganha meta própria em <b>Metas por função</b>.</p>
      ${Object.entries(funcoesExtras()).map(([k, f]) => `<div style="display:flex;justify-content:space-between;align-items:center;padding:6px 0;border-bottom:1px solid var(--line)"><span><b>${esc(f.nome)}</b> <span class="meta">· grupo ${f.grupo === "caixa" ? "Caixa" : f.grupo === "loja" ? "Loja" : "Frentista"}</span></span><button class="btn sm" style="width:auto;color:var(--crit)" data-act="removerFuncao" data-f="${k}">🗑️</button></div>`).join("") || `<p class="meta">Nenhuma função extra.</p>`}
      <div class="row" style="flex-wrap:wrap;margin-top:8px"><input id="fnNome" class="inp" placeholder="Nome da função" style="flex:2 1 160px"><select id="fnGrupo" class="inp" style="flex:1 1 120px"><option value="frentista">Frentista</option><option value="caixa">Caixa</option><option value="loja">Loja</option></select></div>
      <button class="btn brand" style="margin-top:8px" data-act="novaFuncao">➕ Adicionar função</button></div>`;
  }
  else corpo = `<div class="card"><h2>Opções do ranking</h2>
      <b style="display:block;margin-top:6px">Abas que aparecem</b>
      ${RK.map(x => `<label style="display:flex;gap:8px;align-items:center;margin-top:6px"><input type="checkbox" data-rk-aba="${x.k}" ${rkAbas().some(y => y.k === x.k) ? "checked" : ""}> ${x.ico} ${x.t}</label>`).join("")}
      <label class="f" style="margin-top:12px">Layout do ranking<select id="rkLayoutCfg" class="inp">${[["cartoes", "Cartões (nome, números e barra)"], ["grafico", "Gráfico (barras até a meta)"], ["tabela", "Tabela compacta"]].map(([k, t]) => `<option value="${k}" ${rkLayout() === k ? "selected" : ""}>${t}</option>`).join("")}</select></label>
      <label style="display:flex;gap:8px;align-items:center;margin-top:12px"><input type="checkbox" id="rkFotosOn" ${rkFotosAtivas() ? "checked" : ""}> Mostrar fotos das pessoas no ranking</label>
      <label style="display:flex;gap:8px;align-items:center;margin-top:8px"><input type="checkbox" id="rkDestaqueOn" ${rkDestaqueAtivo() ? "checked" : ""}> Destacar quem bate a meta primeiro no mês (⭐)</label>
      <button class="btn pri" style="margin-top:12px" data-act="salvarRkOpcoes">Salvar opções</button></div>`;
  return `<div class="top"><button class="back" data-act="ranking">Voltar</button><h1>Configurar ranking</h1></div><div class="pad">
    <div class="chips">${abas.map(([k, t]) => `<button class="chip ${k === aba ? "on" : ""}" data-act="rkCfgAba" data-a="${k}">${t}</button>`).join("")}</div>
    ${aba === "metas" || aba === "individual" ? `${aba === "individual" ? `<div class="chips">${rkAbas().map(x => `<button class="chip ${x.k === c.k ? "on" : ""}" data-act="rkTipo" data-t="${x.k}">${x.ico} ${x.t}</button>`).join("")}</div>` : ""}
    <label class="f" for="rkMes">Mês e ano<select id="rkMes" class="inp">${[...new Set([proxMes(2), proxMes(1), rkMesAtual(), S.rkMes, ...Object.keys(S.vendas || {}).filter(m => /^\d{4}-\d{2}$/.test(m))])].sort().reverse().map(m => `<option value="${m}" ${m === S.rkMes ? "selected" : ""}>${nomeMes(m)}</option>`).join("")}</select></label>` : ""}
    ${corpo}</div>`;
}
async function salvarMetas(b){
  const c = rkCat(), patch = {};
  for (const f of funcoesDaAba(c.k)) {
    const campo = (document.querySelector(`[data-mg-campo="${f}"]`) || {}).value, modo = (document.querySelector(`[data-mg-modo="${f}"]`) || {}).value, txt = ((document.querySelector(`[data-mg-valor="${f}"]`) || {}).value || "").trim();
    const valor = txt ? parse(txt) : 0;
    if (txt && !(valor >= 0)) return toast("Valor inválido em " + nomeFuncao(f) + ". Ex.: 90.000 ou 5.000,00");
    patch[f] = {campo, modo, valor};
  }
  b.disabled = true; await safe(() => gravaVendas({metas2:{[c.k]:patch}}), "Metas salvas."); b.disabled = false;
}
async function salvarMetasInd(b){
  const c = rkCat(), patch = {};
  for (const el of document.querySelectorAll("[data-mi]")) { const t = el.value.trim(), v = t ? parse(t) : 0; if (t && !(v >= 0)) return toast("Valor inválido. Ex.: 90.000"); patch[el.dataset.mi] = v; }
  b.disabled = true; await safe(() => gravaVendas({metasInd:{[c.k]:patch}}), "Metas individuais salvas."); b.disabled = false;
}
async function salvarEquipe(b){
  const patch = {};
  for (const el of document.querySelectorAll("[data-eq-nome]")) {
    const id = el.dataset.eqNome, nome = el.value.trim(), f = (document.querySelector(`[data-eq-funcao="${id}"]`) || {}).value, p = pessoasRk()[id] || {};
    if (!nome) return toast("Nome em branco na equipe.");
    const chaves = [...new Set([...(p.chaves || []), semAcento(nome).replace(/\s+/g, " ").trim()])];
    patch[id] = f ? {nome, chaves, ...grupoParaFuncao(f)} : {nome, chaves, x:0};
  }
  b.disabled = true;
  if (await safe(() => S.db.doc("cfg/main").update({rkPessoas:patch}), "Equipe salva.")) { S.cfg = {...S.cfg, rkPessoas:deepMerge(pessoasRk(), patch)}; render(); }
  b.disabled = false;
}
async function fotoPessoaUpload(id, arq){
  if (!arq) return;
  try {
    const url = await new Promise((ok, erro) => { const r = new FileReader(); r.onload = () => ok(r.result); r.onerror = erro; r.readAsDataURL(arq); });
    const img = await new Promise((ok, erro) => { const i = new Image(); i.onload = () => ok(i); i.onerror = erro; i.src = url; });
    const lado = Math.min(img.width, img.height), cv = document.createElement("canvas"); cv.width = cv.height = 220;
    cv.getContext("2d").drawImage(img, (img.width - lado) / 2, (img.height - lado) / 2, lado, lado, 0, 0, 220, 220);
    const d = cv.toDataURL("image/jpeg", 0.8);
    if (await safe(() => S.db.doc("rkfoto/" + id).set({d}), "Foto salva.")) { S.rkFotos = {...(S.rkFotos || {}), [id]:d}; render(); }
  } catch (e) { console.error("Foto da pessoa:", e); toast("Não foi possível usar essa imagem."); }
}
function shVenda(idc){
  const [tb, id] = idc ? rkDividir(idc) : [S.rkTipo, null], c = RK.find(x => x.k === tb) || rkCat(), o = ((S.vendas || {})[S.rkMes] || {}), v = id ? ((o[c.k] || {})[id] || (c.k === "diesel" ? (o.frentista || {})[id] : null) || {}) : {};
  const nomes = [...new Set(Object.values(pessoasRk()).filter(p => p && !p.x).map(p => p.nome))].sort();
  openSheet(`<h2>${id ? "Alterar" : "Lançar"} · ${c.t}</h2>
    <label class="f" for="vNome">${c.p}<input id="vNome" class="inp" list="vNomes" value="${esc(v.nome || "")}" autofocus></label><datalist id="vNomes">${nomes.map(n => `<option value="${esc(n)}">`).join("")}</datalist>${botoesFuncao(v, tb)}
    <div class="row"><label class="f" for="vQ" style="flex:1">${c.k === "opcaixa" ? "Operações (qtd.)" : "Quantidade"}<input id="vQ" class="inp" inputmode="decimal" value="${v.q != null ? esc(fmt2(v.q)) : ""}"></label>
    <label class="f" for="vMc" style="flex:1">Venda MC<input id="vMc" class="inp" inputmode="decimal" value="${v.mc != null ? esc(moeda(v.mc)) : ""}"></label>
    ${c.lt ? `<label class="f" for="vLt" style="flex:1">Litragem<input id="vLt" class="inp" inputmode="decimal" value="${v.lt != null ? esc(fmt2(v.lt)) : ""}"></label>` : ""}</div>
    <div id="err" class="note crit" hidden></div>
    <div class="row"><button class="btn" data-act="fechar">Cancelar</button><button class="btn pri" data-act="salvarVenda" data-id="${idc || ""}">Salvar</button></div>`);
}
async function salvarVenda(b){
  const [tb] = rkDividir(b.dataset.id), c = RK.find(x => x.k === tb) || rkCat(), nome = $("#vNome").value.trim(), q = parse($("#vQ").value), mc = c.k === "opcaixa" ? (parse($("#vMc").value) || 0) : parse($("#vMc").value), lt = c.lt ? parse($("#vLt").value) : 0, e = $("#err");
  const fail = t => { e.textContent = t; e.hidden = false; };
  if (!nome) return fail("Digite o nome.");
  if (!(q >= 0)) return fail("Quantidade inválida."); if (!(mc >= 0)) return fail("Venda MC inválida."); if (c.lt && !(lt >= 0)) return fail("Litragem inválida.");
  b.disabled = true;
  const ok = await safe(async () => {
    const ids = await registrarPessoas([nome], c.k), pid = ids[nome];
    let id = b.dataset.id ? rkDividir(b.dataset.id)[1] : "";
    if (!id) { const ja = vendasDoMes(c.k).find(r => (pid && r.pid === pid) || semAcento(r.nome) === semAcento(nome)); id = ja ? ja.id : "v" + Date.now().toString(36); }
    await gravaVendas({[c.k]:{[id]:c.lt ? {nome, pid, q, mc, lt, x:0, t:Date.now()} : {nome, pid, q, mc, x:0, t:Date.now()}}});
  }, "Lançamento salvo.");
  if (ok) closeSheet(); else b.disabled = false;
}
function baixarRanking(b, tipo){
  const c = rkCat(), lista = listaRk(c), linhas = lista.map(r => { const m = metaDaPessoa(r, c.k, lista); return {...r, m, st:situacao(r, m)}; });
  const cols = c.lt ? [["#", 0], [c.p, 50], ["Função", 400], ["Litragem", 640], ["Venda MC", 800], ["Meta", 940], ["%", 1060]] : [["#", 0], [c.p, 50], ["Função", 420], ["Qtd.", 640], ["Venda MC", 780], ["Meta", 940], ["%", 1060]];
  const pags = paginasTabela("Ranking de vendas posto · " + c.t, (S.nomeFilial || "") + " · " + S.rkMes.split("-").reverse().join("/"), cols,
    linhas.map((r, i) => [i + 1, r.nome, nomeFuncao(r.funcao), c.lt ? fmt2(r.lt) : fmt2(r.q), moeda(r.mc), r.m ? fmtCampo(r.m.campo, r.m.valor) : "—", r.st ? r.st.pct + "%" : "—"]));
  exportarPaginas(b, pags, tipo, nomeArquivo("Ranking " + c.t));
}
/* ---------- meta geral do posto (soma da Venda MC de todas as abas) ---------- */
const rkDestaqueAtivo = () => !!(S.cfg && S.cfg.rkDestaque);
/* ---------- destaque: primeiro a bater a meta no mês (opcional) ---------- */
async function marcarBatidas(){
  if (!S.db || !S.rkMes) return;
  const d = (S.vendas || {})[S.rkMes] || {}, ja = d.batidas || {}, patch = {}, agora = Date.now(); let n = 0;
  for (const c of RK) {
    const lista = vendasDoMes(c.k);
    for (const r of lista) { if (!r.pid || (ja[c.k] || {})[r.pid]) continue; const st = situacao(r, metaDaPessoa(r, c.k, lista)); if (st && st.bateu) { (patch[c.k] = patch[c.k] || {})[r.pid] = agora; n++; } }
  }
  if (!n) return;
  try { await S.db.doc("vendas/" + S.rkMes).update({batidas:patch}); S.vendas = {...S.vendas, [S.rkMes]:deepMerge(d, {batidas:patch})}; S.vendasK = JSON.stringify(S.vendas); } catch (e) { console.error("Destaque:", e); }
}
function destaqueDe(tab){
  const b = (((S.vendas || {})[S.rkMes] || {}).batidas || {})[tab] || {}, lista = vendasDoMes(tab);
  const cand = Object.entries(b).map(([pid, t]) => ({r:lista.find(x => x.pid === pid), t:num(t)})).filter(x => x.r).sort((a, c) => a.t - c.t || c.r[campoPadrao(tab)] - a.r[campoPadrao(tab)]);
  return cand[0] || null;
}

/* ---------- produtos mais vendidos: foto ou arquivo por pessoa ---------- */
function shPessoaRk(id){
  const c = rkCat(), lista = listaRk(c), r = lista.find(x => x.id === id); if (!r) return;
  const meta = metaDaPessoa(r, c.k, lista), st = situacao(r, meta), pos = lista.indexOf(r) + 1, dq = rkDestaqueAtivo() && destaqueDe(c.k);
  S.rkPessoaAberta = r;
  openSheet(`<div style="display:flex;gap:10px;align-items:center">${fotoPessoa(r, 54) || ""}<div><h2 style="margin:0">${esc(r.nome)}</h2><span class="meta">${nomeFuncao(r.funcao)} · ${c.t} · ${pos}º de ${lista.length}</span></div></div>
    ${dq && dq.r.pid === r.pid ? `<div class="note" style="margin-top:8px">⭐ Destaque do mês: primeiro a bater a meta</div>` : ""}
    <div class="meta" style="display:flex;flex-wrap:wrap;gap:4px 12px;margin-top:10px"><span>Qtd. <b>${fmt2(r.q)}</b></span><span>Venda MC <b>R$ ${moeda(r.mc)}</b></span>${c.lt ? `<span>Litragem <b>${fmt2(r.lt)} L</b></span>` : ""}${meta ? `<span>Meta <b>${fmtCampo(meta.campo, meta.valor)}</b></span>` : ""}</div>${barra(st, 12)}
    <h3 style="margin:16px 0 6px">🏷️ Produtos que mais vende</h3><div id="anexosRk" class="meta">Carregando…</div>
    ${S.admin && r.pid ? `<label class="btn brand" style="cursor:pointer;margin-top:8px">📎 Anexar foto ou arquivo<input type="file" accept="image/*,.pdf,.xlsx,.xls,.csv,.doc,.docx" data-rk-anexo="${r.pid}" hidden></label>` : ""}
    <button class="btn pri" style="margin-top:8px" data-act="cartaoPessoa" data-id="${r.id}">📤 Cartão individual (JPG)</button>
    <button class="btn" data-act="fechar">Fechar</button>`);
  carregaAnexos(r.pid);
}
function carregaAnexos(pid){
  const alvo = () => $("#anexosRk");
  if (!pid) { if (alvo()) alvo().textContent = "Sem anexos."; return; }
  let parar = null;
  parar = S.db.collection(`rkanexo/${S.rkMes}/${pid}`).onSnapshot(q => {
    if (parar) parar();
    const docs = q.docs.map(d => ({id:d.id, ...(d.data() || {})})).filter(a => a && !a.x && a.d).sort((a, b) => num(b.t) - num(a.t));
    S.rkAnexos = docs; const el = alvo(); if (!el) return;
    el.innerHTML = docs.length ? docs.map(a => `<div style="display:flex;gap:8px;align-items:center;padding:6px 0;border-bottom:1px solid var(--line)">
      ${a.tipo && a.tipo.startsWith("image/") ? `<img src="${a.d}" alt="" style="width:64px;height:64px;object-fit:cover;border-radius:8px;cursor:pointer" data-act="verAnexo" data-a="${a.id}">` : `<span style="font-size:30px">📄</span>`}
      <div style="flex:1;min-width:0"><b style="display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(a.nome || "anexo")}</b><span>${new Date(num(a.t)).toLocaleDateString("pt-BR")}</span></div>
      <button class="btn sm" style="width:auto" data-act="verAnexo" data-a="${a.id}">Abrir</button>${S.admin ? `<button class="btn sm" style="width:auto;color:var(--crit)" data-act="tirarAnexo" data-a="${a.id}">🗑️</button>` : ""}</div>`).join("") : "Nenhum anexo neste mês.";
  }, () => { const el = alvo(); if (el) el.textContent = "Não foi possível carregar os anexos."; });
}
async function anexarArquivo(pid, arq){
  if (!arq) return;
  if (arq.size > 3 * 1024 * 1024 && !arq.type.startsWith("image/")) return toast("Arquivo grande demais (máximo 3 MB).");
  try {
    let d = await new Promise((ok, erro) => { const r = new FileReader(); r.onload = () => ok(r.result); r.onerror = erro; r.readAsDataURL(arq); }), tipo = arq.type || "application/octet-stream";
    if (tipo.startsWith("image/")) {
      const img = await new Promise((ok, erro) => { const i = new Image(); i.onload = () => ok(i); i.onerror = erro; i.src = d; });
      const k = Math.min(1, 1600 / Math.max(img.width, img.height)), cv = document.createElement("canvas"); cv.width = Math.round(img.width * k); cv.height = Math.round(img.height * k);
      const g = cv.getContext("2d"); g.fillStyle = "#fff"; g.fillRect(0, 0, cv.width, cv.height); g.drawImage(img, 0, 0, cv.width, cv.height); d = cv.toDataURL("image/jpeg", 0.82); tipo = "image/jpeg";
    }
    const id = "a" + Date.now().toString(36);
    if (await safe(() => S.db.doc(`rkanexo/${S.rkMes}/${pid}/${id}`).set({nome:arq.name, tipo, d, t:Date.now()}), "Anexo salvo.")) carregaAnexos(pid);
  } catch (e) { console.error("Anexo:", e); toast("Não foi possível anexar esse arquivo."); }
}
function abrirAnexo(id){
  const a = (S.rkAnexos || []).find(x => x.id === id); if (!a) return;
  fetch(a.d).then(r => r.blob()).then(b => { if (a.tipo && a.tipo.startsWith("image/")) openSheet(`<h2>${esc(a.nome || "Imagem")}</h2><img src="${a.d}" alt="" style="width:100%;border-radius:10px"><div class="row" style="margin-top:8px"><button class="btn" data-act="baixarAnexo" data-a="${a.id}">⬇️ Baixar</button><button class="btn" data-act="voltarPessoa">Voltar</button></div>`); else baixarArquivo(b, a.nome || "anexo"); });
}

/* ---------- cartões para enviar aos colaboradores (JPG) ---------- */
async function compartilharOuBaixar(blob, nome){
  try { const f = new File([blob], nome, {type:blob.type}); if (navigator.canShare && navigator.canShare({files:[f]})) { await navigator.share({files:[f], title:nome}); return; } }
  catch (e) { if (e && e.name === "AbortError") return; console.error("Compartilhar:", e); }
  baixarArquivo(blob, nome);
}
const carregaImg = src => new Promise(ok => { if (!src) return ok(null); const i = new Image(); i.onload = () => ok(i); i.onerror = () => ok(null); i.src = src; });
function rr(g, x, y, w, h, r){ g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); }
/* fundo do cartão: foto da galeria (guardada neste aparelho) ou o fundo padrão com marca d'água do Aldo */
const RK_FUNDO = {img:null, src:null, mem:null};
const RK_MARCA_SRC = "data:image/png;base64,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";
let RK_MARCA = null;
async function rkMarcaImg(){ if (!RK_MARCA) RK_MARCA = await carregaImg(RK_MARCA_SRC); return RK_MARCA; }
function rkFundoDados(){ if (RK_FUNDO.mem) return RK_FUNDO.mem; try { return localStorage.getItem("rkFundo"); } catch (e) { return null; } }
async function rkFundoImg(){
  const d = rkFundoDados(); if (!d) { RK_FUNDO.img = null; RK_FUNDO.src = null; return null; }
  if (RK_FUNDO.src === d && RK_FUNDO.img) return RK_FUNDO.img;
  RK_FUNDO.img = await carregaImg(d); RK_FUNDO.src = d; return RK_FUNDO.img;
}
async function rkTrocarFundo(arq){
  if (!arq) return;
  try {
    const src = await new Promise((ok, erro) => { const r = new FileReader(); r.onload = () => ok(r.result); r.onerror = erro; r.readAsDataURL(arq); }), img = await carregaImg(src);
    if (!img) return toast("Não foi possível abrir essa imagem.");
    const k = Math.min(1, 1400 / Math.max(img.width, img.height)), cv = document.createElement("canvas"); cv.width = Math.round(img.width * k); cv.height = Math.round(img.height * k);
    cv.getContext("2d").drawImage(img, 0, 0, cv.width, cv.height); const d = cv.toDataURL("image/jpeg", 0.82);
    RK_FUNDO.mem = null; try { localStorage.setItem("rkFundo", d); } catch (e) { RK_FUNDO.mem = d; }
    toast("Fundo trocado."); if (S.rkPrev && S.rkPrev.refazer) S.rkPrev.refazer();
  } catch (e) { console.error("Fundo:", e); toast("Não foi possível usar essa imagem."); }
}
document.addEventListener("change", ev => { const t = ev.target; if (t && t.dataset && t.dataset.rkFundo) { const f = t.files && t.files[0]; t.value = ""; rkTrocarFundo(f); } });
async function fundoCartao(g, W, H){
  rkLogo();
  if (RK_LOGO_IMG && !RK_LOGO_IMG.complete) await new Promise(ok => { RK_LOGO_IMG.addEventListener("load", ok, {once:true}); RK_LOGO_IMG.addEventListener("error", ok, {once:true}); setTimeout(ok, 3000); });
  const logo = RK_LOGO_IMG && RK_LOGO_IMG.naturalWidth ? RK_LOGO_IMG : null, ar = logo ? logo.naturalWidth / logo.naturalHeight : 1, foto = await rkFundoImg();
  if (foto) {
    const k = Math.max(W / foto.width, H / foto.height), w = foto.width * k, h = foto.height * k; g.drawImage(foto, (W - w) / 2, (H - h) / 2, w, h);
    const v = g.createLinearGradient(0, 0, 0, H); v.addColorStop(0, "rgba(4,10,24,.78)"); v.addColorStop(0.3, "rgba(4,10,24,.55)"); v.addColorStop(1, "rgba(4,10,24,.86)"); g.fillStyle = v; g.fillRect(0, 0, W, H);
  } else {
    const gr = g.createLinearGradient(0, 0, W, H); gr.addColorStop(0, "#071226"); gr.addColorStop(0.55, "#0b2a4a"); gr.addColorStop(1, "#0b7285"); g.fillStyle = gr; g.fillRect(0, 0, W, H);
  }
  /* marca d'água do Aldo (grafismo branco), quase invisível, só no canto de baixo */
  const marca = await rkMarcaImg();
  if (marca) { const mw = W * 0.85, mh = mw * marca.height / marca.width; g.save(); g.globalAlpha = 0.07; g.drawImage(marca, W - mw * 0.92, H - mh - 70, mw, mh); g.restore(); }
  if (logo) {
    const h = 104, w = h * ar; g.save(); g.shadowColor = "rgba(0,0,0,.5)"; g.shadowBlur = 30; g.shadowOffsetY = 8; g.drawImage(logo, (W - w) / 2, 36, w, h); g.restore();
  }
  g.textAlign = "center";
  try { g.letterSpacing = "5px"; } catch (e) {}
  g.fillStyle = "#22d3ee"; g.font = "bold 30px Arial"; g.fillText("RANKING DE VENDAS POSTO", W / 2, 180);
  try { g.letterSpacing = "0px"; } catch (e) {}
  const lg = g.createLinearGradient(W / 2 - 300, 0, W / 2 + 300, 0); lg.addColorStop(0, "rgba(251,191,36,0)"); lg.addColorStop(0.5, "#fbbf24"); lg.addColorStop(1, "rgba(251,191,36,0)");
  g.fillStyle = lg; g.fillRect(W / 2 - 300, 196, 600, 3);
  g.fillStyle = "rgba(255,255,255,.82)"; g.font = "26px Arial"; g.fillText((S.nomeFilial || "") + " · " + nomeMes(S.rkMes), W / 2, 236);
  const lf = g.createLinearGradient(80, 0, W - 80, 0); lf.addColorStop(0, "rgba(255,255,255,0)"); lf.addColorStop(0.5, "rgba(255,255,255,.3)"); lf.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = lf; g.fillRect(80, H - 82, W - 160, 2);
  g.fillStyle = "rgba(255,255,255,.6)"; g.font = "22px Arial"; g.fillText("Desenvolvido por Luís Ricardo Menezes · Aldo Porto Franco", W / 2, H - 40); g.textAlign = "left";
}
const corSt = st => !st ? "#22d3ee" : st.bateu ? "#34d399" : st.pct >= 70 ? "#fbbf24" : "#f87171";
function painelVidro(g, x, y, w, h, r){
  g.save(); g.shadowColor = "rgba(0,0,0,.35)"; g.shadowBlur = 24; g.shadowOffsetY = 6; rr(g, x, y, w, h, r || 26); g.fillStyle = "rgba(8,22,46,.62)"; g.fill(); g.restore();
  rr(g, x, y, w, h, r || 26); g.strokeStyle = "rgba(255,255,255,.16)"; g.lineWidth = 2; g.stroke();
}
function barraCartao(g, x, y, w, h, st){
  rr(g, x, y, w, h, h / 2); g.fillStyle = "rgba(255,255,255,.13)"; g.fill(); if (!st) return;
  const cor = corSt(st), bw = Math.max(h, w * Math.min(1, st.pct / 100)), gr = g.createLinearGradient(x, 0, x + bw, 0); gr.addColorStop(0, cor + "aa"); gr.addColorStop(1, cor);
  g.save(); g.shadowColor = cor; g.shadowBlur = 14; rr(g, x, y, bw, h, h / 2); g.fillStyle = gr; g.fill(); g.restore();
  if (st.bateu) { g.save(); rr(g, x, y, bw, h, h / 2); g.clip(); g.fillStyle = "rgba(255,255,255,.22)"; for (let i = -h; i < bw; i += h * 1.6) { g.beginPath(); g.moveTo(x + i, y + h); g.lineTo(x + i + h * 0.8, y + h); g.lineTo(x + i + h * 1.6, y); g.lineTo(x + i + h * 0.8, y); g.closePath(); g.fill(); } g.restore(); }
}
/* bloco de uma meta: valor, %, barra, quanto falta/passou e projeção do mês */
function blocoMeta(g, x, y, w, titulo, campo, real, meta, st){
  painelVidro(g, x, y, w, 200);
  const cor = corSt(st), pj = projecao(real, meta.valor);
  g.textAlign = "left"; g.fillStyle = "rgba(255,255,255,.85)"; g.font = "bold 26px Arial"; g.fillText(titulo, x + 32, y + 48);
  g.textAlign = "right"; g.fillStyle = cor; g.font = "bold 58px Arial"; g.fillText((st ? st.pct : 0) + "%", x + w - 32, y + 70);
  g.textAlign = "left"; g.fillStyle = "#ffffff"; g.font = "bold 38px Arial"; const v = fmtCampo(campo, real); g.fillText(v, x + 32, y + 102);
  const vw = g.measureText(v).width; g.fillStyle = "rgba(255,255,255,.6)"; g.font = "24px Arial"; g.fillText(cortaTexto(g, "  de " + fmtCampo(campo, meta.valor), w - 64 - vw - 170), x + 32 + vw, y + 102);
  barraCartao(g, x + 32, y + 122, w - 64, 22, st);
  g.font = "bold 23px Arial"; g.fillStyle = st && st.bateu ? "#34d399" : "#ffffff";
  const t1 = st && st.bateu ? "✅ META BATIDA · passou " + fmtCampo(campo, real - meta.valor) : "Faltam " + fmtCampo(campo, meta.valor - real);
  g.fillText(t1, x + 32, y + 178);
  if (pj) { const t1w = g.measureText(t1).width; g.font = "22px Arial"; g.fillStyle = pj.pct >= 100 ? "#34d399" : pj.pct >= 85 ? "#fbbf24" : "#fca5a5"; g.fillText(cortaTexto(g, " · 📈 projeção " + fmtCampo(campo, pj.proj) + " (" + pj.pct + "%)", w - 64 - t1w), x + 32 + t1w, y + 178); }
}
const tituloCampo = (campo, k) => campo === "lt" ? "⛽ LITRAGEM" : campo === "mc" ? "🛒 VENDA DA LOJA (MC)" : k === "opcaixa" ? "🧾 OPERAÇÕES (QTD.)" : "📦 QUANTIDADE";
function cortaCentro(g, t, w){ return cortaTexto(g, t, w); }
const nomeCartao = (r, c) => ("Meta - " + r.nome + (c ? " - " + c.t : "") + " - " + S.rkMes).replace(/[^\wÀ-ÿ -]+/g, " ").replace(/ +/g, " ").trim() + ".jpg";
async function cartaoPessoa(id, b){
  const c = rkCat(), lista = listaRk(c), r = lista.find(x => x.id === id); if (!r) return;
  if (b) b.disabled = true;
  try { const cv = await desenhaPessoa(r, c, lista); mostrarPrevia(cv, nomeCartao(r), () => cartaoPessoa(id)); }
  catch (e) { console.error("Cartão:", e); toast("Não foi possível gerar o cartão."); }
  if (b) b.disabled = false;
}
async function desenhaPessoa(r, c, lista){
    const meta = metaDaPessoa(r, c.k, lista), st = situacao(r, meta), mm = meta && meta.campo !== "mc" ? metaDaPessoa(r, c.k, lista, "mc") : null, mst = situacao(r, mm);
    const pos = lista.indexOf(r) + 1, dq = rkDestaqueAtivo() && destaqueDe(c.k), destaque = dq && dq.r.pid === r.pid;
    const blocos = [...(meta ? [[tituloCampo(meta.campo, c.k), meta.campo, meta, st]] : []), ...(mm ? [[tituloCampo("mc"), "mc", mm, mst]] : [])];
    const y0 = destaque ? 860 : 800, temLt = c.lt || r.lt > 0, H = y0 + Math.max(1, blocos.length) * 222 + 150 + 110;
    const W = 1080, cv = document.createElement("canvas"); cv.width = W; cv.height = H; const g = cv.getContext("2d");
    await fundoCartao(g, W, H);
    const cx = W / 2, cy = 445, R = 145, pct = st ? st.pct : 0, cor = corSt(st);
    g.lineWidth = 24; g.strokeStyle = "rgba(255,255,255,.14)"; g.beginPath(); g.arc(cx, cy, R + 28, 0, Math.PI * 2); g.stroke();
    if (st) { g.save(); g.shadowColor = cor; g.shadowBlur = 28; g.strokeStyle = cor; g.lineCap = "round"; g.beginPath(); g.arc(cx, cy, R + 28, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * Math.max(0.01, Math.min(1, pct / 100))); g.stroke(); g.restore(); }
    const foto = await carregaImg(rkFotosAtivas() && r.pid ? (S.rkFotos || {})[r.pid] : null);
    g.save(); g.beginPath(); g.arc(cx, cy, R, 0, Math.PI * 2); g.clip();
    if (foto) { const l = Math.min(foto.width, foto.height); g.drawImage(foto, (foto.width - l) / 2, (foto.height - l) / 2, l, l, cx - R, cy - R, R * 2, R * 2); }
    else { const ag = g.createLinearGradient(cx - R, cy - R, cx + R, cy + R); ag.addColorStop(0, "#1e4b85"); ag.addColorStop(1, "#0c2547"); g.fillStyle = ag; g.fillRect(cx - R, cy - R, R * 2, R * 2); g.fillStyle = "#e6eef9"; g.font = "bold 120px Arial"; g.textAlign = "center"; g.fillText(r.nome.split(" ").filter(Boolean).map(x => x[0]).slice(0, 2).join("").toUpperCase(), cx, cy + 42); }
    g.restore();
    g.save(); g.shadowColor = "rgba(0,0,0,.4)"; g.shadowBlur = 16; rr(g, cx - 72, cy + R + 4, 144, 62, 31); g.fillStyle = pos <= 3 ? ["#fbbf24", "#e2e8f0", "#d97706"][pos - 1] : "#22d3ee"; g.fill(); g.restore();
    g.fillStyle = "#071226"; g.font = "bold 38px Arial"; g.textAlign = "center"; g.fillText((pos <= 3 ? ["🥇", "🥈", "🥉"][pos - 1] + " " : "") + pos + "º", cx, cy + R + 49);
    g.save(); g.shadowColor = "rgba(0,0,0,.5)"; g.shadowBlur = 12; g.fillStyle = "#ffffff"; g.font = "bold 56px Arial"; g.fillText(cortaCentro(g, r.nome, W - 120), cx, 712); g.restore();
    g.fillStyle = "rgba(255,255,255,.78)"; g.font = "28px Arial"; g.fillText(cortaCentro(g, nomeFuncao(r.funcao) + " · " + c.t + " · " + pos + "º de " + lista.length, W - 120), cx, 758);
    if (destaque) { rr(g, cx - 300, 784, 600, 60, 30); g.fillStyle = "#fbbf24"; g.fill(); g.fillStyle = "#071226"; g.font = "bold 28px Arial"; g.fillText("⭐ DESTAQUE: 1º A BATER A META", cx, 824); }
    let y = y0;
    if (blocos.length) for (const [tit, campo, m, s] of blocos) { blocoMeta(g, 70, y, W - 140, tit, campo, r[campo], m, s); y += 222; }
    else { painelVidro(g, 70, y, W - 140, 200); g.textAlign = "center"; g.fillStyle = "rgba(255,255,255,.85)"; g.font = "30px Arial"; g.fillText("Sem meta definida neste mês", cx, y + 112); y += 222; }
    const stats = [["Quantidade", fmt2(r.q)], ["Venda MC", "R$ " + moeda(r.mc)], ...(temLt ? [["Litragem", fmt2(r.lt) + " L"]] : [])];
    const bw = (W - 140 - (stats.length - 1) * 16) / stats.length;
    stats.forEach(([t, v], i) => { const x = 70 + i * (bw + 16); painelVidro(g, x, y, bw, 120, 20); g.textAlign = "center"; g.fillStyle = "rgba(255,255,255,.7)"; g.font = "22px Arial"; g.fillText(t, x + bw / 2, y + 44); g.fillStyle = "#ffffff"; g.font = "bold 30px Arial"; g.fillText(cortaCentro(g, v, bw - 20), x + bw / 2, y + 88); });
    g.textAlign = "left";
    return cv;
}
/* cartões individuais de todos de uma vez, escolhendo as categorias */
function shLote(){
  const cats = rkAbasVer().filter(c => c.k !== "todos").map(c => ({c, n:listaRk(c).length})).filter(x => x.n), atual = rkCat().k;
  if (!cats.length) return toast("Sem lançamentos neste mês.");
  openSheet(`<h2>📦 Cartões de todos</h2><p style="font-size:12px;color:var(--muted);margin:0 0 8px">Marque as categorias. Será gerado um cartão (JPG) para cada pessoa, com prévia antes de enviar.</p>
    ${cats.map(({c, n}) => `<label style="display:flex;gap:10px;align-items:center;padding:9px 4px;border-bottom:1px solid var(--line, rgba(255,255,255,.08));cursor:pointer"><input type="checkbox" data-lote="${c.k}"${atual === "todos" || atual === c.k ? " checked" : ""} style="width:20px;height:20px"> <span>${c.ico} ${esc(c.t)}</span> <span style="margin-left:auto;color:var(--muted);font-size:12px">${n} ${n === 1 ? "pessoa" : "pessoas"}</span></label>`).join("")}
    <button class="btn pri" style="margin-top:10px" data-act="rkLoteGerar">👀 Gerar prévia dos cartões</button>
    <button class="btn" data-act="fechar">Fechar</button>`);
}
async function gerarLote(b, ks){
  ks = ks || [...document.querySelectorAll("[data-lote]:checked")].map(i => i.dataset.lote);
  if (!ks.length) return toast("Marque pelo menos uma categoria.");
  if (b) { b.disabled = true; b.textContent = "Gerando cartões…"; }
  const itens = [];
  try {
    for (const k of ks) {
      const c = rkAbasVer().find(x => x.k === k); if (!c) continue;
      const lista = listaRk(c);
      for (const r of lista) {
        const cv = await desenhaPessoa(r, c, lista), mini = document.createElement("canvas"); mini.width = 270; mini.height = Math.round(cv.height * 270 / cv.width);
        mini.getContext("2d").drawImage(cv, 0, 0, mini.width, mini.height);
        itens.push({nome:nomeCartao(r, c), blob:await jpegDe(cv), mini:mini.toDataURL("image/jpeg", 0.7), cat:c.t});
      }
    }
  } catch (e) { console.error("Lote:", e); toast("Não foi possível gerar os cartões."); if (b) { b.disabled = false; b.textContent = "👀 Gerar prévia dos cartões"; } return; }
  S.rkLote = {itens, ks}; S.rkPrev = {refazer:() => gerarLote(null, ks)};
  previaLote();
}
function previaLote(){
  const L = S.rkLote; if (!L) return; const tem = !!rkFundoDados();
  openSheet(`<h2>👀 Prévia · ${L.itens.length} cartões</h2><p style="font-size:12px;color:var(--muted);margin:0 0 8px">Confira antes de enviar. Toque num cartão para ver maior.</p>
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:6px;max-height:50vh;overflow:auto">${L.itens.map((x, i) => `<button data-act="rkLoteVer" data-i="${i}" style="padding:0;border:0;background:none;cursor:pointer" aria-label="${esc(x.nome)}"><img src="${x.mini}" alt="" style="width:100%;display:block;border-radius:8px"></button>`).join("")}</div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-top:10px"><label class="btn" style="margin:0;cursor:pointer;text-align:center">🖼️ Trocar fundo<input type="file" accept="image/*" data-rk-fundo="1" hidden></label><button class="btn" style="margin:0" data-act="rkFundoPadrao"${tem ? "" : " disabled"}>↩️ Fundo padrão</button></div>
    <button class="btn pri" style="margin-top:8px" data-act="rkLoteEnviar">📤 Enviar / baixar todos (${L.itens.length})</button>
    <button class="btn" data-act="fechar">Fechar</button>`);
}
async function enviarLote(b){
  const L = S.rkLote; if (!L || !L.itens.length) return;
  const files = L.itens.map(x => new File([x.blob], x.nome, {type:"image/jpeg"}));
  b.disabled = true;
  try { if (navigator.canShare && navigator.canShare({files})) { await navigator.share({files, title:"Cartões de metas"}); b.disabled = false; return; } }
  catch (e) { if (e && e.name === "AbortError") { b.disabled = false; return; } console.error("Compartilhar lote:", e); }
  for (const f of files) { baixarArquivo(f, f.name); await new Promise(ok => setTimeout(ok, 450)); }
  toast(files.length + " imagens baixadas."); b.disabled = false;
}
/* metas de todos, separadas por categoria, numa imagem só */
const CORES_CAT = {lubrificador:"#38bdf8", madrugada:"#818cf8"};
async function cartaoTodos(b){
  if (b) b.disabled = true;
  try {
    const grupos = rkAbasVer().filter(c => c.k !== "todos").map(c => { const l = listaRk(c); return {c, linhas:l.map(r => { const m = metaDaPessoa(r, c.k, l), mm = m && m.campo !== "mc" ? metaDaPessoa(r, c.k, l, "mc") : null; return {...r, m, st:situacao(r, m), mst:situacao(r, mm)}; })}; }).filter(x => x.linhas.length);
    const gr = resumoGeral(), tiles = [...(rkAbas().some(c => c.lt) ? [["⛽ Litros", "lt", gr.litros, gr.m.litros]] : []), ["🛒 Venda da Loja", "mc", gr.total, gr.m.loja], ...(rkAbas().some(c => c.k === "opcaixa") ? [["🧾 Operações", "q", gr.op, gr.m.operacoes]] : [])];
    const RH = 96, W = 1080, H = 400 + 200 + grupos.reduce((a, x) => a + 96 + x.linhas.length * RH + 34, 0) + 110;
    const cv = document.createElement("canvas"); cv.width = W; cv.height = H; const g = cv.getContext("2d");
    await fundoCartao(g, W, H);
    g.textAlign = "center"; g.save(); g.shadowColor = "rgba(0,0,0,.5)"; g.shadowBlur = 12; g.fillStyle = "#ffffff"; g.font = "bold 54px Arial"; g.fillText("METAS DA EQUIPE", W / 2, 318); g.restore();
    g.fillStyle = "rgba(255,255,255,.75)"; g.font = "26px Arial"; g.fillText("Todos os colaboradores por categoria", W / 2, 360);
    let y = 400; const tw = (W - 140 - (tiles.length - 1) * 16) / tiles.length;
    tiles.forEach(([t, campo, real, meta], i) => {
      const x = 70 + i * (tw + 16), st = meta ? situacao({[campo]:real}, {campo, valor:meta.valor}) : null, pj = meta ? projecao(real, meta.valor) : null;
      painelVidro(g, x, y, tw, 172, 22); g.textAlign = "center";
      g.fillStyle = "rgba(255,255,255,.8)"; g.font = "bold 22px Arial"; g.fillText(t, x + tw / 2, y + 36);
      g.fillStyle = "#ffffff"; g.font = "bold 28px Arial"; g.fillText(cortaTexto(g, fmtCampo(campo, real), tw - 20), x + tw / 2, y + 74);
      g.fillStyle = corSt(st); g.font = "bold 34px Arial"; g.fillText(st ? st.pct + "%" : "—", x + tw / 2, y + 114);
      barraCartao(g, x + 20, y + 128, tw - 40, 12, st);
      g.fillStyle = "rgba(255,255,255,.7)"; g.font = "18px Arial"; g.fillText(cortaTexto(g, meta ? (pj ? "projeção " + pj.pct + "%" : "meta " + fmtCampo(campo, meta.valor)) : "sem meta", tw - 20), x + tw / 2, y + 162);
    });
    y += 200;
    for (const {c, linhas} of grupos) {
      const cor = CORES_ABA[c.k] || CORES_CAT[c.k] || "#22d3ee", hp = 96 + linhas.length * RH;
      painelVidro(g, 70, y, W - 140, hp, 26);
      g.save(); rr(g, 70, y, W - 140, 74, 26); g.clip(); const hg = g.createLinearGradient(70, 0, W - 70, 0); hg.addColorStop(0, cor + "cc"); hg.addColorStop(1, cor + "22"); g.fillStyle = hg; g.fillRect(70, y, W - 140, 74); g.restore();
      g.textAlign = "left"; g.fillStyle = "#ffffff"; g.font = "bold 32px Arial"; g.fillText(c.ico + "  " + c.t.toUpperCase(), 100, y + 49);
      g.textAlign = "right"; g.font = "bold 22px Arial"; g.fillText(linhas.length + (linhas.length === 1 ? " pessoa" : " pessoas"), W - 100, y + 47);
      let ly = y + 92;
      linhas.forEach((r, i) => {
        if (i) { g.fillStyle = "rgba(255,255,255,.08)"; g.fillRect(100, ly - 6, W - 200, 1); }
        const campo = r.m ? r.m.campo : (c.k === "opcaixa" ? "q" : c.lt ? "lt" : "mc");
        g.textAlign = "center"; g.font = i < 3 ? "36px Arial" : "bold 28px Arial"; g.fillStyle = cor; g.fillText(i < 3 ? ["🥇", "🥈", "🥉"][i] : (i + 1) + "º", 128, ly + 46);
        g.textAlign = "left"; g.fillStyle = "#ffffff"; g.font = "bold 26px Arial"; g.fillText(cortaTexto(g, r.nome, 400), 172, ly + 36);
        g.fillStyle = "rgba(255,255,255,.65)"; g.font = "20px Arial"; g.fillText(cortaTexto(g, fmtCampo(campo, r[campo]) + (r.m ? " · meta " + fmtCampo(campo, r.m.valor) : ""), 400), 172, ly + 66);
        const bx = 600, bw = W - 100 - bx - 90;
        g.textAlign = "right"; g.fillStyle = corSt(r.st); g.font = "bold 30px Arial"; g.fillText(r.st ? r.st.pct + "%" : "—", W - 100, ly + 40);
        barraCartao(g, bx, ly + 22, bw, 16, r.st);
        if (r.mst) { g.textAlign = "left"; g.fillStyle = "rgba(255,255,255,.7)"; g.font = "18px Arial"; g.fillText("🛒", bx, ly + 70); barraCartao(g, bx + 34, ly + 58, bw - 34, 10, r.mst); g.textAlign = "right"; g.fillStyle = corSt(r.mst); g.font = "bold 20px Arial"; g.fillText(r.mst.pct + "%", W - 100, ly + 70); }
        ly += RH;
      });
      y += hp + 34;
    }
    if (!grupos.length) { g.textAlign = "center"; g.fillStyle = "#ffffff"; g.font = "30px Arial"; g.fillText("Sem lançamentos neste mês", W / 2, y + 60); }
    g.textAlign = "left";
    mostrarPrevia(cv, ("Metas da equipe - " + (S.nomeFilial || "posto") + " - " + S.rkMes).replace(/[^\wÀ-ÿ -]+/g, " ").trim() + ".jpg", () => cartaoTodos());
  } catch (e) { console.error("Cartão de todos:", e); toast("Não foi possível gerar a imagem."); }
  if (b) b.disabled = false;
}
/* prévia antes de enviar: mostra a imagem, deixa trocar o fundo e só depois envia/baixa */
function mostrarPrevia(cv, nome, refazer){
  S.rkPrev = {cv, nome, refazer, blob:jpegDe(cv)};
  const tem = !!rkFundoDados();
  openSheet(`<h2>👀 Prévia da imagem</h2><p style="font-size:12px;color:var(--muted);margin:0 0 8px">Confira como vai ficar antes de enviar. Para usar uma foto como fundo, toque em "Trocar fundo".</p>
    <div style="max-height:58vh;overflow:auto;border-radius:12px;background:#000"><img src="${cv.toDataURL("image/jpeg", 0.8)}" alt="Prévia da imagem" style="width:100%;display:block"></div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-top:10px"><label class="btn" style="margin:0;cursor:pointer;text-align:center">🖼️ Trocar fundo<input type="file" accept="image/*" data-rk-fundo="1" hidden></label><button class="btn" style="margin:0" data-act="rkFundoPadrao"${tem ? "" : " disabled"}>↩️ Fundo padrão</button></div>
    <button class="btn pri" style="margin-top:8px" data-act="rkPrevEnviar">📤 Enviar / baixar imagem</button>
    <button class="btn" data-act="fechar">Fechar</button>`);
}
async function cartaoGeral(b){
  if (b) b.disabled = true;
  try {
    const gr = resumoGeral(), linhas = [];
    if (rkAbas().some(c => c.lt)) linhas.push(["⛽ LITROS · FRENTISTAS", "lt", gr.litros, gr.m.litros]);
    linhas.push(["🛒 VENDA DA LOJA · TODOS OS SETORES", "mc", gr.total, gr.m.loja]);
    if (rkAbas().some(c => c.k === "opcaixa")) linhas.push(["🧾 OPERAÇÕES CAIXA (QUANTIDADE)", "q", gr.op, gr.m.operacoes]);
    const W = 1080, H = 750 + linhas.length * 230 + gr.partes.length * 70, cv = document.createElement("canvas"); cv.width = W; cv.height = H; const g = cv.getContext("2d");
    await fundoCartao(g, W, H); g.translate(0, 110); g.textAlign = "center";
    g.fillStyle = "#ffffff"; g.font = "bold 58px Arial"; g.fillText("METAS GERAIS DO POSTO", W / 2, 220);
    let y = 300;
    for (const [tit, campo, real, meta] of linhas) {
      const st = meta ? situacao({[campo]:real}, {campo, valor:meta.valor}) : null, pj = meta ? projecao(real, meta.valor) : null, cor = st ? (st.bateu ? "#34d399" : st.pct >= 70 ? "#fbbf24" : "#f87171") : "#22d3ee";
      painelVidro(g, 70, y, W - 140, 200, 26);
      g.textAlign = "left"; g.fillStyle = "rgba(255,255,255,.8)"; g.font = "bold 26px Arial"; g.fillText(tit, 105, y + 46);
      g.fillStyle = "#ffffff"; g.font = "bold 46px Arial"; g.fillText(fmtCampo(campo, real), 105, y + 104);
      g.textAlign = "right"; g.fillStyle = cor; g.font = "bold 56px Arial"; g.fillText(st ? st.pct + "%" : "—", W - 105, y + 104);
      rr(g, 105, y + 124, W - 210, 20, 10); g.fillStyle = "rgba(255,255,255,.15)"; g.fill();
      if (st) { rr(g, 105, y + 124, Math.max(20, (W - 210) * Math.min(1, st.pct / 100)), 20, 10); g.fillStyle = cor; g.fill(); }
      g.textAlign = "left"; g.fillStyle = "rgba(255,255,255,.85)"; g.font = "22px Arial";
      g.fillText(meta ? "Meta " + fmtCampo(campo, meta.valor) + (st.bateu ? " · META BATIDA! +" + fmtCampo(campo, real - meta.valor) : " · faltam " + fmtCampo(campo, meta.valor - real)) + (pj ? " · projeção " + pj.pct + "%" : "") : "Sem meta definida", 105, y + 180);
      y += 230;
    }
    g.textAlign = "left"; g.fillStyle = "#ffffff"; g.font = "bold 30px Arial"; g.fillText("📊 Venda MC por setor", 105, y + 10); y += 40;
    const max = Math.max(1, ...gr.partes.map(p => p.mc));
    for (const p of gr.partes) {
      g.textAlign = "left"; g.fillStyle = "#ffffff"; g.font = "24px Arial"; g.fillText(p.c.t, 105, y + 26);
      rr(g, 390, y + 8, 370, 22, 11); g.fillStyle = "rgba(255,255,255,.12)"; g.fill();
      rr(g, 390, y + 8, Math.max(22, 370 * p.mc / max), 22, 11); g.fillStyle = CORES_ABA[p.c.k]; g.fill();
      g.textAlign = "right"; g.font = "bold 24px Arial"; g.fillText("R$ " + moeda(p.mc), W - 105, y + 28);
      y += 70;
    }
    g.textAlign = "left";
    mostrarPrevia(cv, ("Metas gerais - " + (S.nomeFilial || "posto") + " - " + S.rkMes).replace(/[^\wÀ-ÿ -]+/g, " ").trim() + ".jpg", () => cartaoGeral());
  } catch (e) { console.error("Cartão geral:", e); toast("Não foi possível gerar o cartão."); }
  if (b) b.disabled = false;
}

/* ---------- metas gerais do posto: litros (frentistas), venda da loja e venda MC total, com projeção pelo dia do mês ---------- */
function metasGerais(){
  const pega = k => { const x = ultimoMes(d => d.metaGeral && num(d.metaGeral[k]) > 0 ? num(d.metaGeral[k]) : null); return x ? {valor:x.v, herdada:x.mes !== S.rkMes} : null; };
  const loja = pega("loja") || pega("valor");
  return {litros:pega("litros"), loja, mc:loja, operacoes:pega("operacoes"), mcDiesel:pega("mcDiesel"), mcGasolina:pega("mcGasolina"), mcCaixa:pega("mcCaixa"), mcOpcaixa:pega("mcOpcaixa")};
}
function metaGeral(){ return metasGerais().mc; }
function projecao(real, meta){
  if (S.rkMes !== rkMesAtual() || !(meta > 0)) return null;
  const h = new Date(), dia = h.getDate(), dias = new Date(h.getFullYear(), h.getMonth() + 1, 0).getDate(), proj = real / dia * dias, resta = Math.max(0, dias - dia);
  return {proj, pct:Math.floor(proj / meta * 100), porDia:resta ? Math.max(0, meta - real) / resta : 0, resta, dia, dias};
}
function resumoGeral(){
  const partes = rkAbas().map(c => { const l = vendasDoMes(c.k); return {c, mc:l.reduce((a, r) => a + r.mc, 0), lt:c.lt ? l.reduce((a, r) => a + r.lt, 0) : 0, metaMc:l.reduce((a, r) => a + ((metaMcDaPessoa(r, c.k, l) || {}).valor || 0), 0)}; });
  const pOp = partes.find(p => p.c.k === "opcaixa"), op = pOp ? vendasDoMes("opcaixa").reduce((a, r) => a + r.q, 0) : 0, total = partes.filter(p => p.c.k !== "opcaixa").reduce((a, p) => a + p.mc, 0), litros = partes.reduce((a, p) => a + p.lt, 0), m = metasGerais();
  return {partes, total, litros, op, loja:total, m, meta:m.loja, st:m.loja ? situacao({mc:total}, {campo:"mc", valor:m.loja.valor}) : null};
}
const CORES_ABA = {loja:"#22d3ee", diesel:"#f59e0b", gasolina:"#ef4444", caixa:"#10b981", opcaixa:"#a78bfa"};
function linhaMetaGeral(icone, titulo, campo, real, meta){
  const st = meta ? situacao({[campo]:real}, {campo, valor:meta.valor}) : null, pj = meta ? projecao(real, meta.valor) : null;
  const corPj = pj ? (pj.pct >= 100 ? "var(--good)" : pj.pct >= 85 ? "var(--warn)" : "var(--crit)") : "";
  return `<div style="margin-top:12px"><div style="display:flex;justify-content:space-between;gap:8px;flex-wrap:wrap;align-items:baseline"><b>${icone} ${titulo}</b><b style="font-size:18px">${fmtCampo(campo, real)}</b></div>
    ${meta ? `<div class="meta">Meta ${fmtCampo(campo, meta.valor)}${meta.herdada ? " (do mês anterior)" : ""}</div>${barra(st, 12)}
      ${pj ? `<div class="meta" style="margin-top:4px">📈 Projeção (dia ${pj.dia} de ${pj.dias}): <b>${fmtCampo(campo, pj.proj)}</b> = <b style="color:${corPj}">${pj.pct}% da meta</b>${!st.bateu && pj.resta ? ` · precisa de <b>${fmtCampo(campo, pj.porDia)}</b> por dia nos ${pj.resta} dias restantes` : ""}</div>` : `<div class="meta" style="margin-top:4px">Mês fechado.</div>`}`
      : `<div class="meta">Sem meta${S.admin ? " · defina em ⚙️ Configurar → Metas" : ""}</div>`}</div>`;
}
function graficoSetores(partes){
  const metaDe = p => p.metaMc || 0;
  const max = Math.max(1, ...partes.map(p => Math.max(p.mc, metaDe(p)))), curto = v => v >= 1000 ? "R$ " + (v / 1000).toLocaleString("pt-BR", {maximumFractionDigits:1}) + " mil" : "R$ " + moeda(v);
  return `<div style="display:flex;align-items:flex-end;gap:8px;height:190px;margin-top:10px">${partes.map(p => { const mt = metaDe(p), pct = mt ? Math.floor(p.mc / mt * 100) : null, cor = pct == null ? "inherit" : pct >= 100 ? "var(--good)" : pct >= 70 ? "var(--warn)" : "var(--crit)";
    return `<div style="flex:1;display:flex;flex-direction:column;align-items:center;justify-content:flex-end;height:100%;min-width:0">
    <small style="font-weight:700;white-space:nowrap;font-size:11px">${curto(p.mc)}</small>${pct != null ? `<small style="font-weight:800;font-size:11px;color:${cor}">${pct}%</small>` : ""}
    <div style="position:relative;width:100%;max-width:60px;height:${Math.max(3, Math.max(p.mc, mt) / max * 115)}px;display:flex;align-items:flex-end">
      <i style="display:block;width:100%;height:${Math.max(3, p.mc / Math.max(p.mc, mt || 1) * 100)}%;background:linear-gradient(180deg,${CORES_ABA[p.c.k]},color-mix(in srgb,${CORES_ABA[p.c.k]} 55%,#000));border-radius:8px 8px 0 0"></i>
      ${mt ? `<span title="meta" style="position:absolute;left:-4px;right:-4px;top:${Math.max(0, 100 - mt / Math.max(p.mc, mt) * 100)}%;border-top:3px dashed var(--ink)"></span>` : ""}</div>
    <small class="meta" style="text-align:center;font-size:10.5px;line-height:1.15;margin-top:4px">${p.c.ico}<br>${p.c.t}${mt ? `<br>meta ${curto(mt)}` : ""}</small></div>`; }).join("")}</div>
    <p class="meta" style="font-size:11px;margin:4px 0 0">Linha tracejada = soma das metas de venda da loja das pessoas do setor.</p>`;
}
function tileMeta(icone, titulo, campo, real, meta){
  const st = meta ? situacao({[campo]:real}, {campo, valor:meta.valor}) : null, pj = meta ? projecao(real, meta.valor) : null;
  const corPj = pj ? (pj.pct >= 100 ? "var(--good)" : pj.pct >= 85 ? "var(--warn)" : "var(--crit)") : "";
  return `<div style="background:var(--surface2);border:1px solid var(--line);border-radius:12px;padding:8px 10px;min-width:0">
    <div class="meta" style="font-size:11px;font-weight:700">${icone} ${titulo}</div>
    <div style="display:flex;justify-content:space-between;gap:6px;align-items:baseline"><b style="font-size:16px;white-space:nowrap">${fmtCampo(campo, real)}</b>${st ? `<b style="color:${st.cor}">${st.pct}%</b>` : ""}</div>
    ${meta ? `${barra(st ? {...st, texto:""} : null, 8)}<div style="font-size:11px;line-height:1.4;color:var(--muted);margin-top:4px">Meta ${fmtCampo(campo, meta.valor)}${meta.herdada ? "*" : ""}<br>${st.bateu ? `✅ passou ${fmtCampo(campo, real - meta.valor)}` : `Faltam <span style="font-weight:800;color:var(--ink)">${fmtCampo(campo, meta.valor - real)}</span>`}${pj ? `<br>📈 Projeção <span style="font-weight:800;color:${corPj}">${pj.pct}%</span>${!st.bateu && pj.resta ? ` · ${fmtCampo(campo, pj.porDia)}/dia` : ""}` : ""}</div>`
      : `<div class="meta" style="font-size:11px">Sem meta${S.admin ? " · ⚙️" : ""}</div>`}</div>`;
}
function cardMetaGeral(){
  const g = resumoGeral(), temLitros = rkAbas().some(c => c.lt), logo = rkLogo();
  return `<div class="card"><div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">${logo ? `<img src="${logo}" alt="Aldo" style="height:30px;width:auto;flex:none">` : ""}<h2 style="margin:0;font-size:15px">Metas do posto · ${nomeMes(S.rkMes)}</h2></div>
    <div style="display:grid;grid-template-columns:${temLitros ? "1fr 1fr" : "1fr"};gap:8px">
      ${temLitros ? tileMeta("⛽", "Litros (frentistas)", "lt", g.litros, g.m.litros) : ""}
      ${tileMeta("🛒", "Venda da Loja (todos)", "mc", g.total, g.m.loja)}${rkAbas().some(c => c.k === "opcaixa") ? tileMeta("🧾", "Operações Caixa (qtd.)", "q", g.op, g.m.operacoes) : ""}</div>
    <details style="margin-top:8px"><summary class="meta" style="cursor:pointer;font-weight:700">📊 Venda MC por setor</summary>${graficoSetores(g.partes.filter(p => p.c.k !== "opcaixa"))}</details></div>`;
}
async function salvarMetaGeral(b){
  const ler = id => { const t = (($("#" + id) || {}).value || "").trim(); return t ? parse(t) : 0; };
  const litros = ler("mgLitros"), loja = ler("mgLoja"), valor = ler("mgGeral");
  if (![litros, loja, valor].every(v => v >= 0)) return toast("Valor inválido. Ex.: 900.000 ou 150.000,00");
  b.disabled = true; await safe(() => gravaVendas({metaGeral:{litros, loja, valor}}), "Metas gerais salvas."); b.disabled = false;
}
function shBaixarRanking(){
  const c = rkCat();
  openSheet(`<h2>Baixar e enviar</h2><p class="meta" style="margin:0 0 10px">${c.t} · ${nomeMes(S.rkMes)}</p>
    <button class="btn pri" data-act="baixarRkImagem">🎉 Imagem do ranking (JPG)</button>
    <button class="btn" data-act="rkLote">📦 Cartões individuais de todos (por categoria)</button>
    <button class="btn" data-act="rkCartaoTodos">👥 Metas de todos por categoria (JPG)</button>
    <button class="btn" data-act="cartaoGeral">🏪 Cartão das metas gerais (JPG)</button>
    <p style="font-size:11px;color:var(--muted);margin:2px 0 6px">Cada imagem abre uma prévia antes de enviar; lá dá para trocar o fundo por uma foto da galeria.</p>
    <button class="btn" data-act="baixarRanking" data-t="pdf">📄 Tabela em PDF</button>
    <button class="btn" data-act="fechar">Fechar</button>`);
}

/* ---------- imagem do ranking para enviar: pódio, confete e barras de meta ---------- */
async function desenhaAvatar(g, r, x, y, R, cor){
  g.lineWidth = Math.max(6, R / 9); g.strokeStyle = cor; g.beginPath(); g.arc(x, y, R + g.lineWidth / 2, 0, Math.PI * 2); g.stroke();
  const foto = await carregaImg(rkFotosAtivas() && r.pid ? (S.rkFotos || {})[r.pid] : null);
  g.save(); g.beginPath(); g.arc(x, y, R, 0, Math.PI * 2); g.clip();
  if (foto) { const l = Math.min(foto.width, foto.height); g.drawImage(foto, (foto.width - l) / 2, (foto.height - l) / 2, l, l, x - R, y - R, R * 2, R * 2); }
  else { g.fillStyle = "#13325a"; g.fillRect(x - R, y - R, R * 2, R * 2); g.fillStyle = "#e6eef9"; g.font = `bold ${Math.round(R * 0.8)}px Arial`; g.textAlign = "center"; g.fillText(r.nome.split(" ").filter(Boolean).map(z => z[0]).slice(0, 2).join("").toUpperCase(), x, y + R * 0.28); }
  g.restore();
}
async function cartaoRanking(b){
  if (b) b.disabled = true;
  try {
    const c = rkCat(), lista = listaRk(c), campo = c.lt ? "lt" : "mc", dq = rkDestaqueAtivo() ? destaqueDe(c.k) : null;
    const linhas = lista.map(r => { const m = metaDaPessoa(r, c.k, lista); return {...r, m, st:situacao(r, m)}; }).slice(0, 30);
    const W = 1080, H = 1170 + Math.max(0, linhas.length - 3) * 112, cv = document.createElement("canvas"); cv.width = W; cv.height = H; const g = cv.getContext("2d");
    await fundoCartao(g, W, H); g.translate(0, 110); g.textAlign = "center";
    g.fillStyle = "#ffffff"; g.font = "bold 54px Arial"; g.fillText(c.t.toUpperCase(), W / 2, 205);
    const cores = ["#fbbf24", "#22d3ee", "#f472b6", "#34d399", "#a78bfa", "#f87171"];
    for (let i = 0; i < 90; i++) { g.save(); g.globalAlpha = 0.8; g.fillStyle = cores[i % 6]; g.translate((i * 137) % W, 240 + (i * 89) % 560); g.rotate(i); g.fillRect(-7, -3, 14, 6); g.restore(); }
    const valor = r => fmtCampo(campo, r[campo]);
    const pod = [[1, W / 2 - 335, 560, "#cbd5e1", 88], [0, W / 2, 470, "#fbbf24", 108], [2, W / 2 + 335, 620, "#d97706", 80]];
    for (const [i, x, topo, cor, R] of pod) {
      const r = linhas[i]; if (!r) continue;
      const py = topo + R + 40, gr = g.createLinearGradient(0, py, 0, 960); gr.addColorStop(0, cor); gr.addColorStop(1, "rgba(255,255,255,.08)");
      rr(g, x - 150, py, 300, 960 - py, 22); g.fillStyle = gr; g.fill();
      await desenhaAvatar(g, r, x, topo, R, cor);
      g.textAlign = "center"; g.fillStyle = "#071226"; g.font = "bold 26px Arial"; g.fillText(cortaTexto(g, r.nome, 280), x, py + 42);
      g.font = "bold 28px Arial"; g.fillText(valor(r), x, py + 82);
      if (r.st) { g.font = "bold 24px Arial"; g.fillText((r.st.bateu ? "✅ " : "") + r.st.pct + "% da meta", x, py + 116); }
      g.fillStyle = "rgba(7,18,38,.85)"; g.font = "bold 64px Arial"; g.fillText((i + 1) + "º", x, 940);
      if (dq && dq.r.pid && dq.r.pid === r.pid) { g.font = "44px Arial"; g.fillText("⭐", x + R * 0.75, topo - R * 0.6); }
    }
    let y = 1000;
    for (let i = 3; i < linhas.length; i++) {
      const r = linhas[i]; painelVidro(g, 70, y, W - 140, 96, 20);
      g.textAlign = "center"; g.fillStyle = "#22d3ee"; g.font = "bold 34px Arial"; g.fillText((i + 1) + "º", 120, y + 60);
      await desenhaAvatar(g, r, 205, y + 48, 32, r.st ? (r.st.bateu ? "#34d399" : r.st.pct >= 70 ? "#fbbf24" : "#f87171") : "#22d3ee");
      g.textAlign = "left"; g.fillStyle = "#ffffff"; g.font = "bold 28px Arial"; g.fillText(cortaTexto(g, r.nome + (dq && dq.r.pid === r.pid ? " ⭐" : ""), 520), 255, y + 40);
      g.fillStyle = "rgba(255,255,255,.65)"; g.font = "21px Arial"; g.fillText(nomeFuncao(r.funcao), 255, y + 70);
      g.textAlign = "right"; g.fillStyle = "#ffffff"; g.font = "bold 28px Arial"; g.fillText(valor(r), W - 95, y + 40);
      if (r.st) {
        const bx = W - 95 - 250; rr(g, bx, y + 56, 250, 14, 7); g.fillStyle = "rgba(255,255,255,.15)"; g.fill();
        rr(g, bx, y + 56, Math.max(14, 250 * Math.min(1, r.st.pct / 100)), 14, 7); g.fillStyle = r.st.bateu ? "#34d399" : r.st.pct >= 70 ? "#fbbf24" : "#f87171"; g.fill();
        g.font = "bold 20px Arial"; g.fillStyle = "#ffffff"; g.fillText(r.st.pct + "%", W - 95, y + 92);
      }
      y += 112;
    }
    if (!linhas.length) { g.textAlign = "center"; g.fillStyle = "#ffffff"; g.font = "32px Arial"; g.fillText("Sem lançamentos neste mês", W / 2, 600); }
    g.textAlign = "left";
    mostrarPrevia(cv, ("Ranking " + c.t + " - " + S.rkMes).replace(/[^\wÀ-ÿ -]+/g, " ").trim() + ".jpg", () => cartaoRanking());
  } catch (e) { console.error("Imagem do ranking:", e); toast("Não foi possível gerar a imagem."); }
  if (b) b.disabled = false;
}

/* ---------- ações do ranking tratadas aqui (o index.html só repassa) ---------- */
async function rkAcao(a, b){
  if (a === "novaOperacao") { if (!S.admin) { toast("Área restrita ao administrador."); return true; } shVenda("opcaixa~"); return true; }
  if (a === "rkRecarregar") { location.reload(); return true; }
  if (a === "aplicarListaEquipe") { if (!S.admin) { toast("Área restrita ao administrador."); return true; } aplicarListaEquipe(b); return true; }
  if (a === "rkGrupo") { if (!S.admin) { toast("Área restrita ao administrador."); return true; } salvarGrupo(b); return true; }
  if (a === "addMembro") { if (!S.admin) { toast("Área restrita ao administrador."); return true; } addMembro(b); return true; }
  if (a === "rkSetor") { if (!S.admin) { toast("Área restrita ao administrador."); return true; } salvarSetor(b); return true; }
  if (a === "salvarProdutos") { if (!S.admin) { toast("Área restrita ao administrador."); return true; } salvarProdutos(b); return true; }
  if (a === "rkBaixar") { shBaixarRanking(); return true; }
  if (a === "salvarMetasSetores") { if (!S.admin) { toast("Área restrita ao administrador."); return true; } salvarMetasSetores(b); return true; }
  if (a === "baixarRkImagem") { cartaoRanking(b); return true; }
  if (a === "rkCartaoTodos") { cartaoTodos(b); return true; }
  if (a === "rkLote") { shLote(); return true; }
  if (a === "rkLoteGerar") { gerarLote(b); return true; }
  if (a === "rkLoteEnviar") { enviarLote(b); return true; }
  if (a === "rkLoteVoltar") { previaLote(); return true; }
  if (a === "rkLoteVer") { const x = (S.rkLote || {itens:[]}).itens[+b.dataset.i]; if (x) openSheet(`<h2>${esc(x.cat)}</h2><img src="${URL.createObjectURL(x.blob)}" alt="" style="width:100%;border-radius:12px"><button class="btn pri" style="margin-top:8px" data-act="rkLoteVoltar">↩️ Voltar para todos</button>`); return true; }
  if (a === "rkPrevEnviar") { const p = S.rkPrev; if (!p) return true; b.disabled = true; try { await compartilharOuBaixar(await p.blob, p.nome); } catch (e) { toast("Não foi possível enviar a imagem."); } b.disabled = false; return true; }
  if (a === "rkFundoPadrao") { RK_FUNDO.mem = null; try { localStorage.removeItem("rkFundo"); } catch (e) {} toast("Fundo padrão."); if (S.rkPrev && S.rkPrev.refazer) S.rkPrev.refazer(); return true; }
  const soAdmin = ["rkMadrugada", "novaFuncao", "removerFuncao"];
  if (soAdmin.includes(a) && !S.admin) { toast("Área restrita ao administrador."); return true; }
  if (a === "rkMadrugada") {
    const id = b.dataset.id, p = pessoasRk()[id] || {}, grupo = ["caixa", "caixa_madrugada"].includes(p.funcao) || (funcoesExtras()[p.funcao] || {}).grupo === "caixa" ? "caixa" : "frentista";
    const mad = grupo === "caixa" ? "caixa_madrugada" : "frentista_madrugada", nova = p.funcao === mad ? grupo : mad;
    if (await safe(() => S.db.doc("cfg/main").update({rkPessoas:{[id]:{funcao:nova}}}), (p.nome || "") + ": " + nomeFuncao(nova))) { S.cfg = {...S.cfg, rkPessoas:deepMerge(pessoasRk(), {[id]:{funcao:nova}})}; render(); }
    return true;
  }
  if (a === "novaFuncao") {
    const nome = (($("#fnNome") || {}).value || "").trim(), grupo = ($("#fnGrupo") || {}).value || "frentista";
    if (!nome) { toast("Digite o nome da função. Ex.: Frentista Tarde"); return true; }
    if (Object.values(funcoesTodas()).some(t => semAcento(t) === semAcento(nome))) { toast("Essa função já existe."); return true; }
    const k = "f" + Date.now().toString(36);
    if (await safe(() => S.db.doc("cfg/main").update({rkFuncoes:{[k]:{nome, grupo, x:0}}}), "Função " + nome + " criada.")) { S.cfg = {...S.cfg, rkFuncoes:{...((S.cfg || {}).rkFuncoes || {}), [k]:{nome, grupo, x:0}}}; render(); }
    return true;
  }
  if (a === "removerFuncao") {
    const k = b.dataset.f, f = funcoesExtras()[k] || {};
    if (Object.values(pessoasRk()).some(p => p && !p.x && p.funcao === k)) { toast("Ainda há pessoas nessa função. Mude a função delas antes."); return true; }
    if (!confirm("Remover a função " + (f.nome || "") + "?")) return true;
    if (await safe(() => S.db.doc("cfg/main").update({rkFuncoes:{[k]:{x:1}}}), "Função removida.")) { S.cfg = {...S.cfg, rkFuncoes:deepMerge((S.cfg || {}).rkFuncoes || {}, {[k]:{x:1}})}; render(); }
    return true;
  }
  return false;
}

/* importar da imagem: lê a foto do relatório no próprio aparelho (nada é enviado para fora além do leitor baixado na 1ª vez) */
let tessP = null;
function carregaLeitor(){
  if (window.Tesseract) return Promise.resolve(window.Tesseract);
  if (!tessP) tessP = new Promise((ok, erro) => { const sc = document.createElement("script"); sc.src = "https://cdn.jsdelivr.net/npm/tesseract.js@5.1.1/dist/tesseract.min.js"; sc.onload = () => ok(window.Tesseract); sc.onerror = () => { tessP = null; erro(new Error("Sem internet para carregar o leitor de imagens.")); }; document.head.appendChild(sc); });
  return tessP;
}
async function prepImagem(img, larg, limiar){
  const k = Math.max(1, larg / img.width), cv = document.createElement("canvas"); cv.width = Math.round(img.width * k); cv.height = Math.round(img.height * k);
  const g = cv.getContext("2d"); g.imageSmoothingQuality = "high"; g.drawImage(img, 0, 0, cv.width, cv.height);
  const d = g.getImageData(0, 0, cv.width, cv.height);
  for (let i = 0; i < d.data.length; i += 4) { let y = 0.3 * d.data[i] + 0.59 * d.data[i + 1] + 0.11 * d.data[i + 2]; y = y < limiar ? 0 : 255; d.data[i] = d.data[i + 1] = d.data[i + 2] = y; }
  g.putImageData(d, 0, 0); return cv;
}
function linhasDoTexto(txt, solto){
  const out = [];
  for (const bruto of String(txt).split(/\n+/)) {
    const l = bruto.replace(/[|]/g, " ").replace(/(\d)[:;](\d)/g, "$1.$2").replace(/\.,/g, ",").replace(/\s+/g, " ").trim();
    const nums = l.match(solto ? /\d{1,3}(?:\.\d{3})+(?:,\d{2})?|\d+(?:,\d{2})?/g : /\d{1,3}(?:\.\d{3})+,\d{2}|\d+,\d{2}/g) || [];
    if (nums.length < (solto ? 1 : 2)) continue;
    const nome = l.slice(0, l.search(/\d/)).replace(/R\$|RS\b/gi, " ").replace(/[^A-Za-zÀ-ÿ' .-]/g, " ").replace(/\s+/g, " ").trim();
    if (nome.replace(/[^A-Za-zÀ-ÿ]/g, "").length < 3 || /vendedor|quantidade|venda mc|litragem/i.test(nome)) continue;
    out.push({nome, v:nums.map(n => parse(n))});
  }
  return out;
}
async function importarImagem(arq, aba){
  if (!arq) return;
  const c = (aba && RK.find(x => x.k === aba)) || rkCat(); S.importaAba = c.k;
  openSheet(`<h2>Lendo a imagem…</h2><p class="meta">Na primeira vez, o leitor é baixado (alguns segundos). Depois é rápido.</p>`);
  try {
    const T = await carregaLeitor();
    const url = await new Promise((ok, erro) => { const r = new FileReader(); r.onload = () => ok(r.result); r.onerror = erro; r.readAsDataURL(arq); });
    const img = await new Promise((ok, erro) => { const i = new Image(); i.onload = () => ok(i); i.onerror = erro; i.src = url; });
    const w = await T.createWorker("por"), leituras = [];
    try { for (const [larg, lim] of [[1800, 160], [2000, 130], [2400, 170]]) { const {data} = await w.recognize(await prepImagem(img, larg, lim)); leituras.push(linhasDoTexto(data.text, c.k === "opcaixa")); } }
    finally { await w.terminate(); }
    // junta as 3 leituras: fica o valor que mais se repete; se elas não concordam, a linha fica marcada para conferir
    const base = leituras.reduce((a, b) => b.length > a.length ? b : a, []), rows = [];
    base.forEach((r, i) => {
      const iguais = leituras.map(L => L.find(x => semAcento(x.nome) === semAcento(r.nome)) || L[i]).filter(Boolean);
      const campos = [0, 1, 2].map(k => { const vs = iguais.map(x => x.v[k]).filter(v => v != null && !isNaN(v)); if (!vs.length) return {v:undefined, ok:true}; const cont = {}; vs.forEach(v => cont[v] = (cont[v] || 0) + 1); const [v, n] = Object.entries(cont).sort((a, b) => b[1] - a[1])[0]; return {v:Number(v), ok:n === vs.length}; });
      const p = acharParecido(r.nome);
      rows.push({nome:r.nome, cad:p ? p.nome : null, pid:p ? p.id : null, q:campos[0].v, mc:campos[1].v ?? (c.k === "opcaixa" ? 0 : undefined), lt:c.lt ? campos[2].v : undefined, conferir:!campos.slice(0, c.lt ? 3 : c.k === "opcaixa" ? 1 : 2).every(x => x.ok)});
    });
    S.importa = rows;
    if (!rows.length) { openSheet(`<h2>Nada encontrado</h2><p class="meta">Não achei linhas com nome e números. Use uma foto ou print nítido da tabela, sem cortes, e tente de novo.</p><button class="btn" data-act="fechar">Fechar</button>`); return; }
    const novos = rows.filter(r => !r.cad).length;
    const inp = (i, k, v, fmtv) => `<input class="inp" data-imp="${i}" data-k="${k}" inputmode="decimal" value="${v == null ? "" : esc(fmtv(v))}" style="padding:6px 8px;min-width:80px">`;
    openSheet(`<h2>Conferir importação · ${c.t}</h2>
      <p style="margin:0 0 8px;font-size:12px;color:var(--muted);line-height:1.45">Confira os valores lidos. Linhas em <b style="color:var(--warn)">amarelo</b> tiveram leituras diferentes: confira com a imagem. Desmarque o que não quiser lançar.${novos ? ` <b style="color:var(--warn)">⚠️ ${novos} nome(s) não estão na equipe</b>: ficam desmarcados; marque e escolha o grupo para adicionar.` : ""} Cada pessoa vai automaticamente para o grupo dela, substituindo o valor anterior do mês.</p>
      <div style="overflow-x:auto"><table class="tbl"><tr><th></th><th>${c.p}</th><th class="n">Qtd.</th><th class="n">Venda MC</th>${c.lt ? `<th class="n">Litragem</th>` : ""}</tr>
      ${rows.map((r, i) => `<tr style="${r.conferir ? "background:var(--warn-bg)" : ""}"><td><input type="checkbox" data-imp-ok="${i}" ${r.cad ? "checked" : ""}></td><td><input class="inp" data-imp="${i}" data-k="nome" value="${esc(r.nome)}" style="padding:6px 8px;min-width:150px">${r.cad ? `<br><span style="font-size:11px;color:var(--muted)">✔ ${esc(r.cad)} · ${esc(grupoOpcoes()[grupoKey(pessoasRk()[r.pid])] || "")}</span>` : `<br><span style="font-size:11px;color:var(--warn);font-weight:700">⚠️ Não está na equipe. Marque para adicionar como:</span><br><select class="inp" data-imp-g="${i}" style="padding:4px 6px;font-size:12px">${c.k === "todos" ? `<option value="">— escolha o grupo —</option>` : ""}${Object.entries(grupoOpcoes()).filter(([k]) => k !== "frentista").map(([k, t]) => `<option value="${k}" ${k === grupoDaAba(c.k) ? "selected" : ""}>${t}</option>`).join("")}</select>`}</td><td>${inp(i, "q", r.q, fmt2)}</td><td>${inp(i, "mc", r.mc, moeda)}</td>${c.lt ? `<td>${inp(i, "lt", r.lt, fmt2)}</td>` : ""}</tr>`).join("")}</table></div>
      <p style="font-size:12px;color:var(--muted)">Mês: <b>${S.rkMes.split("-").reverse().join("/")}</b>. Uma linha por pessoa: o valor novo substitui o anterior.</p>
      <div class="row"><button class="btn" data-act="fechar">Cancelar</button><button class="btn pri" data-act="confirmarImport">Lançar marcados</button></div>`);
  } catch (e) { console.error("Importar imagem:", e); openSheet(`<h2>Não foi possível ler</h2><p class="meta">${esc(e.message || "Erro ao ler a imagem.")}</p><button class="btn" data-act="fechar">Fechar</button>`); }
}
async function confirmarImport(b){
  const c = RK.find(x => x.k === S.importaAba) || rkCat(), lidos = []; let erro = "";
  (S.importa || []).forEach((r, i) => {
    if (!(document.querySelector(`[data-imp-ok="${i}"]`) || {}).checked) return;
    const val = k => (document.querySelector(`[data-imp="${i}"][data-k="${k}"]`) || {}).value;
    const nome = String(val("nome") || "").trim(), q = parse(val("q")), mc = c.k === "opcaixa" ? (parse(val("mc")) || 0) : parse(val("mc")), lt = c.lt ? parse(val("lt")) : 0;
    const g = r.pid ? null : (document.querySelector(`[data-imp-g="${i}"]`) || {}).value;
    if (!nome || !(q >= 0) || !(mc >= 0) || (c.lt && !(lt >= 0))) { erro = erro || "Confira a linha " + (i + 1) + ": nome ou número inválido."; return; }
    if (!r.pid && !g) { erro = erro || "Escolha o grupo de " + nome + "."; return; }
    lidos.push({nome, ocr:r.nome, pid:r.pid, g, q, mc, lt});
  });
  if (erro) return toast(erro);
  if (!lidos.length) return toast("Nenhuma linha marcada.");
  b.disabled = true;
  const ok = await safe(async () => {
    const P0 = pessoasRk(), novosP = {}, d = (S.vendas || {})[S.rkMes] || {}, patch = {}, agora = Date.now();
    lidos.forEach((r, i) => {
      const chave = t => semAcento(t).replace(/\s+/g, " ").trim();
      if (r.pid) { const p = P0[r.pid]; const ch = [...new Set([...(p.chaves || []), chave(r.ocr), chave(r.nome)])]; if (ch.length !== (p.chaves || []).length) novosP[r.pid] = {chaves:ch}; }
      else { r.pid = "p" + agora.toString(36) + i; novosP[r.pid] = {nome:r.nome, chaves:[...new Set([chave(r.ocr), chave(r.nome)])], x:0, ...grupoParaFuncao(r.g)}; }
    });
    if (Object.keys(novosP).length) { await S.db.doc("cfg/main").update({rkPessoas:novosP}); S.cfg = deepMerge(S.cfg || {}, {rkPessoas:novosP}); }
    const P = pessoasRk();
    lidos.forEach((r, i) => {
      const p = P[r.pid] || {}, dest = tabDestino(p, c.k), nomeCad = p.nome || r.nome;
      let idDest = null;
      for (const tb of c.k === "opcaixa" ? ["opcaixa"] : [...DEDUP_TABS, "frentista"]) for (const [id, v] of Object.entries(d[tb] || {})) {
        if (!v || v.x || !(v.pid === r.pid || (!v.pid && acharParecido(v.nome) && acharParecido(v.nome).id === r.pid))) continue;
        if (tb === dest && !idDest) idDest = id; else (patch[tb] = patch[tb] || {})[id] = {x:1};
      }
      const id = idDest || "v" + agora.toString(36) + i, abaLt = RK.find(x => x.k === dest) || {};
      (patch[dest] = patch[dest] || {})[id] = {nome:nomeCad, pid:r.pid, q:r.q, mc:r.mc, ...(abaLt.lt && c.lt ? {lt:r.lt} : {}), x:0, t:agora};
    });
    await gravaVendas(patch);
  }, lidos.length + " lançamento(s) importado(s).");
  if (ok) { S.importa = null; closeSheet(); } else b.disabled = false;
}


/* seletores compactos do topo do ranking */
document.addEventListener("change", ev => { const t = ev.target; if (!t) return;
  if (t.id === "rkTipoSel") { S.rkTipo = t.value; render(); } else if (t.id === "rkOrdemSel") { S.rkOrdem = t.value; render(); } });
/* carrega o logo do Aldo já na abertura, para as imagens saírem com ele */
try { rkLogo(); } catch (e) {}

/* ---------- 🏷️ produtos mais vendidos (frentistas, loja e caixa), lidos de um arquivo (imagem, CSV ou TXT) ----------
   fica recolhido no fim do ranking; salva só os 15 primeiros em vendas/AAAA-MM.produtos[grupo] */
const grupoProd = c => rkVirtual(c.k) ? "frentista" : (GRUPO_ABA[c.k] || "loja");
const NOME_GRUPO = {frentista:"Frentistas", loja:"Loja", caixa:"Caixa"};
function cardProdutos(c){
  if (c.k === "todos") return "";
  const gp = grupoProd(c), d = (((S.vendas || {})[S.rkMes] || {}).produtos || {})[gp], itens = (d && Array.isArray(d.itens)) ? d.itens : [];
  if (!itens.length && !S.admin) return "";
  const max = Math.max(1, ...itens.map(x => num(x.q)));
  return `<details class="card"><summary style="cursor:pointer;font-weight:800">🏷️ Produtos mais vendidos · ${NOME_GRUPO[gp]}</summary>
    ${itens.length ? itens.map((x, i) => `<div style="padding:6px 0;border-bottom:1px solid var(--line)"><div style="display:flex;justify-content:space-between;gap:8px;font-size:13px"><span style="min-width:0"><b>${i + 1}.</b> ${esc(x.n)}</span><b style="white-space:nowrap">${fmt2(x.q)}${num(x.v) ? ` · R$ ${moeda(x.v)}` : ""}</b></div><div style="height:5px;background:var(--line);border-radius:9px;margin-top:4px"><i style="display:block;height:100%;width:${Math.max(3, num(x.q) / max * 100)}%;background:#22d3ee;border-radius:9px"></i></div></div>`).join("") : `<p class="meta" style="margin:6px 0">Nenhum arquivo enviado neste mês.</p>`}
    ${S.admin ? `<label class="btn" style="margin-top:10px;cursor:pointer">📎 Enviar arquivo dos produtos (foto, CSV ou TXT)<input type="file" accept="image/*,.csv,.txt,text/plain,text/csv" data-rk-prod="1" hidden></label><p style="font-size:11px;color:var(--muted);margin:4px 0 0">Cada linha: nome do produto, quantidade e valor (opcional). Fica salvo para ${NOME_GRUPO[gp]} em ${nomeMes(S.rkMes)}.</p>` : ""}</details>`;
}
/* linha "ÓLEO 15W40 1L  12  540,00" → {n:"ÓLEO 15W40 1L", q:12, v:540} (números do fim da linha) */
function linhasProduto(txt){
  const out = [];
  for (const bruto of String(txt).split(/\r?\n+/)) {
    const tk = bruto.replace(/["|]/g, " ").replace(/[;\t]/g, " ").replace(/R\$\s*/gi, " ").replace(/\s+/g, " ").trim().split(" "), nums = [];
    while (tk.length > 1 && /^\d{1,3}(?:\.\d{3})*(?:,\d{1,3})?$|^\d+(?:,\d{1,3})?$/.test(tk[tk.length - 1])) nums.unshift(parse(tk.pop()));
    const n = tk.join(" ").replace(/^\d+\s*[-.]?\s*/, "").trim();
    if (!nums.length || n.replace(/[^A-Za-zÀ-ÿ]/g, "").length < 3 || /^(produto|descri|total|item)/i.test(n)) continue;
    out.push({n, q:nums[0], v:nums.length > 1 ? nums[nums.length - 1] : 0});
  }
  const soma = {};
  for (const x of out) { const k = semAcento(x.n); soma[k] = soma[k] ? {...soma[k], q:soma[k].q + x.q, v:soma[k].v + x.v} : x; }
  return Object.values(soma).sort((a, b) => b.q - a.q || b.v - a.v).slice(0, 15);
}
async function importarProdutos(arq){
  if (!arq) return;
  const c = rkCat(), gp = grupoProd(c);
  openSheet(`<h2>Lendo o arquivo…</h2><p class="meta">Foto: o leitor é baixado na primeira vez (alguns segundos).</p>`);
  try {
    let txt = "";
    if (/^image\//.test(arq.type)) {
      const T = await carregaLeitor(), url = await new Promise((ok, erro) => { const r = new FileReader(); r.onload = () => ok(r.result); r.onerror = erro; r.readAsDataURL(arq); });
      const img = await new Promise((ok, erro) => { const i = new Image(); i.onload = () => ok(i); i.onerror = erro; i.src = url; });
      const w = await T.createWorker("por"); try { txt = (await w.recognize(await prepImagem(img, 2000, 150))).data.text; } finally { await w.terminate(); }
    } else txt = await arq.text();
    const itens = linhasProduto(txt); S.rkProdLidos = {gp, itens};
    openSheet(`<h2>🏷️ Produtos · ${NOME_GRUPO[gp]}</h2><p class="meta" style="margin:0 0 8px">${nomeMes(S.rkMes)} · confira e corrija antes de salvar.</p>
      ${itens.length ? `<div style="max-height:55vh;overflow:auto">${itens.map((x, i) => `<div style="display:grid;grid-template-columns:1fr 70px 90px;gap:4px;margin-bottom:4px"><input class="inp" style="padding:6px" data-pn="${i}" value="${esc(x.n)}"><input class="inp" style="padding:6px" data-pq="${i}" inputmode="decimal" value="${esc(fmt2(x.q))}"><input class="inp" style="padding:6px" data-pv="${i}" inputmode="decimal" value="${x.v ? esc(moeda(x.v)) : ""}"></div>`).join("")}</div>
        <div class="row"><button class="btn" data-act="fechar">Cancelar</button><button class="btn pri" data-act="salvarProdutos">💾 Salvar</button></div>` : `<p class="meta">Não encontrei linhas com produto e quantidade. Tente outra foto (mais nítida) ou um CSV.</p><button class="btn" data-act="fechar">Fechar</button>`}`);
  } catch (e) { console.error("Produtos:", e); openSheet(`<h2>Não foi possível ler</h2><p class="meta">Tente de novo com outra foto ou um CSV.</p><button class="btn" data-act="fechar">Fechar</button>`); }
}
async function salvarProdutos(b){
  const L = S.rkProdLidos; if (!L) return;
  const itens = L.itens.map((x, i) => ({n:((document.querySelector(`[data-pn="${i}"]`) || {}).value || "").trim(), q:parse((document.querySelector(`[data-pq="${i}"]`) || {}).value || "0"), v:parse((document.querySelector(`[data-pv="${i}"]`) || {}).value || "0") || 0}))
    .filter(x => x.n && x.q >= 0).sort((a, b) => b.q - a.q);
  b.disabled = true; const ok = await safe(() => gravaVendas({produtos:{[L.gp]:{itens, t:Date.now()}}}), "Produtos salvos."); if (ok) closeSheet(); else b.disabled = false;
}
document.addEventListener("change", ev => { const t = ev.target; if (t && t.dataset && t.dataset.rkProd) { const f = t.files && t.files[0]; t.value = ""; importarProdutos(f); } });

/* ⛽ ⚙️ → Frentistas: um toque escolhe o setor de cada frentista; venda e meta passam a contar nesse setor */
function telaSetores(){
  const P = pessoasRk(), ids = new Set();
  for (const t of ["diesel", "gasolina"]) for (const r of vendasDoMes(t)) if (r.pid) ids.add(r.pid);
  for (const [id, p] of Object.entries(P)) if (p && !p.x && (FRENT[p.setor] || BASE_GRUPO.frentista.includes(p.funcao))) ids.add(id);
  const gente = [...ids].filter(id => P[id] && !P[id].x).map(id => ({id, ...P[id]})).sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));
  const atual = p => FRENT[p.setor] ? p.setor : p.funcao === "lubrificador" ? "lubrificador" : p.funcao === "frentista_madrugada" ? "madrugada" : "";
  const curto = {diesel:"🛢️ Diesel", gasolina:"⛽ Gasolina", lubrificador:"🔧 Lubrif.", madrugada:"🌙 Madrug."};
  const cont = k => gente.filter(p => atual(p) === k).length;
  return `<div class="card"><h2>⛽ Setor de cada frentista</h2>
    <p style="font-size:12px;color:var(--muted);margin:4px 0 8px;line-height:1.4">Toque no setor de cada um. A venda (litragem e Venda MC) e a meta passam a contar nesse setor, não importa de qual relatório veio. Sem escolha: vale o relatório (Diesel ou Gasolina).</p>
    <div style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:6px">${Object.keys(FRENT).map(k => `<span class="meta" style="font-size:11px">${curto[k]}: <b>${cont(k)}</b></span>`).join("")}</div>
    ${gente.length ? gente.map(p => `<div style="border-top:1px solid var(--line);padding:8px 0"><b style="font-size:14px">${esc(p.nome)}</b>
      <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:4px;margin-top:6px">${Object.keys(FRENT).map(k => `<button class="chip ${atual(p) === k ? "on" : ""}" style="justify-content:center;padding:7px 2px;font-size:12px;margin:0" data-act="rkSetor" data-id="${p.id}" data-s="${k}">${curto[k]}</button>`).join("")}</div></div>`).join("")
      : `<p class="meta">Nenhum frentista ainda. Importe o relatório de Diesel ou Gasolina primeiro.</p>`}</div>`;
}
async function salvarSetor(b){
  const id = b.dataset.id, k = b.dataset.s, f = b.dataset.f, patch = {rkPessoas:{[id]:f ? {funcao:f} : {setor:k, funcao:FUNC_SETOR[k]}}};
  b.disabled = true;
  if (await safe(() => S.db.doc("cfg/main").update(patch), (f ? nomeFuncao(f) : FRENT[k] || "") + " ✓")) { S.cfg = deepMerge(S.cfg || {}, patch); render(); b.parentElement.querySelectorAll(".chip").forEach(x => x.classList.toggle("on", x === b)); } b.disabled = false;
}

/* ✏️ Alterar: trocar a função do colaborador com um toque; a meta passa a ser a da nova função */
function botoesFuncao(v, tb){
  const P = pessoasRk(), pid = (v.pid && P[v.pid]) ? v.pid : (v.nome && (acharPessoa(v.nome) || {}).id);
  if (!pid || !S.admin) return "";
  const p = P[pid] || {}, fr = tb === "diesel" || tb === "gasolina";
  const curto = {diesel:"🛢️ Diesel", gasolina:"⛽ Gasolina", lubrificador:"🔧 Lubrif.", madrugada:"🌙 Madrug."};
  const atual = fr ? setorDe(p, {funcao:funcaoDe(p, tb), src:tb}) : funcaoDe(p, tb);
  const bts = fr ? Object.keys(FRENT).map(k => `<button class="chip ${atual === k ? "on" : ""}" style="justify-content:center;padding:7px 2px;font-size:12px;margin:0" data-act="rkSetor" data-id="${pid}" data-s="${k}">${curto[k]}</button>`)
    : funcoesDaAba(tb).map(f => `<button class="chip ${atual === f ? "on" : ""}" style="justify-content:center;padding:7px 4px;font-size:12px;margin:0" data-act="rkSetor" data-id="${pid}" data-f="${f}">${esc(nomeFuncao(f))}</button>`);
  return `<div style="margin:8px 0 4px"><div class="meta" style="font-size:11px;font-weight:700">FUNÇÃO (toque para trocar · a meta segue a função)</div><div style="display:grid;grid-template-columns:repeat(${fr ? 4 : Math.min(3, bts.length)},1fr);gap:4px;margin-top:4px">${bts.join("")}</div></div>`;
}

/* ➕ adicionar membro à equipe do ranking (só funções do ranking) */
const FUNCOES_EQUIPE = {frentista_diesel:"Frentista Diesel", frentista_gasolina:"Frentista Gasolina", lubrificador:"Frentista Lubrificador", frentista_madrugada:"Frentista Madrugada", caixa:"Caixa", caixa_madrugada:"Caixa Madrugada", loja:"Loja"};
async function addMembro(b){
  const nome = (($("#novoMembro") || {}).value || "").trim(), f = ($("#novoMembroFuncao") || {}).value || "loja";
  if (!nome) return toast("Digite o nome.");
  if (acharPessoa(nome)) return toast("Esse nome já está na equipe.");
  const id = "p" + Date.now().toString(36), setor = {frentista_diesel:"diesel", frentista_gasolina:"gasolina", lubrificador:"lubrificador", frentista_madrugada:"madrugada"}[f] || "";
  const patch = {rkPessoas:{[id]:{nome, funcao:setor === "diesel" || setor === "gasolina" ? "frentista" : f, setor, chaves:[semAcento(nome).replace(/\s+/g, " ").trim()], x:0}}};
  b.disabled = true;
  if (await safe(() => S.db.doc("cfg/main").update(patch), nome + " adicionado.")) { S.cfg = deepMerge(S.cfg || {}, patch); render(); } else b.disabled = false;
}

/* ---------- grupos da equipe: cada um tem sua venda e sua meta ---------- */
const EQ_MAP = {frentista_diesel:{funcao:"frentista", setor:"diesel"}, frentista_gasolina:{funcao:"frentista", setor:"gasolina"}, lubrificador:{funcao:"lubrificador", setor:"lubrificador"}, frentista_madrugada:{funcao:"frentista_madrugada", setor:"madrugada"}};
function grupoOpcoes(){ return {frentista_diesel:"🛢️ Frentista Diesel", frentista_gasolina:"⛽ Frentista Gasolina", lubrificador:"🔧 Frentista Lubrificador", frentista_madrugada:"🌙 Frentista Madrugada", caixa:"💵 Caixa", caixa_madrugada:"🌙 Caixa Madrugada", loja:"🛒 Vendedor(a) Loja", ...Object.fromEntries(Object.entries(funcoesExtras()).map(([k, f]) => [k, f.nome])), frentista:"Frentista (sem grupo: vale o relatório)"}; }
function grupoKey(p){ const st = p && p.setor; if (st === "diesel") return "frentista_diesel"; if (st === "gasolina") return "frentista_gasolina"; if (st === "lubrificador") return "lubrificador"; if (st === "madrugada") return "frentista_madrugada"; return (p && p.funcao) || "loja"; }
function grupoParaFuncao(k){ return EQ_MAP[k] ? {...EQ_MAP[k]} : {funcao:k, setor:""}; }
function grupoDoTexto(t){
  const x = semAcento(t).toLowerCase();
  if (/madrug/.test(x)) return /caixa/.test(x) ? "caixa_madrugada" : "frentista_madrugada";
  if (/lubrif/.test(x)) return "lubrificador";
  if (/diesel/.test(x)) return "frentista_diesel";
  if (/gasol/.test(x)) return "frentista_gasolina";
  if (/caixa/.test(x)) return "caixa";
  if (/vended|loja/.test(x)) return "loja";
  return null;
}
/* acha a pessoa mesmo com pequena diferença (ex.: Edinilson x Ednilson) */
function parecido(a, b){
  if (a === b) return true; if (Math.abs(a.length - b.length) > 1 || a.length < 5) return false;
  let i = 0; while (i < a.length && a[i] === b[i]) i++;
  return a.slice(i + 1) === b.slice(i + 1) || a.slice(i + 1) === b.slice(i) || a.slice(i) === b.slice(i + 1);
}
function acharParecido(nome){
  const ja = acharPessoa(nome); if (ja) return ja;
  const tk = semAcento(nome).toLowerCase().split(/\s+/).filter(w => w.length > 2);
  let melhor = null, nota = 0;
  for (const [id, p] of Object.entries(pessoasRk())) {
    if (!p || p.x) continue;
    const tp = [...new Set([p.nome, ...(p.chaves || [])].join(" ").toLowerCase().split(/\s+/).map(w => semAcento(w)).filter(w => w.length > 2))];
    const n = tk.filter(w => tp.some(q => parecido(w, q))).length;
    const primeiro = [p.nome, ...(p.chaves || [])].some(x => parecido(semAcento(x).split(/\s+/)[0], tk[0] || ""));
    if (primeiro && n >= 2 && n >= Math.ceil(tk.length * 0.66) && n > nota) { nota = n; melhor = {id, ...p}; }
  }
  return melhor;
}
async function aplicarListaEquipe(b){
  const txt = (($("#listaEquipe") || {}).value || ""), patch = {}, erros = []; let novos = 0, i = 0;
  for (const parte of txt.split(/[\n,;]+/)) {
    const [nomeT, grupoT] = parte.split("="); if (!nomeT || !nomeT.trim()) continue;
    const nome = nomeT.trim().replace(/\s+/g, " "), k = grupoDoTexto(grupoT || "");
    if (!k) { erros.push(nome); continue; }
    const p = acharParecido(nome), chave = semAcento(nome).replace(/\s+/g, " ").trim();
    if (p) patch[p.id] = {...grupoParaFuncao(k), chaves:[...new Set([...(p.chaves || []), chave])], x:0};
    else { patch["p" + Date.now().toString(36) + (i++)] = {nome:nome.replace(/\b\p{L}/gu, c => c.toUpperCase()), chaves:[chave], x:0, ...grupoParaFuncao(k)}; novos++; }
  }
  if (!Object.keys(patch).length) return toast(erros.length ? "Grupo não reconhecido: " + erros.slice(0, 3).join(", ") : "Lista vazia.");
  b.disabled = true;
  if (await safe(() => S.db.doc("cfg/main").update({rkPessoas:patch}), `${Object.keys(patch).length} na equipe (${novos} novos)${erros.length ? " · sem grupo: " + erros.join(", ") : ""}`)) { S.cfg = deepMerge(S.cfg || {}, {rkPessoas:patch}); render(); } else b.disabled = false;
}

/* toque no grupo da pessoa (Equipe): salva na hora; quem veio só do relatório entra na equipe */
async function salvarGrupo(b){
  const id = b.dataset.id, k = b.dataset.g, p = pessoasRk()[id], nome = b.dataset.n || "";
  const dado = p ? {...grupoParaFuncao(k), x:0} : {nome, chaves:[semAcento(nome).replace(/\s+/g, " ").trim()], x:0, ...grupoParaFuncao(k)};
  b.disabled = true;
  if (await safe(() => S.db.doc("cfg/main").update({rkPessoas:{[id]:dado}}), (nome || (p && p.nome) || "") + " → " + (grupoOpcoes()[k] || k))) {
    S.cfg = deepMerge(S.cfg || {}, {rkPessoas:{[id]:dado}}); const y = window.scrollY; render(); window.scrollTo(0, y);
  } else b.disabled = false;
}
/* busca na Equipe: esconde quem não combina, sem redesenhar */
document.addEventListener("input", ev => { const t = ev.target; if (!t || t.id !== "eqBusca") return;
  const q = semAcento(t.value).trim(); let n = 0;
  document.querySelectorAll("[data-eq-row]").forEach(el => { const ok = !q || q.split(/\s+/).every(w => el.dataset.eqRow.includes(w)); el.hidden = !ok; if (ok) n++; });
  const nada = document.getElementById("eqNada"); if (nada) nada.hidden = n > 0;
  const nv = document.getElementById("novoMembro"); if (nv && !n) nv.value = t.value; });

/* ---------- uma linha por pessoa no mês (loja, diesel, gasolina e caixa) ----------
   se a mesma pessoa tiver mais de uma linha, vale a mais recente (t); sem data, a que está no grupo dela */
const DEDUP_TABS = ["loja", "diesel", "gasolina", "caixa"];
function grupoDaAba(k){ return {diesel:"frentista_diesel", gasolina:"frentista_gasolina", lubrificador:"lubrificador", madrugada:"frentista_madrugada", loja:"loja", caixa:"caixa", opcaixa:"caixa"}[k] || ""; }
/* aba onde ficam os números da pessoa, conforme o grupo dela */
function tabDestino(p, ck){
  if (ck === "opcaixa") return "opcaixa";
  const ativa = t => rkAbas().some(c => c.k === t), fr = (ck === "diesel" || ck === "gasolina") ? ck : (ativa("diesel") ? "diesel" : "gasolina");
  const g = grupoKey(p || {}), ex = funcoesExtras()[g];
  let t = g === "frentista_diesel" ? "diesel" : g === "frentista_gasolina" ? "gasolina" : (g === "lubrificador" || g === "frentista_madrugada" || g === "frentista") ? fr
    : (g === "caixa" || g === "caixa_madrugada") ? "caixa" : g === "loja" ? "loja" : ex ? (ex.grupo === "frentista" ? fr : ex.grupo === "caixa" ? "caixa" : "loja") : (RK.some(x => x.k === ck) ? ck : "loja");
  return ativa(t) ? t : (RK.some(x => x.k === ck) ? ck : rkAbas()[0].k);
}
function rkVencedores(){
  const k = S.rkMes + "|" + (S.vendasK || "") + "|" + JSON.stringify((S.cfg && S.cfg.rkPessoas) || {});
  if (S._rkVenc && S._rkVenc.k === k) return S._rkVenc.m;
  const d = (S.vendas || {})[S.rkMes] || {}, P = pessoasRk(), best = {};
  for (const tb of [...DEDUP_TABS, "frentista"]) for (const [id, v] of Object.entries(d[tb] || {})) {
    if (!v || v.x || !v.nome) continue;
    const pid = (v.pid && P[v.pid] && !P[v.pid].x) ? v.pid : ((acharPessoa(v.nome) || {}).id || "n:" + semAcento(v.nome).replace(/\s+/g, " ").trim());
    const tab = tb === "frentista" ? "diesel" : tb, n0 = num(v.t), n1 = (pid[0] !== "n" && tabDestino(P[pid], tab) === tab) ? 1 : 0, cur = best[pid];
    if (!cur || n0 > cur.n0 || (n0 === cur.n0 && n1 > cur.n1)) best[pid] = {tb, id, n0, n1};
  }
  const m = new Set(Object.values(best).map(x => x.tb + "/" + x.id)); S._rkVenc = {k, m}; return m;
}

/* ---------- 🧾 operações dos caixas dentro da aba Caixa: foto ou à mão; conta na meta de operações ---------- */
function cardOperacoes(){
  if (!rkAbas().some(c => c.k === "opcaixa")) return `<div class="card" style="font-size:12px;color:var(--muted)">🧾 Para lançar as <b>operações dos caixas</b>, ligue <b>Operações Caixa</b> em ⚙️ → Opções.</div>`;
  const l = vendasDoMes("opcaixa"), tot = l.reduce((a, r) => a + r.q, 0), m = metasGerais().operacoes;
  return `<div class="card"><div style="display:flex;justify-content:space-between;gap:8px;align-items:center;flex-wrap:wrap"><b>🧾 Operações dos caixas</b><span style="font-size:12px;color:var(--muted)">${fmtCampo("q", tot)}${m ? " de " + fmtCampo("q", m.valor) : ""}</span></div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-top:8px"><label class="btn brand" style="margin:0;cursor:pointer;text-align:center">📷 Ler foto das operações<input type="file" accept="image/*" data-rk-op="1" hidden></label><button class="btn" style="margin:0" data-act="novaOperacao">➕ Lançar à mão</button></div>
    <p style="font-size:11px;color:var(--muted);margin:6px 0 0">Cada caixa: quantidade de operações no mês. O valor novo substitui o anterior. Metas em ⚙️ → Metas (Operações Caixa).</p></div>`;
}
function opDaPessoa(r){
  if (S.rkTipo !== "caixa" || !r.pid || !rkAbas().some(c => c.k === "opcaixa")) return "";
  const l = vendasDoMes("opcaixa"), o = l.find(x => x.pid === r.pid), base = o || {...r, q:0, tab:"opcaixa"}, m = metaDaPessoa(base, "opcaixa", l), st = situacao(base, m);
  if (!o && !m) return "";
  return `<div class="meta" style="font-size:11px;margin-top:4px">🧾 Operações: <b>${fmtCampo("q", base.q)}</b>${m ? " · meta " + fmtCampo("q", m.valor) : ""}</div>${st ? barra(st, 6) : ""}`;
}
document.addEventListener("change", ev => { const t = ev.target; if (!t || !t.dataset || !t.dataset.rkOp) return;
  if (!S.admin) return toast("Área restrita ao administrador."); const f = t.files && t.files[0]; t.value = ""; importarImagem(f, "opcaixa"); });
