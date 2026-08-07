import { NextRequest, NextResponse } from "next/server";
import { authErrorResponse, authNotConfiguredResponse } from "@/lib/auth/api";
import { sanitizeAuthRedirect } from "@/lib/auth/redirect";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function prefersHtml(request: NextRequest) {
  return request.headers.get("accept")?.split(",").some((value) => value.includes("text/html")) ?? false;
}

function loginErrorRedirect(request: NextRequest, code: string, next: string) {
  const destination = new URL("/login", request.nextUrl.origin);
  destination.searchParams.set("auth_error", code);
  destination.searchParams.set("next", next);
  return NextResponse.redirect(destination);
}

export async function GET(request: NextRequest) {
  const next = sanitizeAuthRedirect(request.nextUrl.searchParams.get("next"));
  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return prefersHtml(request)
      ? loginErrorRedirect(request, "not_configured", next)
      : authNotConfiguredResponse();
  }

  const callbackUrl = new URL("/auth/callback", request.nextUrl.origin);
  callbackUrl.searchParams.set("next", next);

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "kakao",
    options: {
      redirectTo: callbackUrl.toString(),
      skipBrowserRedirect: true,
    },
  });

  if (error || !data.url) {
    if (prefersHtml(request)) return loginErrorRedirect(request, "oauth", next);
    return authErrorResponse(
      "OAUTH_START_FAILED",
      "카카오 로그인을 시작하지 못했습니다. 잠시 후 다시 시도해 주세요.",
      502,
    );
  }

  return NextResponse.redirect(data.url);
}
