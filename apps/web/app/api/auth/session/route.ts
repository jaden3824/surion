import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function privateJson(body: Record<string, unknown>) {
  return NextResponse.json(body, {
    headers: { "Cache-Control": "private, no-store" },
  });
}

export async function GET() {
  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return privateJson({
      ok: true,
      configured: false,
      user: null,
      profile: null,
      isOnboardingComplete: false,
    });
  }

  const { data: auth, error: authError } = await supabase.auth.getUser();
  if (authError || !auth.user) {
    return privateJson({
      ok: true,
      configured: true,
      user: null,
      profile: null,
      isOnboardingComplete: false,
    });
  }

  const [{ data: profile }, { data: consent }] = await Promise.all([
    supabase
      .from("profiles")
      .select("nickname, bio, avatar_path, updated_at")
      .eq("user_id", auth.user.id)
      .maybeSingle(),
    supabase
      .from("account_consents")
      .select("user_id")
      .eq("user_id", auth.user.id)
      .maybeSingle(),
  ]);

  const avatarUrl = profile?.avatar_path
    ? `${supabase.storage.from("avatars").getPublicUrl(profile.avatar_path).data.publicUrl}?v=${encodeURIComponent(profile.updated_at)}`
    : null;

  return privateJson({
    ok: true,
    configured: true,
    user: { id: auth.user.id, email: auth.user.email ?? null },
    profile: profile
      ? { nickname: profile.nickname, bio: profile.bio, avatarPath: profile.avatar_path, avatarUrl }
      : null,
    isOnboardingComplete: Boolean(consent),
  });
}
