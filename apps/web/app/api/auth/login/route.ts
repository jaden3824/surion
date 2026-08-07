import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { authErrorResponse, authNotConfiguredResponse } from "@/lib/auth/api";
import { getAccountAuthority, getAccountProfile } from "@/lib/auth/profile";
import { buildProfileRedirect, sanitizeAuthRedirect } from "@/lib/auth/redirect";
import { copyAuthCookies, dispatchBetterAuth } from "@/lib/auth/server";
import { isDatabaseConfigured } from "@/lib/db";

const requestSchema = z.object({
  email: z.string().trim().email().max(254),
  password: z.string().min(1).max(128),
  next: z.string().max(2000).optional(),
});

type AuthPayload = { user?: { id?: unknown } };

export async function POST(request: NextRequest) {
  const parsed = requestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return authErrorResponse("INVALID_CREDENTIALS", "이메일 또는 비밀번호를 확인해 주세요.", 401);
  }
  if (!isDatabaseConfigured()) return authNotConfiguredResponse();

  let authResponse;
  try {
    authResponse = await dispatchBetterAuth(request, "sign-in/email", {
      email: parsed.data.email.toLowerCase(),
      password: parsed.data.password,
      rememberMe: true,
    });
  } catch {
    return authErrorResponse("AUTH_UNAVAILABLE", "로그인 서비스를 잠시 사용할 수 없습니다.", 503);
  }
  if (!authResponse) return authNotConfiguredResponse();
  if (!authResponse.ok) {
    if (authResponse.status >= 500) {
      return authErrorResponse("AUTH_UNAVAILABLE", "로그인 서비스를 잠시 사용할 수 없습니다.", 503);
    }
    return authErrorResponse("INVALID_CREDENTIALS", "이메일 또는 비밀번호를 확인해 주세요.", 401);
  }

  const payload = await authResponse.clone().json().catch(() => null) as AuthPayload | null;
  const userId = typeof payload?.user?.id === "string" ? payload.user.id : null;
  if (!userId) {
    return authErrorResponse("AUTH_UNAVAILABLE", "로그인 서비스를 잠시 사용할 수 없습니다.", 503);
  }

  try {
    const profile = await getAccountProfile(userId);
    const authority = profile
      ? { isSuspended: Boolean(profile.suspendedAt) }
      : await getAccountAuthority(userId);
    if (!authority) {
      return authErrorResponse("AUTH_UNAVAILABLE", "로그인 서비스를 잠시 사용할 수 없습니다.", 503);
    }
    if (authority.isSuspended) {
      return authErrorResponse("ACCOUNT_SUSPENDED", "이용이 제한된 계정입니다.", 403);
    }

    const next = sanitizeAuthRedirect(parsed.data.next);
    const redirectTo = profile?.onboardingCompletedAt ? next : buildProfileRedirect(next);
    const response = NextResponse.json({
      ok: true,
      isNewUser: !profile?.onboardingCompletedAt,
      message: profile?.onboardingCompletedAt ? "로그인했습니다." : "프로필 설정을 완료해 주세요.",
      redirectTo,
    });
    return copyAuthCookies(authResponse, response);
  } catch {
    // The new session cookie is deliberately not copied on an authorization/DB failure.
    return authErrorResponse("AUTH_UNAVAILABLE", "로그인 서비스를 잠시 사용할 수 없습니다.", 503);
  }
}
