import "server-only";

import { cache } from "react";
import type { AuthViewer } from "@/lib/auth/types";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type AuthState = {
  configured: boolean;
  viewer: AuthViewer | null;
  onboardingComplete: boolean;
};

export const getAuthState = cache(async function getAuthState(): Promise<AuthState> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return { configured: false, viewer: null, onboardingComplete: false };
  }

  const { data, error } = await supabase.auth.getUser();
  const user = error ? null : data.user;
  if (!user) {
    return { configured: true, viewer: null, onboardingComplete: false };
  }

  const [{ data: profile }, { data: consent }] = await Promise.all([
    supabase.from("profiles").select("nickname, bio, avatar_path, updated_at, is_admin").eq("user_id", user.id).maybeSingle(),
    supabase.from("account_consents").select("user_id").eq("user_id", user.id).maybeSingle(),
  ]);

  const metadataNickname = typeof user.user_metadata?.nickname === "string"
    ? user.user_metadata.nickname.trim()
    : "";
  const emailPrefix = user.email?.split("@")[0]?.trim() ?? "";
  const avatarUrl = profile?.avatar_path
    ? `${supabase.storage.from("avatars").getPublicUrl(profile.avatar_path).data.publicUrl}?v=${encodeURIComponent(profile.updated_at)}`
    : null;

  return {
    configured: true,
    viewer: {
      id: user.id,
      nickname: profile?.nickname || metadataNickname || emailPrefix || "수리온 회원",
      bio: profile?.bio ?? "",
      avatarUrl,
      email: user.email ?? null,
      isAdmin: profile?.is_admin === true,
    },
    onboardingComplete: Boolean(consent),
  };
});
