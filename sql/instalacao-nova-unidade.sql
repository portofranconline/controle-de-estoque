-- INSTALAÇÃO DE UMA UNIDADE NOVA (projeto Supabase vazio)
-- Rode inteiro no SQL Editor do projeto. Pode rodar uma vez só.
-- Depois, abra o app, informe a URL e a chave publicável e crie o administrador.

create table if not exists public.app_docs (
  id text primary key,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

-- 01 — PREPARAÇÃO DOS LOGINS
-- Não bloqueia o app: a tabela public.app_docs continua como está.
-- Rode no SQL Editor do projeto nbxculupvmgwmjjbabrt (Posto Franco).

begin;

create extension if not exists pgcrypto with schema extensions;

-- perfis de acesso: um por usuário do Supabase Auth
create table if not exists public.perfis (
  user_id uuid primary key references auth.users(id) on delete cascade,
  login text not null,
  papel text not null check (papel in ('admin','operador')),
  criado_em timestamptz not null default now()
);
create unique index if not exists perfis_login_unico on public.perfis (lower(login));
alter table public.perfis enable row level security;

drop policy if exists perfis_ler on public.perfis;
-- (a política usa eh_admin, criada abaixo)

-- o usuário logado é administrador?
create or replace function public.eh_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.perfis where user_id = auth.uid() and papel = 'admin');
$$;

-- já existe administrador? (usado na primeira abertura do app)
create or replace function public.tem_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.perfis where papel = 'admin');
$$;

-- transforma o login em e-mail interno: "Inácio" -> inacio@estoque.local
create or replace function public.email_do_login(p_login text) returns text
language sql immutable as $$
  select regexp_replace(lower(translate(trim(p_login),
    'áàâãäéèêëíìîïóòôõöúùûüçñÁÀÂÃÄÉÈÊËÍÌÎÏÓÒÔÕÖÚÙÛÜÇÑ',
    'aaaaaeeeeiiiiooooouuuucnaaaaaeeeeiiiiooooouuuucn')), '[^a-z0-9]', '', 'g') || '@estoque.local';
$$;

-- cria a conta no Supabase Auth com senha (uso interno das funções abaixo)
create or replace function public.criar_usuario_auth(p_email text, p_senha text) returns uuid
language plpgsql security definer set search_path = public, auth, extensions as $$
declare v_id uuid := gen_random_uuid();
begin
  if length(coalesce(p_senha,'')) < 6 then raise exception 'Use uma senha com pelo menos 6 caracteres.'; end if;
  if exists (select 1 from auth.users where email = p_email) then raise exception 'Esse login já existe.'; end if;
  insert into auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
      confirmation_token, recovery_token, email_change_token_new, email_change)
  values ('00000000-0000-0000-0000-000000000000', v_id, 'authenticated', 'authenticated', p_email,
      extensions.crypt(p_senha, extensions.gen_salt('bf')), now(),
      '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, now(), now(), '', '', '', '');
  insert into auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
  values (gen_random_uuid(), v_id,
      jsonb_build_object('sub', v_id::text, 'email', p_email, 'email_verified', true, 'phone_verified', false),
      'email', v_id::text, now(), now(), now());
  return v_id;
end $$;

-- primeiro administrador (só funciona se ainda não houver nenhum)
create or replace function public.criar_primeiro_admin(p_login text, p_email text, p_senha text) returns void
language plpgsql security definer set search_path = public, auth, extensions as $$
declare v_id uuid;
begin
  if public.tem_admin() then raise exception 'Já existe um administrador.'; end if;
  v_id := public.criar_usuario_auth(lower(trim(p_email)), p_senha);
  insert into public.perfis (user_id, login, papel) values (v_id, trim(p_login), 'admin');
end $$;

-- administrador cria login de operador (ex.: Kaliel)
create or replace function public.criar_operador(p_login text, p_senha text) returns void
language plpgsql security definer set search_path = public, auth, extensions as $$
declare v_id uuid;
begin
  if not public.eh_admin() then raise exception 'Apenas o administrador cria logins.'; end if;
  if trim(coalesce(p_login,'')) = '' then raise exception 'Digite o nome do login.'; end if;
  if exists (select 1 from public.perfis where lower(login) = lower(trim(p_login))) then raise exception 'Esse login já existe.'; end if;
  v_id := public.criar_usuario_auth(public.email_do_login(p_login), p_senha);
  insert into public.perfis (user_id, login, papel) values (v_id, trim(p_login), 'operador');
end $$;

-- administrador redefine a senha de um operador
create or replace function public.redefinir_senha(p_login text, p_senha text) returns void
language plpgsql security definer set search_path = public, auth, extensions as $$
declare v_id uuid;
begin
  if not public.eh_admin() then raise exception 'Apenas o administrador redefine senhas.'; end if;
  if length(coalesce(p_senha,'')) < 6 then raise exception 'Use uma senha com pelo menos 6 caracteres.'; end if;
  select user_id into v_id from public.perfis where lower(login) = lower(trim(p_login));
  if v_id is null then raise exception 'Login não encontrado.'; end if;
  update auth.users set encrypted_password = extensions.crypt(p_senha, extensions.gen_salt('bf')), updated_at = now()
   where id = v_id;
end $$;

-- quem vê a própria linha; o administrador vê todas (para a lista de logins)
create policy perfis_ler on public.perfis for select to authenticated
  using (user_id = auth.uid() or public.eh_admin());

-- permissões das funções
revoke all on function public.criar_usuario_auth(text,text) from public, anon, authenticated;
revoke all on function public.eh_admin() from public, anon;
revoke all on function public.tem_admin() from public;
revoke all on function public.criar_primeiro_admin(text,text,text) from public;
revoke all on function public.criar_operador(text,text) from public, anon;
revoke all on function public.redefinir_senha(text,text) from public, anon;
grant execute on function public.eh_admin() to authenticated;
grant execute on function public.tem_admin() to anon, authenticated;
grant execute on function public.criar_primeiro_admin(text,text,text) to anon, authenticated;
grant execute on function public.criar_operador(text,text) to authenticated;
grant execute on function public.redefinir_senha(text,text) to authenticated;

commit;

-- conferência (somente leitura)
select 'funções criadas' as item, count(*) from pg_proc
 where pronamespace = 'public'::regnamespace and proname in ('eh_admin','tem_admin','criar_primeiro_admin','criar_operador','redefinir_senha');

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
