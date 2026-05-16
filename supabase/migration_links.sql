-- Run in Supabase: Dashboard > SQL Editor > New Query

CREATE TABLE IF NOT EXISTS public.links (
  id         BIGSERIAL PRIMARY KEY,
  user_id    UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  platform   TEXT NOT NULL DEFAULT 'custom',
  label      TEXT NOT NULL,
  url        TEXT NOT NULL,
  position   INT  NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

ALTER TABLE public.links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own links"   ON public.links FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own links" ON public.links FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own links" ON public.links FOR UPDATE  USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own links" ON public.links FOR DELETE  USING (auth.uid() = user_id);

-- Global link color customization stored in profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS link_icon_color TEXT DEFAULT '#ffffff',
  ADD COLUMN IF NOT EXISTS link_bg_color   TEXT DEFAULT '#1e1e2a';
