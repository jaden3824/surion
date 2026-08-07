import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { authErrorResponse, authNotConfiguredResponse } from "@/lib/auth/api";
import { buildProfileRedirect, sanitizeAuthRedirect } from "@/lib/auth/redirect";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const requestSchema = z.object({
  email: z.string().trim().email().max(254),
  code: z.string().trim().regex(/^\d{6,10}$/),
  nickname: z.string().trim().min(2).max(30).optional(),
  isOver14: z.boolean().optional(),
  termsAccepted: z.boolean().optional(),
  privacyAccepted: z.boolean().optional(),
  next: z.string().max(2000).optional(),
});

export async function POST(request: NextRequest) {
  const parsed = requestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return authErrorResponse("INVALID_REQUEST", "이메일과 인증번호를 확인해 주세요.");
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) return authNotConfiguredResponse();

  const { data, error } = await supabase.auth.verifyOtp({
    email: parsed.data.email,
    token: parsed.data.code,
    type: "email",
  });

  if (error || !data.user) {
    return authErrorResponse(
      "INVALID_OTP",
      "인증번호가 올바르지 않거나 만료되었습니다.",
    );
  }

  const next = sanitizeAuthRedirect(parsed.data.next);
  const { data: consent } = await supabase
    .from("account_consents")
    .select("user_id")
    .eq("user_id", data.user.id)
    .maybeSingle();
  const isNewUser = !consent;

  const canCompleteNow = isNewUser
    && parsed.data.nickname
    && parsed.data.isOver14 === true
    && parsed.data.termsAccepted === true
    && parsed.data.privacyAccepted === true;

  if (canCompleteNow) {
    const { error: profileError } = await supabase.rpc("complete_onboarding", {
      p_nickname: parsed.data.nickname,
      p_terms_version: "2026-08-07",
      p_privacy_version: "2026-08-07",
      p_age_confirmed: true,
    });
    if (profileError) {
      return authErrorResponse(
        "PROFILE_SAVE_FAILED",
        "프로필을 저장하지 못했습니다. 잠시 후 다시 시도해 주세요.",
        500,
      );
    }
  }

  const redirectTo = isNewUser && !canCompleteNow ? buildProfileRedirect(next) : next;
  return NextResponse.json({
    ok: true,
    isNewUser,
    message: isNewUser && !canCompleteNow ? "프로필 설정을 완료해 주세요." : "로그인했습니다.",
    redirectTo,
  });
}
