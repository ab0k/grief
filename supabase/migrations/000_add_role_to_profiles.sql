-- Adiciona coluna role na tabela profiles
-- Execute ANTES da migration 001_admin_tables.sql

alter table public.profiles
  add column if not exists role text not null default 'user'
  check (role in ('user', 'admin', 'owner'));

-- Cria index para consultas de role (middleware usa isso)
create index if not exists profiles_role_idx on public.profiles(role);

-- Para tornar você admin: substitua SEU_EMAIL pelo seu e-mail
-- update public.profiles set role = 'owner' where user_id = (
--   select id from auth.users where email = 'SEU_EMAIL'
-- );
