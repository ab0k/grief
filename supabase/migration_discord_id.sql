-- Adiciona coluna discord_id na tabela profiles
-- Permite o bot do Discord vincular usuários ao perfil do grief.cc

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS discord_id TEXT UNIQUE;

CREATE INDEX IF NOT EXISTS profiles_discord_id_idx ON profiles (discord_id);
