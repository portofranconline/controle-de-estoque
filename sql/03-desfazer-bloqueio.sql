-- 03 — DESFAZER O BLOQUEIO (volta ao acesso aberto de antes).
-- Use somente se algo der errado depois do 02.

begin;
drop policy if exists docs_ler_logado on public.app_docs;
drop policy if exists docs_admin_inserir on public.app_docs;
drop policy if exists docs_admin_atualizar on public.app_docs;
drop policy if exists docs_operador_inserir on public.app_docs;
drop policy if exists docs_operador_atualizar on public.app_docs;
create policy docs_acesso_aberto on public.app_docs for all to anon, authenticated using (true) with check (true);
commit;
