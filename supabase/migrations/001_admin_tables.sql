-- Admin tables migration
-- Run this in the Supabase SQL Editor

-- ============================================================
-- BANS
-- ============================================================
create table if not exists public.bans (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  banned_by   uuid not null references auth.users(id),
  ban_type    text not null check (ban_type in ('temporary','permanent','shadow')),
  reason      text not null,
  internal_notes text,
  expires_at  timestamptz,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists bans_user_id_idx on public.bans(user_id);
create index if not exists bans_is_active_idx on public.bans(is_active);

-- ============================================================
-- BAN APPEALS
-- ============================================================
create table if not exists public.ban_appeals (
  id             uuid primary key default gen_random_uuid(),
  ban_id         uuid not null references public.bans(id) on delete cascade,
  user_id        uuid not null references auth.users(id) on delete cascade,
  message        text not null,
  status         text not null default 'pending' check (status in ('pending','approved','rejected')),
  admin_response text,
  reviewed_by    uuid references auth.users(id),
  reviewed_at    timestamptz,
  created_at     timestamptz not null default now()
);

create index if not exists ban_appeals_ban_id_idx on public.ban_appeals(ban_id);
create index if not exists ban_appeals_status_idx on public.ban_appeals(status);

-- ============================================================
-- MODERATION LOG
-- ============================================================
create table if not exists public.moderation_log (
  id              uuid primary key default gen_random_uuid(),
  admin_id        uuid not null references auth.users(id),
  action          text not null,
  target_user_id  uuid references auth.users(id),
  content_type    text,
  content_value   text,
  reason          text,
  created_at      timestamptz not null default now()
);

create index if not exists moderation_log_admin_id_idx on public.moderation_log(admin_id);
create index if not exists moderation_log_created_at_idx on public.moderation_log(created_at desc);

-- ============================================================
-- ABUSE REPORTS
-- ============================================================
create table if not exists public.abuse_reports (
  id            uuid primary key default gen_random_uuid(),
  reporter_id   uuid references auth.users(id),
  reported_id   uuid references auth.users(id),
  report_type   text not null,
  description   text,
  status        text not null default 'open' check (status in ('open','reviewing','resolved','dismissed')),
  reviewed_by   uuid references auth.users(id),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- ============================================================
-- SUPPORT TICKETS
-- ============================================================
create table if not exists public.support_tickets (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references auth.users(id) on delete cascade,
  subject     text not null,
  message     text not null,
  status      text not null default 'open' check (status in ('open','in_progress','resolved','closed')),
  priority    text not null default 'normal' check (priority in ('low','normal','high','urgent')),
  assigned_to uuid references auth.users(id),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ============================================================
-- INCIDENTS
-- ============================================================
create table if not exists public.incidents (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  description text,
  severity    text not null default 'medium' check (severity in ('low','medium','high','critical')),
  status      text not null default 'open' check (status in ('open','investigating','resolved')),
  created_by  uuid references auth.users(id),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ============================================================
-- NEWSLETTER SUBSCRIBERS
-- ============================================================
create table if not exists public.newsletter_subscribers (
  id          uuid primary key default gen_random_uuid(),
  email       text not null unique,
  status      text not null default 'active' check (status in ('active','unsubscribed')),
  created_at  timestamptz not null default now()
);

-- ============================================================
-- PARTNERS
-- ============================================================
create table if not exists public.partners (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  email       text,
  website     text,
  status      text not null default 'pending' check (status in ('pending','active','inactive')),
  notes       text,
  created_at  timestamptz not null default now()
);

-- ============================================================
-- LEGAL DOCUMENTS
-- ============================================================
create table if not exists public.legal_documents (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  content     text,
  doc_type    text not null check (doc_type in ('tos','privacy','cookie','other')),
  version     text not null default '1.0',
  is_active   boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ============================================================
-- ADMIN SETTINGS
-- ============================================================
create table if not exists public.admin_settings (
  key         text primary key,
  value       text,
  updated_by  uuid references auth.users(id),
  updated_at  timestamptz not null default now()
);

-- Insert default settings
insert into public.admin_settings (key, value) values
  ('maintenance_mode', 'false'),
  ('registration_enabled', 'true'),
  ('max_links_per_user', '20'),
  ('site_name', 'grief.cc')
on conflict (key) do nothing;

-- ============================================================
-- RLS POLICIES (only admins/owners can access admin tables)
-- ============================================================

-- Enable RLS
alter table public.bans enable row level security;
alter table public.ban_appeals enable row level security;
alter table public.moderation_log enable row level security;
alter table public.abuse_reports enable row level security;
alter table public.support_tickets enable row level security;
alter table public.incidents enable row level security;
alter table public.newsletter_subscribers enable row level security;
alter table public.partners enable row level security;
alter table public.legal_documents enable row level security;
alter table public.admin_settings enable row level security;

-- Helper function to check if user is admin
create or replace function public.is_admin()
returns boolean language sql security definer as $$
  select exists (
    select 1 from public.profiles
    where user_id = auth.uid()
    and role in ('admin','owner')
  )
$$;

-- Bans: admins full access, users can read their own
create policy "admins manage bans" on public.bans
  using (public.is_admin()) with check (public.is_admin());
create policy "users view own ban" on public.bans for select
  using (user_id = auth.uid());

-- Ban appeals: users can insert/view own, admins full
create policy "admins manage appeals" on public.ban_appeals
  using (public.is_admin()) with check (public.is_admin());
create policy "users manage own appeals" on public.ban_appeals
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Moderation log: admins only
create policy "admins view moderation log" on public.moderation_log
  using (public.is_admin());

-- Abuse reports: admins full, anyone can insert
create policy "admins manage abuse reports" on public.abuse_reports
  using (public.is_admin()) with check (public.is_admin());
create policy "anyone can report abuse" on public.abuse_reports for insert
  with check (true);

-- Support tickets: admins full, users manage own
create policy "admins manage tickets" on public.support_tickets
  using (public.is_admin()) with check (public.is_admin());
create policy "users manage own tickets" on public.support_tickets
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Other tables: admins only
create policy "admins manage incidents" on public.incidents
  using (public.is_admin()) with check (public.is_admin());
create policy "admins manage newsletter" on public.newsletter_subscribers
  using (public.is_admin()) with check (public.is_admin());
create policy "admins manage partners" on public.partners
  using (public.is_admin()) with check (public.is_admin());
create policy "admins manage legal" on public.legal_documents
  using (public.is_admin()) with check (public.is_admin());
create policy "admins manage settings" on public.admin_settings
  using (public.is_admin()) with check (public.is_admin());
-- Anyone can read legal docs
create policy "public read legal docs" on public.legal_documents for select
  using (is_active = true);
