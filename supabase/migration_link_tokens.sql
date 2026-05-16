-- Tokens para vincular Discord ao perfil via bot
CREATE TABLE IF NOT EXISTS public.link_tokens (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token        TEXT NOT NULL UNIQUE DEFAULT gen_random_uuid()::text,
  discord_id   TEXT NOT NULL,
  discord_username TEXT NOT NULL,
  profile_id   BIGINT REFERENCES public.profiles(id) ON DELETE CASCADE,
  used_at      TIMESTAMPTZ,
  expires_at   TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '10 minutes'),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.link_tokens ENABLE ROW LEVEL SECURITY;

-- Bot usa service_role (bypassa RLS), site usa anon com sessão
CREATE POLICY "Users can read own tokens"
  ON public.link_tokens FOR SELECT
  USING (
    profile_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can update own tokens"
  ON public.link_tokens FOR UPDATE
  USING (
    profile_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
  );
