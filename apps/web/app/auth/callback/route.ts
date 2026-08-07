import { NextRequest, NextResponse } from "next/server";
import { buildProfileRedirect, sanitizeAuthRedirect } from "@/lib/auth/redirect";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function loginErrorRedirect(request: NextRequest, code: string) {
  const destination = new URL("/login", request.nextUrl.origin);
  destination.searchParams.set("auth_error", code);
  destination.searchParams.set(
    "next",
    sanitizeAuthRedirect(request.nextUrl.searchParams.get("next")),
  );
  return NextResponse.redirect(destination);
}

export async function GET(request: NextRequest) {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return loginErrorRedirect(request, "not_configured");

  const code = request.nextUrl.searchParams.get("code");
  if (!code) return loginErrorRedirect(request, "oauth");

  const { data, error } = await supabase.auth.exchangeCodeForSession(code);
  if (error || !data.user) return loginErrorRedirect(request, "oauth");

  const next = sanitizeAuthRedirect(request.nextUrl.searchParams.get("next"));
  const { data: consent } = await supabase
    .from("account_consents")
    .select("user_id")
    .eq("user_id", data.user.id)
    .maybeSingle();

  const destination = consent ? next : buildProfileRedirect(next, true);
  return NextResponse.redirect(new URL(destination, request.nextUrl.origin));
}
