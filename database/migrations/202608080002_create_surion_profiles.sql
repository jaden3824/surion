BEGIN;

CREATE TABLE IF NOT EXISTS surion_profiles (
  user_id uuid PRIMARY KEY,
  nickname varchar(20) NOT NULL,
  bio varchar(500) NOT NULL DEFAULT '',
  avatar_url text,
  avatar_blob_path text,
  terms_version text NOT NULL,
  privacy_version text NOT NULL,
  terms_agreed_at timestamptz NOT NULL,
  privacy_agreed_at timestamptz NOT NULL,
  age_over_14_confirmed_at timestamptz NOT NULL,
  onboarding_completed_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT surion_profiles_nickname_length
    CHECK (char_length(nickname) BETWEEN 2 AND 20),
  CONSTRAINT surion_profiles_nickname_trimmed
    CHECK (nickname = btrim(nickname)),
  CONSTRAINT surion_profiles_bio_length
    CHECK (char_length(bio) <= 500)
);

-- Safely replaces the earlier managed-Neon Auth FK when that draft migration
-- was already applied. No managed `neon_auth.*` table is modified.
ALTER TABLE surion_profiles
  DROP CONSTRAINT IF EXISTS surion_profiles_user_id_fkey;
ALTER TABLE surion_profiles
  ADD CONSTRAINT surion_profiles_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES surion_auth_user(id) ON DELETE CASCADE
  NOT VALID;
ALTER TABLE surion_profiles
  VALIDATE CONSTRAINT surion_profiles_user_id_fkey;

CREATE UNIQUE INDEX IF NOT EXISTS surion_profiles_nickname_lower_unique
  ON surion_profiles ((lower(nickname)));

CREATE INDEX IF NOT EXISTS surion_profiles_created_at_idx
  ON surion_profiles (created_at DESC);

CREATE OR REPLACE FUNCTION set_surion_profile_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS surion_profiles_set_updated_at ON surion_profiles;
CREATE TRIGGER surion_profiles_set_updated_at
BEFORE UPDATE ON surion_profiles
FOR EACH ROW
EXECUTE FUNCTION set_surion_profile_updated_at();

COMMIT;
