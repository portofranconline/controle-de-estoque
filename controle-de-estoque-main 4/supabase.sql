-- Banco online do Controle de Estoque
create table if not exists public.app_docs (
  id text primary key,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end; $$;

drop trigger if exists app_docs_updated_at on public.app_docs;
create trigger app_docs_updated_at before update on public.app_docs
for each row execute function public.set_updated_at();

alter table public.app_docs enable row level security;

-- O aplicativo usa uma senha própria na tela administrativa.
-- Para a primeira versão, o acesso da aplicação é controlado por essa senha.
drop policy if exists "app_docs_public_read" on public.app_docs;
drop policy if exists "app_docs_public_write" on public.app_docs;
create policy "app_docs_public_read" on public.app_docs for select to anon using (true);
create policy "app_docs_public_write" on public.app_docs for insert to anon with check (true);
create policy "app_docs_public_update" on public.app_docs for update to anon using (true) with check (true);

-- Opcional: carregue os dados iniciais pelo próprio aplicativo na primeira execução.
