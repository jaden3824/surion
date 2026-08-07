import { NextRequest, NextResponse } from "next/server";
import { authErrorResponse, authNotConfiguredResponse } from "@/lib/auth/api";
import { copyAuthCookies, dispatchBetterAuth } from "@/lib/auth/server";

export async function POST(request: NextRequest) {
  let authResponse;
  try {
    authResponse = await dispatchBetterAuth(request, "sign-out");
  } catch {
    return authErrorResponse("LOGOUT_FAILED", "로그아웃하지 못했습니다. 잠시 후 다시 시도해 주세요.", 503);
  }
  if (!authResponse) return authNotConfiguredResponse();
  if (!authResponse.ok) {
    return authErrorResponse("LOGOUT_FAILED", "로그아웃하지 못했습니다. 잠시 후 다시 시도해 주세요.", 502);
  }

  const response = NextResponse.json({
    ok: true,
    message: "로그아웃했습니다.",
    redirectTo: "/",
  });
  return copyAuthCookies(authResponse, response);
}
