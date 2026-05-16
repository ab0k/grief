-- Run in Supabase: Dashboard > SQL Editor > New Query

-- ── Links: permitir leitura pública dos links visíveis ────────
CREATE POLICY "Anyone can view visible links"
  ON public.links FOR SELECT
  USING (visible = true);

-- Adiciona coluna visible se não existir (pode já ter sido criada)
ALTER TABLE public.links ADD COLUMN IF NOT EXISTS visible BOOLEAN DEFAULT true;

-- ── increment_profile_view: garante que existe ────────────────
-- (já criado em migration_views.sql, mas deixamos aqui como fallback)
CREATE OR REPLACE FUNCTION public.increment_profile_view(p_username TEXT)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_profile_id BIGINT;
BEGIN
  SELECT id INTO v_profile_id FROM public.profiles WHERE username = p_username;
  IF v_profile_id IS NULL THEN RETURN; END IF;
  UPDATE public.profiles SET view_count = COALESCE(view_count, 0) + 1 WHERE id = v_profile_id;
  INSERT INTO public.profile_views (profile_id) VALUES (v_profile_id);
END;
$$;
