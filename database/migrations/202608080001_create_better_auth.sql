BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS surion_auth_user (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL UNIQUE,
  "emailVerified" boolean NOT NULL DEFAULT false,
  image text,
  "createdAt" timestamptz NOT NULL DEFAULT now(),
  "updatedAt" timestamptz NOT NULL DEFAULT now(),
  role text NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  banned boolean NOT NULL DEFAULT false,
  "banReason" text,
  "banExpires" timestamptz
);

CREATE UNIQUE INDEX IF NOT EXISTS surion_auth_user_email_lower_unique
  ON surion_auth_user ((lower(email)));

CREATE TABLE IF NOT EXISTS surion_auth_session (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "expiresAt" timestamptz NOT NULL,
  token text NOT NULL UNIQUE,
  "createdAt" timestamptz NOT NULL DEFAULT now(),
  "updatedAt" timestamptz NOT NULL DEFAULT now(),
  "ipAddress" text,
  "userAgent" text,
  "userId" uuid NOT NULL REFERENCES surion_auth_user(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS surion_auth_session_user_id_idx
  ON surion_auth_session ("userId");
CREATE INDEX IF NOT EXISTS surion_auth_session_expires_at_idx
  ON surion_auth_session ("expiresAt");

CREATE TABLE IF NOT EXISTS surion_auth_account (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "accountId" text NOT NULL,
  "providerId" text NOT NULL,
  "userId" uuid NOT NULL REFERENCES surion_auth_user(id) ON DELETE CASCADE,
  "accessToken" text,
  "refreshToken" text,
  "idToken" text,
  "accessTokenExpiresAt" timestamptz,
  "refreshTokenExpiresAt" timestamptz,
  scope text,
  password text,
  "createdAt" timestamptz NOT NULL DEFAULT now(),
  "updatedAt" timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT surion_auth_account_provider_account_unique
    UNIQUE ("providerId", "accountId")
);

CREATE INDEX IF NOT EXISTS surion_auth_account_user_id_idx
  ON surion_auth_account ("userId");

CREATE TABLE IF NOT EXISTS surion_auth_verification (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  identifier text NOT NULL,
  value text NOT NULL,
  "expiresAt" timestamptz NOT NULL,
  "createdAt" timestamptz NOT NULL DEFAULT now(),
  "updatedAt" timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS surion_auth_verification_identifier_idx
  ON surion_auth_verification (identifier);
CREATE INDEX IF NOT EXISTS surion_auth_verification_expires_at_idx
  ON surion_auth_verification ("expiresAt");

CREATE TABLE IF NOT EXISTS surion_auth_rate_limit (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL UNIQUE,
  count integer NOT NULL,
  "lastRequest" bigint NOT NULL
);

COMMIT;
