import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { authErrorResponse, authNotConfiguredResponse } from "@/lib/auth/api";
import {
  compensateNewAuthUser,
  completeAccountOnboarding,
  isNicknameConflict,
} from "@/lib/auth/profile";
import { sanitizeAuthRedirect } from "@/lib/auth/redirect";
import { copyAuthCookies, dispatchBetterAuth } from "@/lib/auth/server";
import { isDatabaseConfigured } from "@/lib/db";

const nicknameSchema = z.string()
  .trim()
  .min(2)
  .max(20)
  .refine((value) => !/[\u0000-\u001f\u007f]/.test(value));

const requestSchema = z.object({
  email: z.string().trim().email().max(254),
  password: z.string().min(12).max(128),
  nickname: nicknameSchema,
  isOver14: z.literal(true),
  termsAccepted: z.literal(true),
  privacyAccepted: z.literal(true),
  next: z.string().max(2000).optional(),
});

type AuthPayload = { user?: { id?: unknown } };

export async function POST(request: NextRequest) {
  const parsed = requestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return authErrorResponse(
      "INVALID_SIGNUP",
      "이메일, 12자 이상의 비밀번호, 닉네임과 필수 동의 항목을 확인해 주세요.",
    );
  }
  if (!isDatabaseConfigured()) return authNotConfiguredResponse();

  let authResponse;
  try {
    authResponse = await dispatchBetterAuth(request, "sign-up/email", {
      email: parsed.data.email.toLowerCase(),
      password: parsed.data.password,
      name: "수리온 회원",
    });
  } catch {
    return authErrorResponse("AUTH_UNAVAILABLE", "회원가입 서비스를 잠시 사용할 수 없습니다.", 503);
  }
  if (!authResponse) return authNotConfiguredResponse();
  if (!authResponse.ok) {
    if (authResponse.status >= 500) {
      return authErrorResponse("AUTH_UNAVAILABLE", "회원가입 서비스를 잠시 사용할 수 없습니다.", 503);
    }
    return authErrorResponse(
      "SIGNUP_FAILED",
      "가입 정보를 확인해 주세요. 이미 가입한 이메일이라면 로그인해 주세요.",
      400,
    );
  }

  const payload = await authResponse.clone().json().catch(() => null) as AuthPayload | null;
  const userId = typeof payload?.user?.id === "string" ? payload.user.id : null;
  if (!userId) {
    return authErrorResponse("AUTH_UNAVAILABLE", "회원가입 서비스를 잠시 사용할 수 없습니다.", 503);
  }

  try {
    await completeAccountOnboarding({
      userId,
      nickname: parsed.data.nickname,
    });
  } catch (error) {
    const compensated = await compensateNewAuthUser(userId).catch(() => false);
    if (!compensated) {
      return authErrorResponse("SIGNUP_ROLLBACK_FAILED", "계정 정리가 필요합니다. 잠시 후 다시 시도해 주세요.", 503);
    }
    if (isNicknameConflict(error)) {
      return authErrorResponse("NICKNAME_TAKEN", "이미 사용 중인 닉네임입니다.", 409);
    }
    return authErrorResponse("PROFILE_SAVE_FAILED", "회원가입을 완료하지 못했습니다. 잠시 후 다시 시도해 주세요.", 503);
  }

  const response = NextResponse.json({
    ok: true,
    isNewUser: true,
    onboardingComplete: true,
    message: "회원가입이 완료되었습니다.",
    redirectTo: sanitizeAuthRedirect(parsed.data.next),
  });
  return copyAuthCookies(authResponse, response);
}
