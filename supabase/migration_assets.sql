-- Run in Supabase: Dashboard > SQL Editor > New Query

-- ── 1. Tabela de assets do usuário ─────────────────────────────
CREATE TABLE IF NOT EXISTS public.user_assets (
  id         BIGSERIAL PRIMARY KEY,
  user_id    UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  type       TEXT NOT NULL,   -- 'image' | 'video' | 'audio' | 'cursor' | 'font'
  name       TEXT NOT NULL,   -- nome original do arquivo
  url        TEXT NOT NULL,   -- URL pública no Storage
  storage_path TEXT NOT NULL, -- caminho no bucket (para deletar)
  size       BIGINT,          -- tamanho em bytes
  mime_type  TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

ALTER TABLE public.user_assets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own assets"
  ON public.user_assets FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own assets"
  ON public.user_assets FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own assets"
  ON public.user_assets FOR DELETE
  USING (auth.uid() = user_id);

-- ── 2. Novos campos de efeitos no perfil ───────────────────────
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS cursor_url        TEXT,
  ADD COLUMN IF NOT EXISTS background_url    TEXT,
  ADD COLUMN IF NOT EXISTS background_type   TEXT DEFAULT 'image',  -- 'image' | 'video' | 'color'
  ADD COLUMN IF NOT EXISTS background_color  TEXT,
  ADD COLUMN IF NOT EXISTS font_url          TEXT,
  ADD COLUMN IF NOT EXISTS font_name         TEXT,
  ADD COLUMN IF NOT EXISTS audio_url         TEXT,
  ADD COLUMN IF NOT EXISTS audio_autoplay    BOOLEAN DEFAULT false;

-- ── 3. Política de DELETE no Storage ──────────────────────────
CREATE POLICY "Users can delete their own media"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'profile-media' AND auth.uid()::text = (storage.foldername(name))[1]);
