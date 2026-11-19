# Controle de Estoque — Posto & BR Park

App web (um único `index.html`) com login. Lê e grava no Supabase, tabela `public.app_docs` (colunas `id`, `data`), e controla o acesso por usuário.

## Perfis
| Quem | Como entra | O que faz |
|---|---|---|
| Administrador (Ricardo) | e-mail `portofranconline@hotmail.com` + senha | tudo: retirada, entrada, cadastro, edição, fotos, configurações, criar e redefinir logins |
| Operador (Kaliel, Rayssa, Raiane, Célio, Inácio) | login (ex.: `Kaliel`) + senha criada pelo administrador | retirada e consulta; troca a própria senha |

Os logins de operador viram e-mails internos (`kaliel@estoque.local`), que nunca aparecem nem recebem mensagens.

## Documentos usados
| id | conteúdo |
|---|---|
| `cfg/main` | `usuarios`, `colaboradores`, `categorias`, `unidades` (e `senha`/`senhaHash`, legados, não usados mais) |
| `prod/POSTO` | produtos do POSTO em `itens` |
| `prod/BRPARK` | produtos do BR PARK em `itens` |
| `foto/<código>` | fotos trocadas pelo administrador |
| `movs/<AAAA-MM>` | histórico de movimentações do mês |

As fotos padrão e as logos ficam em `dados/fotos` e `dados/logos`.

## Configuração por unidade
O mesmo site serve todas as unidades. Cada aparelho informa, na primeira abertura, a **Project URL** e a **Publishable key** do banco da sua unidade. Isso fica salvo só naquele aparelho (botão **Trocar banco de dados** na tela de login muda).

`supabase-config.js` fica vazio de propósito, para nenhuma unidade cair no banco de outra.

## Instalar uma unidade nova
1. Crie um projeto novo no Supabase (plano gratuito serve).
2. No app, tela de configuração, toque em **📋 Copiar SQL de instalação**. No SQL Editor do projeto, cole e clique em **Run**. (O mesmo SQL está em `sql/instalacao-nova-unidade.sql`.)
3. No **Data API** e **API Keys** do projeto, copie a Project URL e a Publishable key.
4. Cole no app, toque em **Salvar e conectar** e crie o administrador (nome, e-mail e senha).
5. Como administrador, crie os logins dos operadores em **Administração → Usuários → Logins de acesso**.
6. Cadastre os produtos em **Administração → Cadastrar item**.

Posto Franco já tem o banco pronto: só informe a URL e a chave no aparelho.

## Banco de dados
- `instalacao-nova-unidade.sql`: tudo de uma vez (tabela, funções de login e bloqueio). Use em projeto novo.
- Posto Franco (já instalado e com dados): `01-preparar-logins.sql` foi rodado antes do `02-bloquear-acesso.sql` para liberar o login de cada um. Se precisar desfazer o bloqueio: `03-desfazer-bloqueio.sql`.

## Uso diário
- **Retirar:** escolha Posto ou BR Park, pesquise o produto e toque em Retirar. O nome de quem está logado aparece em "Operando".
- **Trocar a própria senha:** tela inicial → 🔑 Trocar minha senha.
- **Sair:** tela inicial → 🚪 Sair.
- **Redefinir senha de operador:** Administração → Usuários → Logins de acesso.

## Como abrir no computador
Na pasta do projeto, no Terminal:

    python3 -m http.server 5500

e abra http://localhost:5500

## Publicar
Suba os arquivos na hospedagem estática com HTTPS (GitHub Pages atual). Inclua a pasta `sql/` para guardar os scripts junto com o app.
