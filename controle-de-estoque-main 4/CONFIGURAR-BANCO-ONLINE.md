# Banco online — Controle de Estoque

## 1. Criar o banco
1. Crie um projeto no Supabase.
2. Abra o SQL Editor.
3. Cole o conteúdo de `supabase.sql` e execute.

## 2. Configurar o aplicativo
Abra `supabase-config.js` e informe:
- `url`: Project URL do Supabase
- `anonKey`: chave pública `anon`

## 3. Publicar
Suba a pasta no GitHub e publique em Vercel, Netlify ou Cloudflare Pages.

## 4. Primeira execução
O aplicativo cria automaticamente os documentos `cfg/main`, `prod/POSTO` e `prod/BRPARK` usando os JSON que acompanham o projeto.

## Observação de segurança
Esta primeira integração mantém a autenticação administrativa existente do aplicativo. A chave `anon` do Supabase é pública por natureza. Para um ambiente com muitos usuários ou acesso externo, recomenda-se a próxima etapa com Supabase Auth + RLS por usuário/perfil.
