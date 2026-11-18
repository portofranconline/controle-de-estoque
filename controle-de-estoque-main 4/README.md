# Controle de Estoque — Posto & BR Park

App web de uma página para controlar o estoque de materiais (limpeza, escritório, copa/cozinha) de dois locais: **POSTO (ALDO)** e **BR PARK**.

Funções: retirada de materiais por colaborador, entrada de estoque, cadastro e edição de produtos, fotos dos produtos, painel administrativo com indicadores, histórico e relatórios mensais, gestão de usuários, categorias e unidades.

## Arquivos

| Caminho | O que é |
|---|---|
| `index.html` | O app completo (HTML, CSS e JavaScript num único arquivo, com as fotos padrão e as logos embutidas). |
| `dados/prod-POSTO.json`, `dados/prod-BRPARK.json` | Cadastro e saldo dos produtos de cada local. |
| `dados/cfg-main.json` | Categorias e unidades de medida. |
| `dados/fotos/` | Fotos de produtos trocadas pelos usuários (nome do arquivo = código do produto). |
| `dados/logos/` | Logos da ALDO e da BR Park. |

Nomes de colaboradores e operadores, o histórico de movimentações e a senha da área administrativa **não** estão no repositório.

## Como executar

O app foi feito como um Artifact do claude.ai e guarda os dados no banco do artefato, acessado por `window.claude.use("db")`.

- **Dentro do claude.ai:** publique `index.html` como Artifact com a capacidade `db` (e `user`). Os dados ficam no banco compartilhado do artefato.
- **Fora do claude.ai:** o arquivo abre em qualquer navegador, mas mostra "sem conexão com o banco de dados", porque esse banco não existe fora do claude.ai. Para rodar de forma independente é preciso trocar `window.claude.use("db")` por outro banco (Firebase, Supabase etc.) com a mesma interface abaixo.

### Estrutura do banco

| Documento | Conteúdo |
|---|---|
| `cfg/main` | `usuarios`, `colaboradores`, `categorias`, `unidades`, `senha`/`senhaHash` |
| `prod/POSTO`, `prod/BRPARK` | `itens: { <código>: { n: nome, c: categoria, u: unidade, m: mínimo, e: estoque, x: 1 se excluído } }` |
| `foto/<código>` | `d`: imagem em data URL |
| `movs/<AAAA-MM>` | `a`: ano, `m`: mês, `itens: { <id>: { t, l, p, n, tp, q, a, d, u, c } }` — `tp`: R retirada, E entrada, C cadastro, X correção, D exclusão |

Interface usada: `db.doc(caminho).onSnapshot / set / update` e `db.collection(nome).onSnapshot`.

Para carregar os dados desta pasta num banco novo, grave cada arquivo `dados/*.json` no documento de mesmo nome (`prod-POSTO.json` → `prod/POSTO`) e cada foto em `foto/<código>` como data URL.
