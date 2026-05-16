-- Run in Supabase: Dashboard > SQL Editor > New Query

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS display_name   TEXT,
  ADD COLUMN IF NOT EXISTS bio            TEXT,
  ADD COLUMN IF NOT EXISTS avatar_shape   TEXT DEFAULT 'circle',
  ADD COLUMN IF NOT EXISTS banner_url     TEXT,
  ADD COLUMN IF NOT EXISTS tags           TEXT[] DEFAULT '{}';
