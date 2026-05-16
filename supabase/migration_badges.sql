-- Run in Supabase: Dashboard > SQL Editor > New Query

-- 1. Badges catalogue table
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

-- 2. Junction table: which badges a profile owns
CREATE TABLE IF NOT EXISTS public.user_badges (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id  BIGINT NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  badge_id    UUID   NOT NULL REFERENCES public.badges(id)   ON DELETE CASCADE,
  acquired_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (profile_id, badge_id)
);

-- 3. Seed badge catalogue
INSERT INTO public.badges (key, name, description, icon, color, category, acquirable) VALUES
  ('og',           'OG',           'Um dos primeiros usuários da plataforma.',         '👑',  '#f59e0b', 'achievement', false),
  ('early',        'Early',        'Entrou durante o acesso antecipado.',              '🌅',  '#fb923c', 'achievement', false),
  ('verified',     'Verified',     'Identidade verificada pela equipe.',               '✅',  '#3b82f6', 'achievement', false),
  ('premium',      'Premium',      'Assinante Premium ativo.',                         '💎',  '#a855f7', 'premium',     true ),
  ('donator',      'Donator',      'Apoiou o desenvolvimento da plataforma.',          '💜',  '#ec4899', 'premium',     true ),
  ('booster',      'Booster',      'Impulsionou o servidor no Discord.',               '🚀',  '#22d3ee', 'social',      true ),
  ('staff',        'Staff',        'Membro da equipe oficial.',                        '🛡️', '#ef4444', 'staff',       false),
  ('partner',      'Partner',      'Parceiro oficial da plataforma.',                  '🤝',  '#14b8a6', 'staff',       false),
  ('trending',     'Trending',     'Perfil em alta esta semana.',                      '📈',  '#f97316', 'achievement', false),
  ('popular',      'Popular',      'Mais de 1.000 visitas no perfil.',                 '⭐',  '#eab308', 'achievement', false),
  ('famous',       'Famous',       'Mais de 10.000 visitas no perfil.',                '🌟',  '#fbbf24', 'achievement', false),
  ('inviter',      'Inviter',      'Convidou 10 ou mais usuários.',                    '📨',  '#8b5cf6', 'social',      false),
  ('active',       'Active',       'Usuário muito ativo na plataforma.',               '⚡',  '#06b6d4', 'achievement', false),
  ('gambler',      'Gambler',      'Venceu no cassino 5 vezes.',                       '🎰',  '#dc2626', 'achievement', false),
  ('event_winner', 'Event Winner', 'Vencedor de um evento oficial.',                   '🏆',  '#d97706', 'event',       false),
  ('innovator',    'Innovator',    'Sugeriu uma feature que foi implementada.',         '💡',  '#84cc16', 'achievement', false),
  ('featured',     'Featured',     'Perfil destaque na página inicial.',               '✨',  '#f472b6', 'achievement', false),
  ('custom',       'Custom',       'Badge exclusiva personalizada.',                   '🎨',  '#6366f1', 'premium',     false)
ON CONFLICT (key) DO NOTHING;

-- 4. Enable RLS
ALTER TABLE public.badges      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;

-- 5. Policies
-- Anyone can read the catalogue
CREATE POLICY "badges_public_read"
  ON public.badges FOR SELECT USING (true);

-- Users can read their own user_badges
CREATE POLICY "user_badges_owner_read"
  ON public.user_badges FOR SELECT
  USING (profile_id IN (
    SELECT id FROM public.profiles WHERE user_id = auth.uid()
  ));

-- Users can insert their own user_badges
CREATE POLICY "user_badges_owner_insert"
  ON public.user_badges FOR INSERT
  WITH CHECK (profile_id IN (
    SELECT id FROM public.profiles WHERE user_id = auth.uid()
  ));

-- Users can delete their own user_badges
CREATE POLICY "user_badges_owner_delete"
  ON public.user_badges FOR DELETE
  USING (profile_id IN (
    SELECT id FROM public.profiles WHERE user_id = auth.uid()
  ));
