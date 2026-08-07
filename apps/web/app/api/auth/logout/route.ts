import { NextResponse } from "next/server";
import { authErrorResponse, authNotConfiguredResponse } from "@/lib/auth/api";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST() {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return authNotConfiguredResponse();

  const { error } = await supabase.auth.signOut();
  if (error) {
    return authErrorResponse(
      "LOGOUT_FAILED",
      "로그아웃하지 못했습니다. 잠시 후 다시 시도해 주세요.",
      502,
    );
  }

  return NextResponse.json({
    ok: true,
    message: "로그아웃했습니다.",
    redirectTo: "/",
  });
}
