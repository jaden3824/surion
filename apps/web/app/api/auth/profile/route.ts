import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { authErrorResponse, authNotConfiguredResponse } from "@/lib/auth/api";
import { normalizeAvatar, parseAvatarDataUrl } from "@/lib/auth/avatar";
import { sanitizeAuthRedirect } from "@/lib/auth/redirect";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const requestSchema = z.object({
  nickname: z.string().trim().min(2).max(30),
  isOver14: z.literal(true),
  termsAccepted: z.literal(true),
  privacyAccepted: z.literal(true),
  avatarDataUrl: z.string().max(2_900_000).optional(),
  next: z.string().max(2000).optional(),
});

const updateSchema = z.object({
  nickname: z.string().trim().min(2).max(30),
  bio: z.string().trim().max(500).default(""),
  avatarDataUrl: z.string().max(2_900_000).optional(),
  removeAvatar: z.boolean().optional(),
}).refine((value) => !(value.avatarDataUrl && value.removeAvatar));

export async function POST(request: NextRequest) {
  const parsed = requestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return authErrorResponse(
      "INVALID_REQUEST",
      "닉네임과 필수 동의 항목을 확인해 주세요.",
    );
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) return authNotConfiguredResponse();

  const { data: auth, error: authError } = await supabase.auth.getUser();
  if (authError || !auth.user) {
    return authErrorResponse("UNAUTHORIZED", "로그인이 필요합니다.", 401);
  }

  const avatar = parsed.data.avatarDataUrl
    ? parseAvatarDataUrl(parsed.data.avatarDataUrl)
    : null;
  const avatarValidationWarning = parsed.data.avatarDataUrl && !avatar
    ? "회원가입은 완료됐지만 사진 형식을 확인하지 못했습니다. 2MB 이하의 JPG, PNG, WEBP 파일을 프로필 설정에서 다시 올려 주세요."
    : null;

  const { error } = await supabase.rpc("complete_onboarding", {
    p_nickname: parsed.data.nickname,
    p_terms_version: "2026-08-07",
    p_privacy_version: "2026-08-07",
    p_age_confirmed: parsed.data.isOver14,
  });

  if (error) {
    return authErrorResponse(
      "PROFILE_SAVE_FAILED",
      "프로필을 저장하지 못했습니다. 잠시 후 다시 시도해 주세요.",
      500,
    );
  }

  let avatarPath: string | null = null;
  let avatarWarning: string | null = avatarValidationWarning;
  if (avatar) {
    const pendingAvatarPath = `${auth.user.id}/avatar`;
    const normalizedAvatar = await normalizeAvatar(avatar.bytes).catch(() => null);
    const { error: uploadError } = normalizedAvatar
      ? await supabase.storage
        .from("avatars")
        .upload(pendingAvatarPath, normalizedAvatar, {
          cacheControl: "3600",
          contentType: "image/webp",
          upsert: true,
        })
      : { error: new Error("AVATAR_PROCESSING_FAILED") };

    if (uploadError) {
      avatarWarning = "회원가입은 완료됐지만 사진을 저장하지 못했습니다. 프로필 설정에서 다시 올려 주세요.";
    } else {
      const { error: avatarProfileError } = await supabase.rpc("set_profile_avatar", {
        p_avatar_path: pendingAvatarPath,
      });
      if (avatarProfileError) {
        avatarWarning = "회원가입은 완료됐지만 사진을 연결하지 못했습니다. 프로필 설정에서 다시 올려 주세요.";
      } else {
        avatarPath = pendingAvatarPath;
      }
    }
  }

  return NextResponse.json({
    ok: true,
    isNewUser: true,
    message: avatarWarning ?? "회원가입이 완료되었습니다.",
    redirectTo: sanitizeAuthRedirect(parsed.data.next),
    avatarPath,
    avatarUploaded: avatar ? Boolean(avatarPath) : null,
    warning: avatarWarning,
  });
}

export async function PATCH(request: NextRequest) {
  const parsed = updateSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return authErrorResponse("INVALID_REQUEST", "닉네임과 프로필 정보를 확인해 주세요.");
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) return authNotConfiguredResponse();

  const { data: auth, error: authError } = await supabase.auth.getUser();
  if (authError || !auth.user) {
    return authErrorResponse("UNAUTHORIZED", "로그인이 필요합니다.", 401);
  }

  const { data: currentProfile } = await supabase
    .from("profiles")
    .select("avatar_path")
    .eq("user_id", auth.user.id)
    .maybeSingle();

  let normalizedAvatar: Buffer | null = null;
  const avatarPath = `${auth.user.id}/avatar`;
  if (parsed.data.avatarDataUrl) {
    const avatar = parseAvatarDataUrl(parsed.data.avatarDataUrl);
    if (!avatar) {
      return authErrorResponse("INVALID_AVATAR", "프로필 사진은 2MB 이하의 JPG, PNG, WEBP 파일만 사용할 수 있어요.");
    }
    normalizedAvatar = await normalizeAvatar(avatar.bytes).catch(() => null);
    if (!normalizedAvatar) {
      return authErrorResponse("INVALID_AVATAR", "프로필 사진을 처리하지 못했습니다. 다른 사진을 선택해 주세요.");
    }
    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(avatarPath, normalizedAvatar, {
        cacheControl: "3600",
        contentType: "image/webp",
        upsert: true,
      });
    if (uploadError) {
      return authErrorResponse("AVATAR_UPLOAD_FAILED", "프로필 사진을 저장하지 못했습니다. 잠시 후 다시 시도해 주세요.", 500);
    }
  }

  const updates: {
    nickname: string;
    bio: string;
    updated_at: string;
    avatar_path?: string | null;
  } = {
    nickname: parsed.data.nickname,
    bio: parsed.data.bio,
    updated_at: new Date().toISOString(),
  };
  if (normalizedAvatar) updates.avatar_path = avatarPath;
  if (parsed.data.removeAvatar) updates.avatar_path = null;

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .update(updates)
    .eq("user_id", auth.user.id)
    .select("nickname, bio, avatar_path, updated_at")
    .single();

  if (profileError) {
    return authErrorResponse("PROFILE_SAVE_FAILED", "프로필을 저장하지 못했습니다. 잠시 후 다시 시도해 주세요.", 500);
  }

  if (parsed.data.removeAvatar && currentProfile?.avatar_path) {
    await supabase.storage.from("avatars").remove([currentProfile.avatar_path]);
  }

  const avatarUrl = profile.avatar_path
    ? `${supabase.storage.from("avatars").getPublicUrl(profile.avatar_path).data.publicUrl}?v=${encodeURIComponent(profile.updated_at)}`
    : null;

  return NextResponse.json({
    ok: true,
    message: "프로필을 저장했어요.",
    profile: { nickname: profile.nickname, bio: profile.bio, avatarUrl },
  });
}
