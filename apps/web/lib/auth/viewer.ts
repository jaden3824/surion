import "server-only";

import { cache } from "react";
import { getAccountAuthority, getAccountProfile } from "@/lib/auth/profile";
import { getCurrentAuthUser, isBetterAuthConfigured } from "@/lib/auth/server";
import type { AuthViewer } from "@/lib/auth/types";
import { isDatabaseConfigured } from "@/lib/db";

export type AuthState = {
  configured: boolean;
  viewer: AuthViewer | null;
  onboardingComplete: boolean;
};

export const getAuthState = cache(async function getAuthState(): Promise<AuthState> {
  if (!isBetterAuthConfigured() || !isDatabaseConfigured()) {
    return { configured: false, viewer: null, onboardingComplete: false };
  }

  const session = await getCurrentAuthUser();
  if (session.unavailable) {
    // Do not treat an upstream failure as an authenticated session.
    return { configured: true, viewer: null, onboardingComplete: false };
  }
  if (!session.user) {
    return { configured: true, viewer: null, onboardingComplete: false };
  }

  try {
    const profile = await getAccountProfile(session.user.id);
    const authority = profile
      ? { isAdmin: profile.isAdmin, isSuspended: Boolean(profile.suspendedAt) }
      : await getAccountAuthority(session.user.id);
    if (!authority) {
      return { configured: true, viewer: null, onboardingComplete: false };
    }
    if (authority.isSuspended) {
      return { configured: true, viewer: null, onboardingComplete: false };
    }
    const emailPrefix = session.user.email?.split("@")[0]?.trim() ?? "";

    return {
      configured: true,
      viewer: {
        id: session.user.id,
        nickname: profile?.nickname || session.user.name || emailPrefix || "수리온 회원",
        bio: profile?.bio ?? "",
        avatarUrl: profile?.avatarUrl ?? null,
        email: session.user.email,
        isAdmin: authority?.isAdmin === true,
        isSuspended: false,
      },
      onboardingComplete: Boolean(profile?.onboardingCompletedAt),
    };
  } catch {
    // Database failures fail closed; they never fall back to demo/local identity.
    return { configured: true, viewer: null, onboardingComplete: false };
  }
});

export type AuthRequirement =
  | { ok: true; viewer: AuthViewer; onboardingComplete: boolean }
  | {
    ok: false;
    code: "AUTH_NOT_CONFIGURED" | "AUTH_UNAVAILABLE" | "UNAUTHORIZED" | "ACCOUNT_SUSPENDED" | "ONBOARDING_REQUIRED";
    status: 401 | 403 | 503;
  };

/** Shared fail-closed guard for authenticated write APIs. */
export async function requireAuthUser(options: { onboarding?: boolean } = {}): Promise<AuthRequirement> {
  if (!isBetterAuthConfigured() || !isDatabaseConfigured()) {
    return { ok: false, code: "AUTH_NOT_CONFIGURED", status: 503 };
  }

  const session = await getCurrentAuthUser();
  if (session.unavailable) {
    return { ok: false, code: "AUTH_UNAVAILABLE", status: 503 };
  }
  if (!session.user) {
    return { ok: false, code: "UNAUTHORIZED", status: 401 };
  }

  let profile;
  try {
    profile = await getAccountProfile(session.user.id);
  } catch {
    return { ok: false, code: "AUTH_UNAVAILABLE", status: 503 };
  }

  let authority;
  try {
    authority = profile
      ? { isAdmin: profile.isAdmin, isSuspended: Boolean(profile.suspendedAt) }
      : await getAccountAuthority(session.user.id);
  } catch {
    return { ok: false, code: "AUTH_UNAVAILABLE", status: 503 };
  }

  if (!authority) {
    return { ok: false, code: "AUTH_UNAVAILABLE", status: 503 };
  }

  const emailPrefix = session.user.email?.split("@")[0]?.trim() ?? "";
  const viewer: AuthViewer = {
    id: session.user.id,
    nickname: profile?.nickname || session.user.name || emailPrefix || "수리온 회원",
    bio: profile?.bio ?? "",
    avatarUrl: profile?.avatarUrl ?? null,
    email: session.user.email,
    isAdmin: authority?.isAdmin === true,
    isSuspended: authority?.isSuspended === true,
  };

  if (viewer.isSuspended) {
    return { ok: false, code: "ACCOUNT_SUSPENDED", status: 403 };
  }
  const onboardingComplete = Boolean(profile?.onboardingCompletedAt);
  if (options.onboarding !== false && !onboardingComplete) {
    return { ok: false, code: "ONBOARDING_REQUIRED", status: 403 };
  }

  return { ok: true, viewer, onboardingComplete };
}
