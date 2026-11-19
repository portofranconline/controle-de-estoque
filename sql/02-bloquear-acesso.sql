-- 02 — BLOQUEIO: só quem entrou com login acessa os dados.
-- RODE SOMENTE DEPOIS que o administrador criou a conta e entrou no app novo.
-- Depois disso, o app antigo (sem login) deixa de funcionar — é o esperado.

begin;

alter table public.app_docs enable row level security;

-- remove as políticas antigas (eram abertas para o público)
do $$ declare r record; begin
  for r in select policyname from pg_policies where schemaname = 'public' and tablename = 'app_docs' loop
    execute format('drop policy %I on public.app_docs', r.policyname);
  end loop;
end $$;

-- qualquer usuário logado lê
create policy docs_ler_logado on public.app_docs for select to authenticated using (true);

-- administrador: cadastro, edição de produtos, fotos, configurações
create policy docs_admin_inserir on public.app_docs for insert to authenticated with check (public.eh_admin());
create policy docs_admin_atualizar on public.app_docs for update to authenticated
  using (public.eh_admin()) with check (public.eh_admin());

-- operador: só grava estoque (prod/) e histórico (movs/), para retirada
create policy docs_operador_inserir on public.app_docs for insert to authenticated
  with check (id like 'prod/%' or id like 'movs/%');
create policy docs_operador_atualizar on public.app_docs for update to authenticated
  using (id like 'prod/%' or id like 'movs/%') with check (id like 'prod/%' or id like 'movs/%');

-- sem política de exclusão: ninguém apaga linhas pela API

commit;
