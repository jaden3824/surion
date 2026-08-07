import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { authErrorResponse, authNotConfiguredResponse } from "@/lib/auth/api";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const requestSchema = z.object({
  email: z.string().trim().email().max(254),
});

export async function POST(request: NextRequest) {
  const parsed = requestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return authErrorResponse("INVALID_REQUEST", "올바른 이메일 주소를 입력해 주세요.");
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) return authNotConfiguredResponse();

  const { error } = await supabase.auth.signInWithOtp({
    email: parsed.data.email,
    options: { shouldCreateUser: true },
  });

  if (error) {
    return authErrorResponse(
      "OTP_SEND_FAILED",
      "인증번호를 보내지 못했습니다. 잠시 후 다시 시도해 주세요.",
      502,
    );
  }

  return NextResponse.json({
    ok: true,
    message: "이메일로 인증번호를 보냈습니다.",
  });
}
