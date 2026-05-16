-- ══════════════════════════════════════════════════════════════════
--  grief.cc — Script completo do banco de dados
--  Cole tudo isso no Supabase > SQL Editor > New Query e clique Run
-- ══════════════════════════════════════════════════════════════════

-- ── 1. Tabela principal de perfis ─────────────────────────────────
CREATE TABLE IF NOT EXISTS public.profiles (
  id          BIGSERIAL PRIMARY KEY,
  user_id     UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  username    TEXT,
  avatar_url  TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view profiles"      ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert own profile"  ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own profile"  ON public.profiles FOR UPDATE  USING (auth.uid() = user_id);

-- Trigger: cria perfil automaticamente ao cadastrar
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (user_id, username, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(
      NEW.raw_user_meta_data->>'username',
      NEW.raw_user_meta_data->>'full_name',
      NEW.raw_user_meta_data->>'name',
      split_part(NEW.email, '@', 1)
    ),
    NEW.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ── 2. Campos extras do perfil ────────────────────────────────────
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS display_name   TEXT,
  ADD COLUMN IF NOT EXISTS bio            TEXT,
  ADD COLUMN IF NOT EXISTS avatar_shape   TEXT DEFAULT 'circle',
  ADD COLUMN IF NOT EXISTS banner_url     TEXT,
  ADD COLUMN IF NOT EXISTS tags           TEXT[] DEFAULT '{}';

-- ── 3. Links ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.links (
  id         BIGSERIAL PRIMARY KEY,
  user_id    UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  platform   TEXT NOT NULL DEFAULT 'custom',
  label      TEXT NOT NULL,
  url        TEXT NOT NULL,
  position   INT  NOT NULL DEFAULT 0,
  visible    BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

ALTER TABLE public.links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view visible links"  ON public.links FOR SELECT USING (visible = true);
CREATE POLICY "Users can view own links"       ON public.links FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own links"     ON public.links FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own links"     ON public.links FOR UPDATE  USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own links"     ON public.links FOR DELETE  USING (auth.uid() = user_id);

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS link_icon_color TEXT DEFAULT '#ffffff',
  ADD COLUMN IF NOT EXISTS link_bg_color   TEXT DEFAULT '#1e1e2a';

-- ── 4. Views e ranking ────────────────────────────────────────────
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS view_count BIGINT  DEFAULT 0,
  ADD COLUMN IF NOT EXISTS is_premium BOOLEAN DEFAULT false;

CREATE TABLE IF NOT EXISTS public.profile_views (
  id         BIGSERIAL PRIMARY KEY,
  profile_id BIGINT REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  viewed_at  TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS profile_views_profile_id_idx ON public.profile_views(profile_id);
CREATE INDEX IF NOT EXISTS profile_views_viewed_at_idx  ON public.profile_views(viewed_at DESC);

ALTER TABLE public.profile_views ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert profile views"
  ON public.profile_views FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can view own profile views"
  ON public.profile_views FOR SELECT
  USING (profile_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()));

CREATE OR REPLACE FUNCTION public.increment_profile_view(p_username TEXT)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_profile_id BIGINT;
BEGIN
  SELECT id INTO v_profile_id FROM public.profiles WHERE username = p_username;
  IF v_profile_id IS NULL THEN RETURN; END IF;
  UPDATE public.profiles SET view_count = COALESCE(view_count, 0) + 1 WHERE id = v_profile_id;
  INSERT INTO public.profile_views (profile_id) VALUES (v_profile_id);
END;
$$;

-- ── 5. Aparência ──────────────────────────────────────────────────
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS theme_color TEXT DEFAULT '#7c5cfc',
  ADD COLUMN IF NOT EXISTS name_color  TEXT DEFAULT '#ffffff',
  ADD COLUMN IF NOT EXISTS text_color  TEXT DEFAULT '#ffffff',
  ADD COLUMN IF NOT EXISTS name_font   TEXT DEFAULT 'default',
  ADD COLUMN IF NOT EXISTS text_font   TEXT DEFAULT 'default';

-- ── 6. Metadata / SEO ─────────────────────────────────────────────
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS page_title   TEXT,
  ADD COLUMN IF NOT EXISTS favicon_url  TEXT,
  ADD COLUMN IF NOT EXISTS og_image_url TEXT;

-- ── 7. Assets e efeitos ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.user_assets (
  id           BIGSERIAL PRIMARY KEY,
  user_id      UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  type         TEXT NOT NULL,
  name         TEXT NOT NULL,
  url          TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  size         BIGINT,
  mime_type    TEXT,
  created_at   TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

ALTER TABLE public.user_assets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own assets"   ON public.user_assets FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own assets" ON public.user_assets FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own assets" ON public.user_assets FOR DELETE USING (auth.uid() = user_id);

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS cursor_url       TEXT,
  ADD COLUMN IF NOT EXISTS background_url   TEXT,
  ADD COLUMN IF NOT EXISTS background_type  TEXT DEFAULT 'image',
  ADD COLUMN IF NOT EXISTS background_color TEXT,
  ADD COLUMN IF NOT EXISTS font_url         TEXT,
  ADD COLUMN IF NOT EXISTS font_name        TEXT,
  ADD COLUMN IF NOT EXISTS audio_url        TEXT,
  ADD COLUMN IF NOT EXISTS audio_autoplay   BOOLEAN DEFAULT false;

-- ── 8. Badges ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.badges (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key         TEXT NOT NULL UNIQUE,
  name        TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  icon        TEXT NOT NULL DEFAULT '🏅',
  color       TEXT NOT NULL DEFAULT '#7c5cfc',
  category    TEXT NOT NULL DEFAULT 'achievement'
                CHECK (category IN ('achievement','staff','premium','event','social')),
  acquirable  BOOLEAN NOT NULL DEFAULT false,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.user_badges (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id  BIGINT NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  badge_id    UUID   NOT NULL REFERENCES public.badges(id)   ON DELETE CASCADE,
  acquired_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (profile_id, badge_id)
);

INSERT INTO public.badges (key, name, description, icon, color, category, acquirable) VALUES
  ('og',           'OG',           'Um dos primeiros usuários da plataforma.',       '👑', '#f59e0b', 'achievement', false),
  ('early',        'Early',        'Entrou durante o acesso antecipado.',            '🌅', '#fb923c', 'achievement', false),
  ('verified',     'Verified',     'Identidade verificada pela equipe.',             '✅', '#3b82f6', 'achievement', false),
  ('premium',      'Premium',      'Assinante Premium ativo.',                       '💎', '#a855f7', 'premium',     true ),
  ('donator',      'Donator',      'Apoiou o desenvolvimento da plataforma.',        '💜', '#ec4899', 'premium',     true ),
  ('booster',      'Booster',      'Impulsionou o servidor no Discord.',             '🚀', '#22d3ee', 'social',      true ),
  ('staff',        'Staff',        'Membro da equipe oficial.',                      '🛡️','#ef4444', 'staff',       false),
  ('partner',      'Partner',      'Parceiro oficial da plataforma.',                '🤝', '#14b8a6', 'staff',       false),
  ('trending',     'Trending',     'Perfil em alta esta semana.',                    '📈', '#f97316', 'achievement', false),
  ('popular',      'Popular',      'Mais de 1.000 visitas no perfil.',               '⭐', '#eab308', 'achievement', false),
  ('famous',       'Famous',       'Mais de 10.000 visitas no perfil.',              '🌟', '#fbbf24', 'achievement', false),
  ('inviter',      'Inviter',      'Convidou 10 ou mais usuários.',                  '📨', '#8b5cf6', 'social',      false),
  ('active',       'Active',       'Usuário muito ativo na plataforma.',             '⚡', '#06b6d4', 'achievement', false),
  ('gambler',      'Gambler',      'Venceu no cassino 5 vezes.',                    '🎰', '#dc2626', 'achievement', false),
  ('event_winner', 'Event Winner', 'Vencedor de um evento oficial.',                 '🏆', '#d97706', 'event',       false),
  ('innovator',    'Innovator',    'Sugeriu uma feature que foi implementada.',      '💡', '#84cc16', 'achievement', false),
  ('featured',     'Featured',     'Perfil destaque na página inicial.',             '✨', '#f472b6', 'achievement', false),
  ('custom',       'Custom',       'Badge exclusiva personalizada.',                 '🎨', '#6366f1', 'premium',     false)
ON CONFLICT (key) DO NOTHING;

ALTER TABLE public.badges      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "badges_public_read"       ON public.badges FOR SELECT USING (true);
CREATE POLICY "user_badges_owner_read"   ON public.user_badges FOR SELECT
  USING (profile_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()));
CREATE POLICY "user_badges_owner_insert" ON public.user_badges FOR INSERT
  WITH CHECK (profile_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()));
CREATE POLICY "user_badges_owner_delete" ON public.user_badges FOR DELETE
  USING (profile_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()));

-- ── 9. Giveaways (para o bot Discord) ────────────────────────────
CREATE TABLE IF NOT EXISTS public.giveaways (
  id                    BIGSERIAL PRIMARY KEY,
  prize                 TEXT NOT NULL,
  created_by_discord_id TEXT,
  ends_at               TIMESTAMPTZ NOT NULL,
  is_active             BOOLEAN DEFAULT true,
  channel_id            TEXT,
  guild_id              TEXT,
  winner_discord_id     TEXT,
  winner_username       TEXT,
  created_at            TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.giveaway_entries (
  id               BIGSERIAL PRIMARY KEY,
  giveaway_id      BIGINT REFERENCES public.giveaways(id) ON DELETE CASCADE NOT NULL,
  discord_id       TEXT NOT NULL,
  discord_username TEXT NOT NULL,
  created_at       TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE (giveaway_id, discord_id)
);

ALTER TABLE public.giveaways       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.giveaway_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "giveaways_public_read"        ON public.giveaways        FOR SELECT USING (true);
CREATE POLICY "giveaways_public_insert"      ON public.giveaways        FOR INSERT WITH CHECK (true);
CREATE POLICY "giveaways_public_update"      ON public.giveaways        FOR UPDATE USING (true);
CREATE POLICY "giveaway_entries_public_read" ON public.giveaway_entries FOR SELECT USING (true);
CREATE POLICY "giveaway_entries_public_insert" ON public.giveaway_entries FOR INSERT WITH CHECK (true);

-- ── 10. discord_id no perfil (vincula bot ao site) ────────────────
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS discord_id TEXT UNIQUE;

CREATE INDEX IF NOT EXISTS profiles_discord_id_idx ON public.profiles (discord_id);

-- ══════════════════════════════════════════════════════════════════
--  STORAGE: crie o bucket manualmente no painel do Supabase
--  Storage > New Bucket > nome: profile-media > Public: YES
-- ══════════════════════════════════════════════════════════════════
