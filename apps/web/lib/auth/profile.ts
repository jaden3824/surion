import "server-only";

import { getDatabase } from "@/lib/db";

export const TERMS_VERSION = "2026-08-08";
export const PRIVACY_VERSION = "2026-08-08";

export type AccountProfile = {
  userId: string;
  nickname: string;
  bio: string;
  avatarUrl: string | null;
  avatarBlobPath: string | null;
  isAdmin: boolean;
  suspendedAt: string | null;
  onboardingCompletedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type AccountAuthority = {
  isAdmin: boolean;
  isSuspended: boolean;
};

type ProfileRow = {
  user_id: string;
  nickname: string;
  bio: string;
  avatar_url: string | null;
  avatar_blob_path: string | null;
  is_admin: boolean;
  suspended_at: string | null;
  onboarding_completed_at: string | null;
  created_at: string;
  updated_at: string;
};

function mapProfile(row: ProfileRow): AccountProfile {
  return {
    userId: row.user_id,
    nickname: row.nickname,
    bio: row.bio,
    avatarUrl: row.avatar_url,
    avatarBlobPath: row.avatar_blob_path,
    isAdmin: row.is_admin,
    suspendedAt: row.suspended_at,
    onboardingCompletedAt: row.onboarding_completed_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function requireDatabase() {
  const database = getDatabase();
  if (!database) throw new Error("DATABASE_NOT_CONFIGURED");
  return database;
}

export async function getAccountProfile(userId: string) {
  const database = requireDatabase();
  const rows = await database`
    SELECT
      user_id,
      nickname,
      bio,
      avatar_url,
      avatar_blob_path,
      is_admin,
      suspended_at,
      onboarding_completed_at,
      created_at,
      updated_at
    FROM (
      SELECT
        profile.*,
        (auth_user.role = 'admin') AS is_admin,
        CASE
          WHEN auth_user.banned IS TRUE
            AND (auth_user."banExpires" IS NULL OR auth_user."banExpires" > now())
          THEN COALESCE(auth_user."banExpires"::text, 'indefinite')
          ELSE NULL
        END AS suspended_at
      FROM surion_profiles AS profile
      INNER JOIN surion_auth_user AS auth_user ON auth_user.id = profile.user_id
    ) AS surion_account_profile
    WHERE user_id = ${userId}
    LIMIT 1
  ` as unknown as ProfileRow[];

  return rows[0] ? mapProfile(rows[0]) : null;
}

/** Admin and suspension status always comes from Better Auth's protected user fields. */
export async function getAccountAuthority(userId: string): Promise<AccountAuthority | null> {
  const database = requireDatabase();
  const rows = await database`
    SELECT
      (role = 'admin') AS is_admin,
      (
        banned IS TRUE
        AND ("banExpires" IS NULL OR "banExpires" > now())
      ) AS is_suspended
    FROM surion_auth_user
    WHERE id = ${userId}
    LIMIT 1
  ` as unknown as { is_admin: boolean; is_suspended: boolean }[];

  return rows[0]
    ? { isAdmin: rows[0].is_admin, isSuspended: rows[0].is_suspended }
    : null;
}

export async function completeAccountOnboarding(input: {
  userId: string;
  nickname: string;
  avatarUrl?: string | null;
  avatarBlobPath?: string | null;
}) {
  const database = requireDatabase();
  const rows = await database`
    INSERT INTO surion_profiles (
      user_id,
      nickname,
      avatar_url,
      avatar_blob_path,
      terms_version,
      privacy_version,
      terms_agreed_at,
      privacy_agreed_at,
      age_over_14_confirmed_at,
      onboarding_completed_at
    ) VALUES (
      ${input.userId},
      ${input.nickname},
      ${input.avatarUrl ?? null},
      ${input.avatarBlobPath ?? null},
      ${TERMS_VERSION},
      ${PRIVACY_VERSION},
      now(),
      now(),
      now(),
      now()
    )
    RETURNING user_id
  ` as unknown as { user_id: string }[];

  if (!rows[0]) throw new Error("PROFILE_SAVE_FAILED");
  const profile = await getAccountProfile(input.userId);
  if (!profile) throw new Error("PROFILE_SAVE_FAILED");
  return profile;
}

/** Only used to compensate a just-created account whose profile insert failed. */
export async function compensateNewAuthUser(userId: string) {
  const database = requireDatabase();
  const rows = await database`
    DELETE FROM surion_auth_user
    WHERE id = ${userId}
    RETURNING id
  ` as unknown as { id: string }[];
  return rows.length === 1;
}

export async function updateAccountProfile(input: {
  userId: string;
  nickname: string;
  bio: string;
  avatar?: { url: string; blobPath: string } | null;
  updateAvatar: boolean;
}) {
  const database = requireDatabase();
  const rows = input.updateAvatar
    ? await database`
      UPDATE surion_profiles
      SET
        nickname = ${input.nickname},
        bio = ${input.bio},
        avatar_url = ${input.avatar?.url ?? null},
        avatar_blob_path = ${input.avatar?.blobPath ?? null},
        updated_at = now()
      WHERE user_id = ${input.userId}
      RETURNING user_id
    `
    : await database`
      UPDATE surion_profiles
      SET
        nickname = ${input.nickname},
        bio = ${input.bio},
        updated_at = now()
      WHERE user_id = ${input.userId}
      RETURNING user_id
    `;

  const profileRows = rows as unknown as { user_id: string }[];
  return profileRows[0] ? getAccountProfile(input.userId) : null;
}

export function isNicknameConflict(error: unknown) {
  return Boolean(
    error
    && typeof error === "object"
    && "code" in error
    && error.code === "23505"
    && "constraint" in error
    && error.constraint === "surion_profiles_nickname_lower_unique"
  );
}

export function isOnboardingConflict(error: unknown) {
  return Boolean(
    error
    && typeof error === "object"
    && "code" in error
    && error.code === "23505"
    && "constraint" in error
    && error.constraint === "surion_profiles_pkey"
  );
}
