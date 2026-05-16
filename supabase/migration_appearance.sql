-- Run in Supabase: Dashboard > SQL Editor > New Query

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS theme_color  TEXT DEFAULT '#7c5cfc',
  ADD COLUMN IF NOT EXISTS name_color   TEXT DEFAULT '#ffffff',
  ADD COLUMN IF NOT EXISTS text_color   TEXT DEFAULT '#ffffff',
  ADD COLUMN IF NOT EXISTS name_font    TEXT DEFAULT 'default',
  ADD COLUMN IF NOT EXISTS text_font    TEXT DEFAULT 'default';
