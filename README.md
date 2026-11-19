# Controle de Estoque — Posto & BR Park

App web (um único `index.html`) que lê e grava no Supabase, tabela `public.app_docs` (colunas `id`, `data`).

## Documentos usados
| id | conteúdo |
|---|---|
| `cfg/main` | `usuarios` (lista do campo "Selecione o seu nome"), `colaboradores`, `categorias`, `unidades`, `senha` |
| `prod/POSTO` | produtos do POSTO em `itens` |
| `prod/BRPARK` | produtos do BR PARK em `itens` |
| `foto/<código>` | fotos trocadas pelos usuários |
| `movs/<AAAA-MM>` | histórico de movimentações do mês |

O app não grava nada ao abrir e não lê dados de arquivos locais. As fotos padrão e as logos ficam em `dados/fotos` e `dados/logos`.

## Configuração
`supabase-config.js`: `url` (Project URL) e `anonKey` (Publishable key `sb_publishable_...` ou anon `eyJ...`).

## Como abrir no computador
Na pasta do projeto, no Terminal:

    python3 -m http.server 5500

e abra http://localhost:5500

## Publicar
Suba todos os arquivos da pasta em qualquer hospedagem estática com HTTPS (GitHub Pages, Netlify, Vercel, Cloudflare Pages).
