-- Adiciona coluna tier na tabela profiles
alter table public.profiles
  add column if not exists tier text not null default 'free'
  check (tier in ('free', 'pro', 'creator', 'lifetime'));

create index if not exists profiles_tier_idx on public.profiles(tier);
