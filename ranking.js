// Ranking de vendas posto (carregado antes do app; usa as funções do index.html na hora do uso).
/* ---------- ranking de vendas posto: abas, funções, metas, equipe e fotos ---------- */
const RK = [
  {k:"loja", t:"Loja", ico:"🛒", p:"Vendedor", lt:false},
  {k:"diesel", t:"Frentista Diesel", ico:"🛢️", p:"Frentista", lt:true},
  {k:"gasolina", t:"Frentista Gasolina", ico:"⛽", p:"Frentista", lt:true},
  {k:"caixa", t:"Caixa", ico:"💵", p:"Caixa", lt:false},
  {k:"opcaixa", t:"Operações Caixa", ico:"🧾", p:"Operador", lt:false}
];
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
const campoPadrao = t => (t === "diesel" || t === "gasolina") ? "lt" : "mc";
const CAMPOS = {q:"Quantidade", mc:"Venda MC", lt:"Litragem"};
const rkCat = () => RK.find(c => c.k === S.rkTipo) || RK[0];
const rankingAtivo = () => !!(S.cfg && S.cfg.ranking);
const rkFotosAtivas = () => !!(S.cfg && S.cfg.rkFotos);
const moeda = v => num(v).toLocaleString("pt-BR", {minimumFractionDigits:2, maximumFractionDigits:2});
const fmt2 = v => num(v).toLocaleString("pt-BR", {minimumFractionDigits:2, maximumFractionDigits:2});
const fmtCampo = (campo, v) => campo === "mc" ? "R$ " + moeda(v) : campo === "lt" ? fmt2(v) + " L" : fmt2(v);
function proxMes(n){ const h = new Date(), d = new Date(h.getFullYear(), h.getMonth() + n, 1); return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0"); }
function rkMesAtual(){ const h = new Date(); return h.getFullYear() + "-" + String(h.getMonth() + 1).padStart(2, "0"); }
function rkLayout(){ return (S.cfg && S.cfg.rkLayout) || "cartoes"; }

/* equipe: cadastrada automaticamente na importação; o que o administrador muda não é trocado pelas próximas importações */
const pessoasRk = () => (S.cfg && S.cfg.rkPessoas) || {};
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
  const d = (S.vendas || {})[S.rkMes] || {}, o = {...(tipo === "diesel" ? (d.frentista || {}) : {}), ...(d[tipo] || {})}, P = pessoasRk();
  const arr = Object.entries(o).filter(([, v]) => v && !v.x && v.nome).map(([id, v]) => {
    const p = (v.pid && P[v.pid] && !P[v.pid].x) ? {id:v.pid, ...P[v.pid]} : acharPessoa(v.nome);
    return {id, pid:p ? p.id : null, nome:p ? p.nome : v.nome, funcao:funcaoDe(p, tipo), q:num(v.q), mc:num(v.mc), lt:num(v.lt)};
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
  const tem = g => g && (num(g.mc) > 0 || num(g.lt) > 0 || num(g.valor) > 0);
  const r = ultimoMes(d => { const g = ((d.metas2 || {})[tab] || {})[funcao]; if (tem(g)) return g;
    if (funcao === funcaoPadrao(tab)) { const a = (d.metas || {})[tab]; if (a && num(a.valor) > 0) return {campo:a.campo || "mc", modo:"pessoa", valor:a.valor}; } return null; });
  if (!r) return null;
  const v = r.v, antigo = k => v.campo === k ? num(v.valor) : 0, mc = num(v.mc) || antigo("mc"), lt = num(v.lt) || antigo("lt"), q = antigo("q");
  const campo = campoF || (lt > 0 ? "lt" : mc > 0 ? "mc" : "q"), valor = {mc, lt, q}[campo] || 0;
  if (!(valor > 0)) return null;
  return {campo, modo:v.modo || "pessoa", valor, mc, lt, herdada:r.mes !== S.rkMes};
}
function metaIndividual(tab, pid){
  if (!pid) return null;
  const r = ultimoMes(d => { const v = ((d.metasInd || {})[tab] || {})[pid]; return num(v) > 0 ? num(v) : null; });
  return r ? r.v : null;
}
/* meta de uma pessoa: a individual, se houver; senão a da função (por pessoa, ou o total dividido pela equipe) */
function metaDaPessoa(r, tab, lista, campoF){
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
function rkLogo(){
  if (RK_LOGO_URL !== null) return RK_LOGO_URL;
  RK_LOGO_URL = "";
  try { const d = (typeof LOGO !== "undefined" && LOGO.POSTO) || ""; if (d) { const [cab, b64] = d.split(","), bin = atob(b64), u = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i); RK_LOGO_URL = URL.createObjectURL(new Blob([u], {type:(cab.match(/data:([^;]+)/) || [])[1] || "image/png"})); } } catch (e) { RK_LOGO_URL = ""; }
  if (RK_LOGO_URL) { RK_LOGO_IMG = new Image(); RK_LOGO_IMG.src = RK_LOGO_URL; }
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
  S.rkMes = S.rkMes || rkMesAtual(); S.rkTipo = rkAbas().some(c => c.k === S.rkTipo) ? S.rkTipo : rkAbas()[0].k; S.rkOrdem = S.rkOrdem || "q";
  carregaFotosRk();
  const c = rkCat(), lista = vendasDoMes(c.k), med = ["🥇", "🥈", "🥉"], lay = rkLayout();
  const meses = [...new Set([rkMesAtual(), S.rkMes, ...Object.keys(S.vendas || {}).filter(m => /^\d{4}-\d{2}$/.test(m))])].sort().reverse();
  const ordens = [["q", "Quantidade"], ["mc", "Venda MC"], ...(c.lt ? [["lt", "Litragem"]] : [])];
  const linhas = lista.map(r => ({...r, meta:metaDaPessoa(r, c.k, lista)})).map(r => { const st = situacao(r, r.meta), mm = r.meta && r.meta.campo !== "mc" ? metaDaPessoa(r, c.k, lista, "mc") : null; return {...r, st, mcSt:situacao(r, mm), mcMeta:mm}; });
  // resumo por função: realizado x meta total (soma das metas de cada um)
  const resumo = funcoesDaAba(c.k).map(f => {
    const g = linhas.filter(r => r.funcao === f); if (!g.length) return "";
    const comMeta = g.filter(r => r.meta); if (!comMeta.length) return `<div style="margin-top:8px"><b>${nomeFuncao(f)}</b> <span class="meta">· ${g.length} pessoa(s) · sem meta</span></div>`;
    const campos = [comMeta[0].meta.campo]; if (campos[0] !== "mc" && g.some(r => metaDaPessoa(r, c.k, lista, "mc"))) campos.push("mc");
    const bat = comMeta.filter(r => r.st && r.st.bateu).length;
    const barras = campos.map(campo => { const ms = g.map(r => campo === campos[0] ? r.meta : metaDaPessoa(r, c.k, lista, campo)).filter(Boolean), metaTot = ms.reduce((a, m) => a + m.valor, 0), real = g.reduce((a, r) => a + r[campo], 0), st = situacao({[campo]:real}, {campo, valor:metaTot});
      return `<div class="meta" style="margin-top:4px">${campo === "lt" ? "⛽ Litragem" : campo === "mc" ? "🛒 Venda da loja (MC)" : CAMPOS[campo]}: ${fmtCampo(campo, real)} de ${fmtCampo(campo, metaTot)}</div>${barra(st, 8)}`; }).join("");
    return `<div style="margin-top:10px"><div style="display:flex;justify-content:space-between;gap:8px;flex-wrap:wrap"><b>${nomeFuncao(f)}</b><span class="meta">${bat} de ${g.length} bateram</span></div>${barras}</div>`;
  }).join("");
  const dq = rkDestaqueAtivo() ? destaqueDe(c.k) : null;
  const nomeL = r => `<button data-act="rkPessoa" data-id="${r.id}" style="all:unset;cursor:pointer;display:flex;gap:8px;align-items:center;min-width:0">${fotoPessoa(r, 34)}<span style="min-width:0"><b style="display:block">${esc(r.nome)}${dq && dq.r.pid && dq.r.pid === r.pid ? ` <span title="Primeiro a bater a meta">⭐</span>` : ""}</b><span class="meta" style="font-size:11px">${nomeFuncao(r.funcao)}${r.meta && r.meta.origem === "individual" ? " · meta individual" : ""}</span></span></button>`;
  const acoes = r => `<div style="display:flex;flex-direction:column;gap:4px"><button class="btn sm" style="padding:4px 8px;min-width:0;width:auto" data-act="cartaoPessoa" data-id="${r.id}" aria-label="Cartão individual">📤</button>${S.admin ? `<button class="btn sm" style="padding:4px 8px;min-width:0;width:auto" data-act="editarVenda" data-id="${r.id}" aria-label="Alterar">✏️</button><button class="btn sm" style="padding:4px 8px;min-width:0;width:auto;color:var(--crit)" data-act="excluirVenda" data-id="${r.id}" aria-label="Excluir">🗑️</button>` : ""}</div>`;
  let corpo = "";
  if (!linhas.length) corpo = `<p class="meta">Nenhum lançamento em ${c.t} · ${nomeMes(S.rkMes)}.${S.admin ? " Use 📷 (importar da imagem) ou ➕ (lançar à mão)." : ""}</p>`;
  else if (lay === "tabela") corpo = `<div style="overflow-x:auto"><table class="tbl"><tr><th>#</th><th>${c.p}</th><th class="n">Qtd.</th><th class="n">Venda MC</th>${c.lt ? `<th class="n">Litragem</th>` : ""}<th class="n">Meta</th><th class="n">%</th></tr>
      ${linhas.map((r, i) => `<tr><td>${med[i] || i + 1}</td><td><b data-act="rkPessoa" data-id="${r.id}" style="cursor:pointer">${esc(r.nome)}</b><br><span class="meta" style="font-size:11px">${nomeFuncao(r.funcao)}</span></td><td class="n">${fmt2(r.q)}</td><td class="n">${moeda(r.mc)}</td>${c.lt ? `<td class="n">${fmt2(r.lt)}</td>` : ""}<td class="n">${r.meta ? fmtCampo(r.meta.campo, r.meta.valor) : "—"}</td><td class="n" style="color:${r.st ? r.st.cor : "inherit"};font-weight:700">${r.st ? r.st.pct + "%" : "—"}</td></tr>`).join("")}</table></div>`;
  else if (lay === "grafico") corpo = linhas.map((r, i) => `<div style="padding:8px 0;border-bottom:1px solid var(--line)"><div style="display:flex;justify-content:space-between;gap:8px;align-items:center"><div style="display:flex;gap:6px;align-items:center;min-width:0"><span style="font-weight:800;min-width:24px">${med[i] || i + 1}</span>${nomeL(r)}</div><b style="white-space:nowrap">${r.meta ? fmtCampo(r.meta.campo, r[r.meta.campo]) : fmtCampo(S.rkOrdem, r[S.rkOrdem])}</b></div>${r.st ? barra(r.st, 14) : `<small class="meta">sem meta</small>`}</div>`).join("");
  else corpo = linhas.map((r, i) => `<div style="display:flex;gap:10px;align-items:flex-start;padding:10px 0;border-bottom:1px solid var(--line)">
        <div style="font-size:20px;min-width:28px;text-align:center;font-weight:800">${med[i] || i + 1}</div>
        <div style="flex:1;min-width:0">${nomeL(r)}
          <div class="meta" style="display:flex;flex-wrap:wrap;gap:4px 12px;margin-top:4px"><span>Qtd. <b>${fmt2(r.q)}</b></span><span>Venda MC <b>R$ ${moeda(r.mc)}</b></span>${c.lt ? `<span>Litragem <b>${fmt2(r.lt)} L</b></span>` : ""}${r.meta ? `<span>Meta <b>${fmtCampo(r.meta.campo, r.meta.valor)}</b></span>` : ""}</div>
          ${barra(r.st)}${r.mcSt ? `<div class="meta" style="font-size:11px;margin-top:4px">🛒 Venda da loja · meta R$ ${moeda(r.mcMeta.valor)}</div>${barra(r.mcSt, 6)}` : ""}</div>${acoes(r)}</div>`).join("");
  const total = k => lista.reduce((a, r) => a + r[k], 0);
  return `<div class="top"><button class="back" data-act="${S.admin ? "admin" : "home"}">Voltar</button><h1>Ranking de vendas posto</h1></div><div class="pad">
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px">
      <select id="rkTipoSel" class="inp" aria-label="Setor">${rkAbas().map(x => `<option value="${x.k}" ${x.k === c.k ? "selected" : ""}>${x.ico} ${x.t}</option>`).join("")}</select>
      <select id="rkMes" class="inp" aria-label="Mês">${meses.map(m => `<option value="${m}" ${m === S.rkMes ? "selected" : ""}>${MESES[Number(m.slice(5)) - 1].slice(0, 3)}/${m.slice(0, 4)}</option>`).join("")}</select></div>
    <div style="display:flex;gap:6px;margin-top:6px;align-items:center">
      <select id="rkOrdemSel" class="inp" aria-label="Ordenar" style="flex:1;min-width:0">${ordens.map(([k, t]) => `<option value="${k}" ${k === S.rkOrdem ? "selected" : ""}>↕ ${({q:"Qtd.", mc:"Venda MC", lt:"Litros"})[k] || t}</option>`).join("")}</select>
      ${S.admin ? `<button class="btn" style="width:auto;flex:none;padding:8px 11px;margin:0" data-act="rkCfg" title="Configurar metas" aria-label="Configurar">⚙️</button><label class="btn brand" style="width:auto;flex:none;padding:8px 11px;margin:0;cursor:pointer" title="Importar da imagem" aria-label="Importar">📷<input type="file" accept="image/*" data-rk-img="1" hidden></label><button class="btn" style="width:auto;flex:none;padding:8px 11px;margin:0" data-act="novaVenda" title="Lançar à mão" aria-label="Lançar">➕</button>` : ""}<button class="btn" style="width:auto;flex:none;padding:8px 11px;margin:0" data-act="rkBaixar" title="Baixar e enviar" aria-label="Baixar">⬇️</button></div>
    ${cardMetaGeral()}
    ${dq ? `<div class="card" style="border:1px solid #fbbf24"><h2>⭐ Destaque do mês · ${c.t}</h2><div style="display:flex;gap:10px;align-items:center;margin-top:6px">${fotoPessoa(dq.r, 46)}<div><b>${esc(dq.r.nome)}</b><br><span class="meta">Primeiro a bater a meta · ${new Date(dq.t).toLocaleDateString("pt-BR")}</span></div></div></div>` : ""}
    <details class="card"><summary style="cursor:pointer;font-weight:800">🎯 Metas por função · ${c.t}</summary>${resumo || `<p class="meta" style="margin:4px 0">Sem lançamentos neste mês.</p>`}</details>
    <div class="card">${corpo}${linhas.length ? `<div class="meta" style="display:flex;flex-wrap:wrap;gap:4px 12px;padding-top:10px"><b>Total</b><span>Qtd. <b>${fmt2(total("q"))}</b></span><span>Venda MC <b>R$ ${moeda(total("mc"))}</b></span>${c.lt ? `<span>Litragem <b>${fmt2(total("lt"))} L</b></span>` : ""}</div>` : ""}</div></div>`;
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
          <label class="meta" style="font-size:11px">🛒 Venda da loja (R$)<input class="inp" data-cat-mc="${n}" inputmode="decimal" placeholder="Ex.: 9.000,00" value="${g.mc ? esc(moeda(g.mc)) : ""}" style="padding:8px"></label>
          ${comLt ? `<label class="meta" style="font-size:11px">⛽ Litragem (L)<input class="inp" data-cat-lt="${n}" inputmode="decimal" placeholder="Ex.: 90.000" value="${g.lt ? esc(fmt2(g.lt)) : ""}" style="padding:8px"></label>` : ""}</div></div>`; }).join("")}
      ${salvar}</div>`).join("");
  return `<div class="card"><h2>🏪 Metas gerais do posto · ${nomeMes(S.rkMes)}</h2>
      <p style="margin:4px 0 0;font-size:12px;color:var(--muted);line-height:1.4">Vale desse mês em diante, até ser trocada. A Venda da Loja soma a Venda MC de todos (loja, caixa e frentistas).</p>
      ${rkAbas().some(c => c.lt) ? campoGeral("litros", "⛽ Litros no mês · todos os frentistas", mg.litros, fmt2, "Ex.: 900.000") : ""}
      ${campoGeral("loja", "🛒 Venda da Loja no mês (R$) · soma de todos", mg.loja, moeda, "Ex.: 129.000,00")}${salvar}</div>
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
    for (const [tab, f] of cat.alvos) (metas2[tab] = metas2[tab] || {})[f] = {modo, mc, lt, campo:"", valor:0};
  }
  b.disabled = true; await safe(() => gravaVendas({metaGeral:geral, metas2}), "Metas salvas."); b.disabled = false;
}
function vRkCfg(){
  S.rkMes = S.rkMes || rkMesAtual(); S.rkTipo = rkAbas().some(c => c.k === S.rkTipo) ? S.rkTipo : rkAbas()[0].k; S.rkCfgAba = S.rkCfgAba || "metas";
  carregaFotosRk();
  const c = rkCat(), aba = S.rkCfgAba, P = pessoasRk(), lista = vendasDoMes(c.k);
  const abas = [["metas", "🎯 Metas"], ["individual", "👤 Metas individuais"], ["equipe", "👥 Equipe"], ["opcoes", "⚙️ Opções"]];
  let corpo = "";
  const mg = metasGerais();
  if (aba === "metas") corpo = telaMetasSetores(mg);
  else if (aba === "individual") {
    const gente = [...new Map([...lista.map(r => [r.pid || r.nome, r]), ...Object.entries(P).filter(([, p]) => p && !p.x && funcoesDaAba(c.k).includes(p.funcao)).map(([id, p]) => [id, {pid:id, nome:p.nome, funcao:funcaoDe(p, c.k)}])]).values()].filter(r => r.pid);
    corpo = `<div class="card"><h2>Metas individuais · ${c.t} · ${nomeMes(S.rkMes)}</h2>
      <p class="meta" style="margin:4px 0 10px">Preencha só para quem tem meta diferente da função. Em branco: usa a meta da função. Medida: <b>${CAMPOS[(metaGrupo(c.k, funcaoPadrao(c.k)) || {}).campo || campoPadrao(c.k)]}</b>.</p>
      ${gente.length ? gente.map(r => `<div style="display:flex;gap:8px;align-items:center;padding:6px 0;border-bottom:1px solid var(--line)">${fotoPessoa(r, 30)}<div style="flex:1;min-width:0"><b>${esc(r.nome)}</b><br><span class="meta" style="font-size:11px">${nomeFuncao(r.funcao)}</span></div><input class="inp" style="max-width:140px" data-mi="${r.pid}" inputmode="decimal" placeholder="usa a da função" value="${metaIndividual(c.k, r.pid) ? esc(fmt2(metaIndividual(c.k, r.pid))) : ""}"></div>`).join("") : `<p class="meta">Ninguém cadastrado nesta aba ainda. Importe uma imagem ou lance à mão primeiro.</p>`}
      ${gente.length ? `<button class="btn pri" style="margin-top:12px" data-act="salvarMetasInd">Salvar metas individuais</button>` : ""}</div>`;
  }
  else if (aba === "equipe") {
    const gente = Object.entries(P).filter(([, p]) => p && !p.x).sort((a, b) => a[1].nome.localeCompare(b[1].nome, "pt-BR"));
    corpo = `<div class="card"><h2>Equipe do ranking</h2>
      <p class="meta" style="margin:4px 0 10px">Cadastrada automaticamente na primeira importação. Escolha a função de cada um (ex.: quem é <b>Frentista Madrugada</b>, <b>Lubrificador</b> ou <b>Caixa Madrugada</b>). As próximas importações não mudam o que você salvar aqui.</p>
      ${gente.length ? gente.map(([id, p]) => `<div style="border:1px solid var(--line);border-radius:12px;padding:8px;margin-top:8px"><div style="display:flex;gap:8px;align-items:center">${fotoPessoa({pid:id, nome:p.nome}, 40)}<input class="inp" data-eq-nome="${id}" value="${esc(p.nome)}" style="flex:1"></div>
        <div class="row" style="flex-wrap:wrap;margin-top:6px;align-items:center"><select class="inp" data-eq-funcao="${id}" style="flex:1 1 180px">${Object.entries(funcoesTodas()).map(([k, t]) => `<option value="${k}" ${p.funcao === k ? "selected" : ""}>${t}</option>`).join("")}</select>
        ${rkFotosAtivas() ? `<label class="btn" style="width:auto;margin:0;cursor:pointer;padding:8px 10px">📷 Foto<input type="file" accept="image/*" data-rk-foto="${id}" hidden></label>${(S.rkFotos || {})[id] ? `<button class="btn" style="width:auto;margin:0;padding:8px 10px" data-act="tirarFotoPessoa" data-id="${id}">Tirar foto</button>` : ""}` : ""}
        ${["frentista", "frentista_madrugada", "caixa", "caixa_madrugada"].includes(p.funcao) ? `<button class="btn" style="width:auto;margin:0;padding:8px 10px" data-act="rkMadrugada" data-id="${id}">${/madrugada/.test(p.funcao) ? "☀️ Tirar da madrugada" : "🌙 Mudar p/ madrugada"}</button>` : ""}
        <button class="btn" style="width:auto;margin:0;padding:8px 10px;color:var(--crit)" data-act="removerPessoa" data-id="${id}">🗑️</button></div></div>`).join("") : `<p class="meta">Ninguém cadastrado ainda. Importe a primeira imagem no ranking.</p>`}
      ${gente.length ? `<button class="btn pri" style="margin-top:12px" data-act="salvarEquipe">Salvar equipe</button>` : ""}
      <hr style="border:0;border-top:1px solid var(--line);margin:14px 0">
      <label class="f" for="eqNovo">Cadastrar pessoa à mão<input id="eqNovo" class="inp" placeholder="Nome completo"></label>
      <select id="eqNovaFuncao" class="inp" style="margin-top:6px">${Object.entries(funcoesTodas()).map(([k, t]) => `<option value="${k}">${t}</option>`).join("")}</select>
      <button class="btn brand" style="margin-top:8px" data-act="novaPessoa">➕ Cadastrar</button></div>
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
    patch[id] = {nome, funcao:f, chaves};
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
function shVenda(id){
  const c = rkCat(), o = ((S.vendas || {})[S.rkMes] || {}), v = id ? ((o[c.k] || {})[id] || (c.k === "diesel" ? (o.frentista || {})[id] : null) || {}) : {};
  const nomes = [...new Set([...Object.values(pessoasRk()).filter(p => p && !p.x).map(p => p.nome), ...(cfg().colaboradores || []), ...(cfg().usuarios || [])])].sort();
  openSheet(`<h2>${id ? "Alterar" : "Lançar"} · ${c.t}</h2>
    <label class="f" for="vNome">${c.p}<input id="vNome" class="inp" list="vNomes" value="${esc(v.nome || "")}" autofocus></label><datalist id="vNomes">${nomes.map(n => `<option value="${esc(n)}">`).join("")}</datalist>
    <div class="row"><label class="f" for="vQ" style="flex:1">Quantidade<input id="vQ" class="inp" inputmode="decimal" value="${v.q != null ? esc(fmt2(v.q)) : ""}"></label>
    <label class="f" for="vMc" style="flex:1">Venda MC<input id="vMc" class="inp" inputmode="decimal" value="${v.mc != null ? esc(moeda(v.mc)) : ""}"></label>
    ${c.lt ? `<label class="f" for="vLt" style="flex:1">Litragem<input id="vLt" class="inp" inputmode="decimal" value="${v.lt != null ? esc(fmt2(v.lt)) : ""}"></label>` : ""}</div>
    <div id="err" class="note crit" hidden></div>
    <div class="row"><button class="btn" data-act="fechar">Cancelar</button><button class="btn pri" data-act="salvarVenda" data-id="${id || ""}">Salvar</button></div>`);
}
async function salvarVenda(b){
  const c = rkCat(), nome = $("#vNome").value.trim(), q = parse($("#vQ").value), mc = parse($("#vMc").value), lt = c.lt ? parse($("#vLt").value) : 0, e = $("#err");
  const fail = t => { e.textContent = t; e.hidden = false; };
  if (!nome) return fail("Digite o nome.");
  if (!(q >= 0)) return fail("Quantidade inválida."); if (!(mc >= 0)) return fail("Venda MC inválida."); if (c.lt && !(lt >= 0)) return fail("Litragem inválida.");
  b.disabled = true;
  const ok = await safe(async () => {
    const ids = await registrarPessoas([nome], c.k), pid = ids[nome];
    let id = b.dataset.id;
    if (!id) { const ja = vendasDoMes(c.k).find(r => (pid && r.pid === pid) || semAcento(r.nome) === semAcento(nome)); id = ja ? ja.id : "v" + Date.now().toString(36); }
    await gravaVendas({[c.k]:{[id]:c.lt ? {nome, pid, q, mc, lt, x:0} : {nome, pid, q, mc, x:0}}});
  }, "Lançamento salvo.");
  if (ok) closeSheet(); else b.disabled = false;
}
function baixarRanking(b, tipo){
  const c = rkCat(), lista = vendasDoMes(c.k), linhas = lista.map(r => { const m = metaDaPessoa(r, c.k, lista); return {...r, m, st:situacao(r, m)}; });
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
  const c = rkCat(), lista = vendasDoMes(c.k), r = lista.find(x => x.id === id); if (!r) return;
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
function fundoCartao(g, W, H){
  const gr = g.createLinearGradient(0, 0, W, H); gr.addColorStop(0, "#071226"); gr.addColorStop(0.55, "#0b2a4a"); gr.addColorStop(1, "#0b7285"); g.fillStyle = gr; g.fillRect(0, 0, W, H);
  g.globalAlpha = 0.08; g.fillStyle = "#22d3ee"; for (let i = 0; i < 9; i++) { g.beginPath(); g.arc(W * (i % 3) / 2, 180 + i * 140, 220, 0, Math.PI * 2); g.fill(); } g.globalAlpha = 1;
  rkLogo(); if (RK_LOGO_IMG && RK_LOGO_IMG.complete && RK_LOGO_IMG.naturalWidth) { const h = 64, w = h * RK_LOGO_IMG.naturalWidth / RK_LOGO_IMG.naturalHeight; g.drawImage(RK_LOGO_IMG, 40, 40, w, h); }
  g.fillStyle = "#22d3ee"; g.font = "bold 30px Arial"; g.textAlign = "center"; g.fillText("RANKING DE VENDAS POSTO", W / 2, 88);
  g.fillStyle = "rgba(255,255,255,.75)"; g.font = "26px Arial"; g.fillText((S.nomeFilial || "") + " · " + nomeMes(S.rkMes), W / 2, 130);
  g.fillStyle = "rgba(255,255,255,.55)"; g.font = "22px Arial"; g.fillText("Desenvolvido por Luís Ricardo Menezes · Aldo Porto Franco", W / 2, H - 40); g.textAlign = "left";
}
function cortaCentro(g, t, w){ return cortaTexto(g, t, w); }
async function cartaoPessoa(id, b){
  const c = rkCat(), lista = vendasDoMes(c.k), r = lista.find(x => x.id === id); if (!r) return;
  if (b) b.disabled = true;
  try {
    const meta = metaDaPessoa(r, c.k, lista), st = situacao(r, meta), pos = lista.indexOf(r) + 1, dq = rkDestaqueAtivo() && destaqueDe(c.k), destaque = dq && dq.r.pid === r.pid;
    const W = 1080, H = 1350, cv = document.createElement("canvas"); cv.width = W; cv.height = H; const g = cv.getContext("2d");
    fundoCartao(g, W, H);
    const cx = W / 2, cy = 390, R = 170, pct = st ? st.pct : 0, cor = st ? (st.bateu ? "#34d399" : pct >= 70 ? "#fbbf24" : "#f87171") : "#22d3ee";
    g.lineWidth = 26; g.strokeStyle = "rgba(255,255,255,.14)"; g.beginPath(); g.arc(cx, cy, R + 30, 0, Math.PI * 2); g.stroke();
    if (st) { g.strokeStyle = cor; g.lineCap = "round"; g.beginPath(); g.arc(cx, cy, R + 30, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * Math.min(1, pct / 100)); g.stroke(); g.lineCap = "butt"; }
    const foto = await carregaImg(rkFotosAtivas() && r.pid ? (S.rkFotos || {})[r.pid] : null);
    g.save(); g.beginPath(); g.arc(cx, cy, R, 0, Math.PI * 2); g.clip();
    if (foto) { const l = Math.min(foto.width, foto.height); g.drawImage(foto, (foto.width - l) / 2, (foto.height - l) / 2, l, l, cx - R, cy - R, R * 2, R * 2); }
    else { g.fillStyle = "#13325a"; g.fillRect(cx - R, cy - R, R * 2, R * 2); g.fillStyle = "#e6eef9"; g.font = "bold 130px Arial"; g.textAlign = "center"; g.fillText(r.nome.split(" ").filter(Boolean).map(x => x[0]).slice(0, 2).join("").toUpperCase(), cx, cy + 46); g.textAlign = "left"; }
    g.restore();
    rr(g, cx - 70, cy + R + 2, 140, 64, 32); g.fillStyle = pos <= 3 ? ["#fbbf24", "#cbd5e1", "#d97706"][pos - 1] : "#22d3ee"; g.fill();
    g.fillStyle = "#071226"; g.font = "bold 40px Arial"; g.textAlign = "center"; g.fillText(pos + "º", cx, cy + R + 48);
    g.fillStyle = "#ffffff"; g.font = "bold 56px Arial"; g.fillText(cortaCentro(g, r.nome, W - 120), cx, 720);
    g.fillStyle = "rgba(255,255,255,.75)"; g.font = "30px Arial"; g.fillText(nomeFuncao(r.funcao) + " · " + c.t + " · " + pos + "º de " + lista.length, cx, 770);
    if (destaque) { rr(g, cx - 300, 800, 600, 64, 32); g.fillStyle = "#fbbf24"; g.fill(); g.fillStyle = "#071226"; g.font = "bold 30px Arial"; g.fillText("⭐ DESTAQUE: 1º A BATER A META", cx, 843); }
    const yb = destaque ? 930 : 860;
    if (st) {
      g.fillStyle = cor; g.font = "bold 92px Arial"; g.fillText(pct + "%", cx, yb + 70);
      g.fillStyle = "#ffffff"; g.font = "bold 32px Arial"; g.fillText(st.bateu ? "META BATIDA! Passou " + fmtCampo(meta.campo, Math.abs(r[meta.campo] - meta.valor)) : "Faltam " + fmtCampo(meta.campo, meta.valor - r[meta.campo]) + " para a meta", cx, yb + 122);
      rr(g, 90, yb + 150, W - 180, 30, 15); g.fillStyle = "rgba(255,255,255,.15)"; g.fill();
      rr(g, 90, yb + 150, Math.max(30, (W - 180) * Math.min(1, pct / 100)), 30, 15); g.fillStyle = cor; g.fill();
    } else { g.fillStyle = "rgba(255,255,255,.8)"; g.font = "30px Arial"; g.fillText("Sem meta definida neste mês", cx, yb + 80); }
    const stats = [["Quantidade", fmt2(r.q)], ["Venda MC", "R$ " + moeda(r.mc)], ...(c.lt ? [["Litragem", fmt2(r.lt) + " L"]] : []), ...(meta ? [["Meta", fmtCampo(meta.campo, meta.valor)]] : [])];
    const bw = (W - 180 - (stats.length - 1) * 16) / stats.length, ys = yb + 210;
    stats.forEach(([t, v], i) => { const x = 90 + i * (bw + 16); rr(g, x, ys, bw, 110, 18); g.fillStyle = "rgba(255,255,255,.10)"; g.fill(); g.fillStyle = "rgba(255,255,255,.7)"; g.font = "22px Arial"; g.fillText(t, x + bw / 2, ys + 40); g.fillStyle = "#ffffff"; g.font = "bold 28px Arial"; g.fillText(cortaCentro(g, v, bw - 16), x + bw / 2, ys + 82); });
    g.textAlign = "left";
    await compartilharOuBaixar(await jpegDe(cv), ("Meta - " + r.nome + " - " + S.rkMes).replace(/[^\wÀ-ÿ -]+/g, " ").trim() + ".jpg");
  } catch (e) { console.error("Cartão:", e); toast("Não foi possível gerar o cartão."); }
  if (b) b.disabled = false;
}
async function cartaoGeral(b){
  if (b) b.disabled = true;
  try {
    const gr = resumoGeral(), linhas = [];
    if (rkAbas().some(c => c.lt)) linhas.push(["⛽ LITROS · FRENTISTAS", "lt", gr.litros, gr.m.litros]);
    linhas.push(["🛒 VENDA DA LOJA · TODOS OS SETORES", "mc", gr.total, gr.m.loja]);
    const W = 1080, H = 640 + linhas.length * 230 + gr.partes.length * 70, cv = document.createElement("canvas"); cv.width = W; cv.height = H; const g = cv.getContext("2d");
    fundoCartao(g, W, H); g.textAlign = "center";
    g.fillStyle = "#ffffff"; g.font = "bold 58px Arial"; g.fillText("METAS GERAIS DO POSTO", W / 2, 220);
    let y = 300;
    for (const [tit, campo, real, meta] of linhas) {
      const st = meta ? situacao({[campo]:real}, {campo, valor:meta.valor}) : null, pj = meta ? projecao(real, meta.valor) : null, cor = st ? (st.bateu ? "#34d399" : st.pct >= 70 ? "#fbbf24" : "#f87171") : "#22d3ee";
      rr(g, 70, y, W - 140, 200, 26); g.fillStyle = "rgba(255,255,255,.09)"; g.fill();
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
    await compartilharOuBaixar(await jpegDe(cv), ("Metas gerais - " + (S.nomeFilial || "posto") + " - " + S.rkMes).replace(/[^\wÀ-ÿ -]+/g, " ").trim() + ".jpg");
  } catch (e) { console.error("Cartão geral:", e); toast("Não foi possível gerar o cartão."); }
  if (b) b.disabled = false;
}

/* ---------- metas gerais do posto: litros (frentistas), venda da loja e venda MC total, com projeção pelo dia do mês ---------- */
function metasGerais(){
  const pega = k => { const x = ultimoMes(d => d.metaGeral && num(d.metaGeral[k]) > 0 ? num(d.metaGeral[k]) : null); return x ? {valor:x.v, herdada:x.mes !== S.rkMes} : null; };
  const loja = pega("loja") || pega("valor");
  return {litros:pega("litros"), loja, mc:loja, mcDiesel:pega("mcDiesel"), mcGasolina:pega("mcGasolina"), mcCaixa:pega("mcCaixa"), mcOpcaixa:pega("mcOpcaixa")};
}
function metaGeral(){ return metasGerais().mc; }
function projecao(real, meta){
  if (S.rkMes !== rkMesAtual() || !(meta > 0)) return null;
  const h = new Date(), dia = h.getDate(), dias = new Date(h.getFullYear(), h.getMonth() + 1, 0).getDate(), proj = real / dia * dias, resta = Math.max(0, dias - dia);
  return {proj, pct:Math.floor(proj / meta * 100), porDia:resta ? Math.max(0, meta - real) / resta : 0, resta, dia, dias};
}
function resumoGeral(){
  const partes = rkAbas().map(c => { const l = vendasDoMes(c.k); return {c, mc:l.reduce((a, r) => a + r.mc, 0), lt:c.lt ? l.reduce((a, r) => a + r.lt, 0) : 0, metaMc:l.reduce((a, r) => a + ((metaMcDaPessoa(r, c.k, l) || {}).valor || 0), 0)}; });
  const total = partes.reduce((a, p) => a + p.mc, 0), litros = partes.reduce((a, p) => a + p.lt, 0), m = metasGerais();
  return {partes, total, litros, loja:total, m, meta:m.loja, st:m.loja ? situacao({mc:total}, {campo:"mc", valor:m.loja.valor}) : null};
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
      ${tileMeta("🛒", "Venda da Loja (todos)", "mc", g.total, g.m.loja)}</div>
    <details style="margin-top:8px"><summary class="meta" style="cursor:pointer;font-weight:700">📊 Venda MC por setor</summary>${graficoSetores(g.partes)}</details></div>`;
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
    <button class="btn" data-act="cartaoGeral">🏪 Cartão das metas gerais (JPG)</button>
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
    const c = rkCat(), lista = vendasDoMes(c.k), campo = c.lt ? "lt" : "mc", dq = rkDestaqueAtivo() ? destaqueDe(c.k) : null;
    const linhas = lista.map(r => { const m = metaDaPessoa(r, c.k, lista); return {...r, m, st:situacao(r, m)}; }).slice(0, 30);
    const W = 1080, H = 1060 + Math.max(0, linhas.length - 3) * 112, cv = document.createElement("canvas"); cv.width = W; cv.height = H; const g = cv.getContext("2d");
    fundoCartao(g, W, H); g.textAlign = "center";
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
      const r = linhas[i]; rr(g, 70, y, W - 140, 96, 20); g.fillStyle = "rgba(255,255,255,.09)"; g.fill();
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
    await compartilharOuBaixar(await jpegDe(cv), ("Ranking " + c.t + " - " + S.rkMes).replace(/[^\wÀ-ÿ -]+/g, " ").trim() + ".jpg");
  } catch (e) { console.error("Imagem do ranking:", e); toast("Não foi possível gerar a imagem."); }
  if (b) b.disabled = false;
}

/* ---------- ações do ranking tratadas aqui (o index.html só repassa) ---------- */
async function rkAcao(a, b){
  if (a === "rkBaixar") { shBaixarRanking(); return true; }
  if (a === "salvarMetasSetores") { if (!S.admin) { toast("Área restrita ao administrador."); return true; } salvarMetasSetores(b); return true; }
  if (a === "baixarRkImagem") { cartaoRanking(b); return true; }
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
function linhasDoTexto(txt){
  const out = [];
  for (const bruto of String(txt).split(/\n+/)) {
    const l = bruto.replace(/[|]/g, " ").replace(/(\d)[:;](\d)/g, "$1.$2").replace(/\.,/g, ",").replace(/\s+/g, " ").trim();
    const nums = l.match(/\d{1,3}(?:\.\d{3})+,\d{2}|\d+,\d{2}/g) || [];
    if (nums.length < 2) continue;
    const nome = l.slice(0, l.search(/\d/)).replace(/R\$|RS\b/gi, " ").replace(/[^A-Za-zÀ-ÿ' .-]/g, " ").replace(/\s+/g, " ").trim();
    if (nome.replace(/[^A-Za-zÀ-ÿ]/g, "").length < 3 || /vendedor|quantidade|venda mc|litragem/i.test(nome)) continue;
    out.push({nome, v:nums.map(n => parse(n))});
  }
  return out;
}
async function importarImagem(arq){
  if (!arq) return;
  const c = rkCat();
  openSheet(`<h2>Lendo a imagem…</h2><p class="meta">Na primeira vez, o leitor é baixado (alguns segundos). Depois é rápido.</p>`);
  try {
    const T = await carregaLeitor();
    const url = await new Promise((ok, erro) => { const r = new FileReader(); r.onload = () => ok(r.result); r.onerror = erro; r.readAsDataURL(arq); });
    const img = await new Promise((ok, erro) => { const i = new Image(); i.onload = () => ok(i); i.onerror = erro; i.src = url; });
    const w = await T.createWorker("por"), leituras = [];
    try { for (const [larg, lim] of [[1800, 160], [2000, 130], [2400, 170]]) { const {data} = await w.recognize(await prepImagem(img, larg, lim)); leituras.push(linhasDoTexto(data.text)); } }
    finally { await w.terminate(); }
    // junta as 3 leituras: fica o valor que mais se repete; se elas não concordam, a linha fica marcada para conferir
    const base = leituras.reduce((a, b) => b.length > a.length ? b : a, []), rows = [];
    base.forEach((r, i) => {
      const iguais = leituras.map(L => L.find(x => semAcento(x.nome) === semAcento(r.nome)) || L[i]).filter(Boolean);
      const campos = [0, 1, 2].map(k => { const vs = iguais.map(x => x.v[k]).filter(v => v != null && !isNaN(v)); if (!vs.length) return {v:undefined, ok:true}; const cont = {}; vs.forEach(v => cont[v] = (cont[v] || 0) + 1); const [v, n] = Object.entries(cont).sort((a, b) => b[1] - a[1])[0]; return {v:Number(v), ok:n === vs.length}; });
      const p = acharPessoa(r.nome);
      rows.push({nome:r.nome, cad:p ? p.nome : null, q:campos[0].v, mc:campos[1].v, lt:c.lt ? campos[2].v : undefined, conferir:!campos.slice(0, c.lt ? 3 : 2).every(x => x.ok)});
    });
    S.importa = rows;
    if (!rows.length) { openSheet(`<h2>Nada encontrado</h2><p class="meta">Não achei linhas com nome e números. Use uma foto ou print nítido da tabela, sem cortes, e tente de novo.</p><button class="btn" data-act="fechar">Fechar</button>`); return; }
    const novos = rows.filter(r => !r.cad).length;
    const inp = (i, k, v, fmtv) => `<input class="inp" data-imp="${i}" data-k="${k}" inputmode="decimal" value="${v == null ? "" : esc(fmtv(v))}" style="padding:6px 8px;min-width:80px">`;
    openSheet(`<h2>Conferir importação · ${c.t}</h2>
      <p class="meta" style="margin:0 0 8px">Confira os valores lidos. Linhas em <b style="color:var(--warn)">amarelo</b> tiveram leituras diferentes: confira com a imagem. Desmarque o que não quiser lançar.${novos ? ` <b>${novos} nome(s) novo(s)</b> serão cadastrados na equipe.` : ""}</p>
      <div style="overflow-x:auto"><table class="tbl"><tr><th></th><th>${c.p}</th><th class="n">Qtd.</th><th class="n">Venda MC</th>${c.lt ? `<th class="n">Litragem</th>` : ""}</tr>
      ${rows.map((r, i) => `<tr style="${r.conferir ? "background:var(--warn-bg)" : ""}"><td><input type="checkbox" data-imp-ok="${i}" checked></td><td><input class="inp" data-imp="${i}" data-k="nome" value="${esc(r.nome)}" style="padding:6px 8px;min-width:150px">${r.cad ? `<br><span class="meta" style="font-size:11px">cadastrado: ${esc(r.cad)}</span>` : `<br><span class="meta" style="font-size:11px;color:var(--cyan)">novo na equipe</span>`}</td><td>${inp(i, "q", r.q, fmt2)}</td><td>${inp(i, "mc", r.mc, moeda)}</td>${c.lt ? `<td>${inp(i, "lt", r.lt, fmt2)}</td>` : ""}</tr>`).join("")}</table></div>
      <p class="meta">Mês: <b>${S.rkMes.split("-").reverse().join("/")}</b>. Quem já existe no mês é atualizado; os novos são adicionados.</p>
      <div class="row"><button class="btn" data-act="fechar">Cancelar</button><button class="btn pri" data-act="confirmarImport">Lançar ${rows.length}</button></div>`);
  } catch (e) { console.error("Importar imagem:", e); openSheet(`<h2>Não foi possível ler</h2><p class="meta">${esc(e.message || "Erro ao ler a imagem.")}</p><button class="btn" data-act="fechar">Fechar</button>`); }
}
async function confirmarImport(b){
  const c = rkCat(), lidos = []; let erro = "";
  (S.importa || []).forEach((r, i) => {
    if (!(document.querySelector(`[data-imp-ok="${i}"]`) || {}).checked) return;
    const val = k => (document.querySelector(`[data-imp="${i}"][data-k="${k}"]`) || {}).value;
    const nome = String(val("nome") || "").trim(), q = parse(val("q")), mc = parse(val("mc")), lt = c.lt ? parse(val("lt")) : 0;
    if (!nome || !(q >= 0) || !(mc >= 0) || (c.lt && !(lt >= 0))) { erro = erro || "Confira a linha " + (i + 1) + ": nome ou número inválido."; return; }
    lidos.push({nome, q, mc, lt});
  });
  if (erro) return toast(erro);
  if (!lidos.length) return toast("Nenhuma linha marcada.");
  b.disabled = true;
  const ok = await safe(async () => {
    const ids = await registrarPessoas(lidos.map(r => r.nome), c.k), existentes = vendasDoMes(c.k), patch = {};
    lidos.forEach((r, i) => {
      const pid = ids[r.nome], P = pessoasRk()[pid] || {}, nomeCad = P.nome || r.nome;
      const ja = existentes.find(x => (pid && x.pid === pid) || semAcento(x.nome) === semAcento(r.nome)), id = ja ? ja.id : "v" + Date.now().toString(36) + i;
      patch[id] = c.lt ? {nome:nomeCad, pid, q:r.q, mc:r.mc, lt:r.lt, x:0} : {nome:nomeCad, pid, q:r.q, mc:r.mc, x:0};
    });
    await gravaVendas({[c.k]:patch});
  }, lidos.length + " lançamento(s) importado(s).");
  if (ok) { S.importa = null; closeSheet(); } else b.disabled = false;
}


/* seletores compactos do topo do ranking */
document.addEventListener("change", ev => { const t = ev.target; if (!t) return;
  if (t.id === "rkTipoSel") { S.rkTipo = t.value; render(); } else if (t.id === "rkOrdemSel") { S.rkOrdem = t.value; render(); } });
/* carrega o logo do Aldo já na abertura, para as imagens saírem com ele */
try { rkLogo(); } catch (e) {}
