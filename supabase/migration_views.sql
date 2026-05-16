-- Run in Supabase: Dashboard > SQL Editor > New Query

-- ── 1. Adiciona view_count e is_premium ao profiles ───────────
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS view_count       BIGINT  DEFAULT 0,
  ADD COLUMN IF NOT EXISTS is_premium       BOOLEAN DEFAULT false;

-- ── 2. Tabela de log de visualizações (para ranking mensal) ───
CREATE TABLE IF NOT EXISTS public.profile_views (
  id          BIGSERIAL PRIMARY KEY,
  profile_id  BIGINT REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  viewed_at   TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Índice para queries de ranking mensal (filtragem por data)
CREATE INDEX IF NOT EXISTS profile_views_profile_id_idx ON public.profile_views(profile_id);
CREATE INDEX IF NOT EXISTS profile_views_viewed_at_idx  ON public.profile_views(viewed_at DESC);

ALTER TABLE public.profile_views ENABLE ROW LEVEL SECURITY;

-- Qualquer um pode registrar uma view (anônimo também)
CREATE POLICY "Anyone can insert profile views"
  ON public.profile_views FOR INSERT
  WITH CHECK (true);

-- Apenas o próprio usuário pode ver suas views
CREATE POLICY "Users can view own profile views"
  ON public.profile_views FOR SELECT
  USING (
    profile_id IN (
      SELECT id FROM public.profiles WHERE user_id = auth.uid()
    )
  );

-- ── 3. Função para incrementar view_count ─────────────────────
CREATE OR REPLACE FUNCTION public.increment_profile_view(p_username TEXT)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_profile_id BIGINT;
BEGIN
  SELECT id INTO v_profile_id FROM public.profiles WHERE username = p_username;
  IF v_profile_id IS NULL THEN RETURN; END IF;

  -- Incrementa total
  UPDATE public.profiles SET view_count = view_count + 1 WHERE id = v_profile_id;

  -- Registra no log para ranking mensal
  INSERT INTO public.profile_views (profile_id) VALUES (v_profile_id);
END;
$$;
