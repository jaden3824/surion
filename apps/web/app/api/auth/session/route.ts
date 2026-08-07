import { NextResponse } from "next/server";
import { authNotConfiguredResponse } from "@/lib/auth/api";
import { getAccountAuthority, getAccountProfile } from "@/lib/auth/profile";
import { getCurrentAuthUser, isBetterAuthConfigured } from "@/lib/auth/server";
import { isDatabaseConfigured } from "@/lib/db";

function privateJson(body: Record<string, unknown>, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: { "Cache-Control": "private, no-store" },
  });
}

export async function GET() {
  if (!isBetterAuthConfigured() || !isDatabaseConfigured()) {
    return authNotConfiguredResponse();
  }

  const session = await getCurrentAuthUser();
  if (session.unavailable) {
    return privateJson({
      ok: false,
      code: "AUTH_UNAVAILABLE",
      message: "로그인 서비스를 잠시 사용할 수 없습니다.",
    }, 503);
  }
  if (!session.user) {
    return privateJson({
      ok: true,
      configured: true,
      user: null,
      profile: null,
      isOnboardingComplete: false,
    });
  }

  try {
    const profile = await getAccountProfile(session.user.id);
    const authority = profile
      ? { isAdmin: profile.isAdmin, isSuspended: Boolean(profile.suspendedAt) }
      : await getAccountAuthority(session.user.id);
    if (!authority) {
      return privateJson({
        ok: false,
        code: "AUTH_UNAVAILABLE",
        message: "로그인 서비스를 잠시 사용할 수 없습니다.",
      }, 503);
    }
    if (authority.isSuspended) {
      return privateJson({
        ok: false,
        code: "ACCOUNT_SUSPENDED",
        message: "이용이 제한된 계정입니다.",
      }, 403);
    }
    return privateJson({
      ok: true,
      configured: true,
      user: { id: session.user.id, email: session.user.email },
      profile: profile
        ? {
          nickname: profile.nickname,
          bio: profile.bio,
          avatarUrl: profile.avatarUrl,
          isAdmin: authority.isAdmin,
          isSuspended: authority.isSuspended,
        }
        : null,
      isOnboardingComplete: Boolean(profile?.onboardingCompletedAt),
    });
  } catch {
    return privateJson({
      ok: false,
      code: "AUTH_UNAVAILABLE",
      message: "로그인 서비스를 잠시 사용할 수 없습니다.",
    }, 503);
  }
}
