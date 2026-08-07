import { randomUUID } from "node:crypto";
import { del, put } from "@vercel/blob";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { authErrorResponse } from "@/lib/auth/api";
import { normalizeAvatar, parseAvatarDataUrl } from "@/lib/auth/avatar";
import {
  completeAccountOnboarding,
  getAccountProfile,
  isNicknameConflict,
  isOnboardingConflict,
  updateAccountProfile,
} from "@/lib/auth/profile";
import { sanitizeAuthRedirect } from "@/lib/auth/redirect";
import { requireAuthUser, type AuthRequirement } from "@/lib/auth/viewer";

const nicknameSchema = z.string()
  .trim()
  .min(2)
  .max(20)
  .refine((value) => !/[\u0000-\u001f\u007f]/.test(value));

const requestSchema = z.object({
  nickname: nicknameSchema,
  isOver14: z.literal(true),
  termsAccepted: z.literal(true),
  privacyAccepted: z.literal(true),
  avatarDataUrl: z.string().max(2_900_000).optional(),
  next: z.string().max(2000).optional(),
});

const updateSchema = z.object({
  nickname: nicknameSchema,
  bio: z.string().trim().max(500).default(""),
  avatarDataUrl: z.string().max(2_900_000).optional(),
  removeAvatar: z.boolean().optional(),
}).refine((value) => !(value.avatarDataUrl && value.removeAvatar));

function authRequirementResponse(result: Exclude<AuthRequirement, { ok: true }>) {
  if (result.code === "ACCOUNT_SUSPENDED") {
    return authErrorResponse(result.code, "이용이 제한된 계정입니다.", result.status);
  }
  if (result.code === "ONBOARDING_REQUIRED") {
    return authErrorResponse(result.code, "프로필 설정을 먼저 완료해 주세요.", result.status);
  }
  if (result.status === 401) {
    return authErrorResponse(result.code, "로그인이 필요합니다.", result.status);
  }
  return authErrorResponse(result.code, "로그인 서비스를 잠시 사용할 수 없습니다.", result.status);
}

async function uploadAvatar(userId: string, dataUrl: string) {
  const avatar = parseAvatarDataUrl(dataUrl);
  if (!avatar) return null;

  const normalized = await normalizeAvatar(avatar.bytes);
  const pathname = `avatars/${userId}/${randomUUID()}.webp`;
  const blob = await put(pathname, normalized, {
    access: "public",
    addRandomSuffix: false,
    allowOverwrite: false,
    cacheControlMaxAge: 31_536_000,
    contentType: "image/webp",
  });

  return { url: blob.url, blobPath: blob.pathname };
}

async function deleteAvatar(blobPath: string | null | undefined) {
  if (!blobPath) return;
  await del(blobPath).catch(() => undefined);
}

export async function POST(request: NextRequest) {
  const parsed = requestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return authErrorResponse(
      "INVALID_REQUEST",
      "닉네임과 필수 동의 항목을 확인해 주세요.",
    );
  }

  const auth = await requireAuthUser({ onboarding: false });
  if (!auth.ok) return authRequirementResponse(auth);

  let previousProfile;
  try {
    previousProfile = await getAccountProfile(auth.viewer.id);
  } catch {
    return authErrorResponse("AUTH_UNAVAILABLE", "프로필 서비스를 잠시 사용할 수 없습니다.", 503);
  }
  if (previousProfile?.onboardingCompletedAt) {
    return authErrorResponse("ONBOARDING_ALREADY_COMPLETED", "가입 동의는 이미 완료되었습니다.", 409);
  }

  let uploadedAvatar: { url: string; blobPath: string } | null = null;
  let warning: string | null = null;
  if (parsed.data.avatarDataUrl) {
    if (!parseAvatarDataUrl(parsed.data.avatarDataUrl)) {
      warning = "회원가입은 완료됐지만 사진 형식을 확인하지 못했습니다. 2MB 이하의 JPG, PNG, WEBP 파일을 프로필 설정에서 다시 올려 주세요.";
    } else {
      uploadedAvatar = await uploadAvatar(auth.viewer.id, parsed.data.avatarDataUrl).catch(() => null);
      if (!uploadedAvatar) {
        warning = "회원가입은 완료됐지만 사진을 저장하지 못했습니다. 프로필 설정에서 다시 올려 주세요.";
      }
    }
  }

  try {
    const profile = await completeAccountOnboarding({
      userId: auth.viewer.id,
      nickname: parsed.data.nickname,
      avatarUrl: uploadedAvatar?.url,
      avatarBlobPath: uploadedAvatar?.blobPath,
    });

    if (uploadedAvatar && previousProfile?.avatarBlobPath !== uploadedAvatar.blobPath) {
      await deleteAvatar(previousProfile?.avatarBlobPath);
    }

    return NextResponse.json({
      ok: true,
      isNewUser: !previousProfile?.onboardingCompletedAt,
      message: warning ?? "회원가입이 완료되었습니다.",
      redirectTo: sanitizeAuthRedirect(parsed.data.next),
      avatarUploaded: parsed.data.avatarDataUrl ? Boolean(uploadedAvatar) : null,
      warning,
      profile: {
        nickname: profile.nickname,
        bio: profile.bio,
        avatarUrl: profile.avatarUrl,
      },
    });
  } catch (error) {
    await deleteAvatar(uploadedAvatar?.blobPath);
    if (isNicknameConflict(error)) {
      return authErrorResponse("NICKNAME_TAKEN", "이미 사용 중인 닉네임입니다.", 409);
    }
    if (isOnboardingConflict(error)) {
      return authErrorResponse("ONBOARDING_ALREADY_COMPLETED", "가입 동의는 이미 완료되었습니다.", 409);
    }
    return authErrorResponse("PROFILE_SAVE_FAILED", "프로필을 저장하지 못했습니다. 잠시 후 다시 시도해 주세요.", 503);
  }
}

export async function PATCH(request: NextRequest) {
  const parsed = updateSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return authErrorResponse("INVALID_REQUEST", "닉네임과 프로필 정보를 확인해 주세요.");
  }

  const auth = await requireAuthUser();
  if (!auth.ok) return authRequirementResponse(auth);

  let currentProfile;
  try {
    currentProfile = await getAccountProfile(auth.viewer.id);
  } catch {
    return authErrorResponse("AUTH_UNAVAILABLE", "프로필 서비스를 잠시 사용할 수 없습니다.", 503);
  }
  if (!currentProfile) {
    return authErrorResponse("ONBOARDING_REQUIRED", "프로필 설정을 먼저 완료해 주세요.", 403);
  }

  let uploadedAvatar: { url: string; blobPath: string } | null = null;
  if (parsed.data.avatarDataUrl) {
    if (!parseAvatarDataUrl(parsed.data.avatarDataUrl)) {
      return authErrorResponse("INVALID_AVATAR", "프로필 사진은 2MB 이하의 JPG, PNG, WEBP 파일만 사용할 수 있어요.");
    }
    uploadedAvatar = await uploadAvatar(auth.viewer.id, parsed.data.avatarDataUrl).catch(() => null);
    if (!uploadedAvatar) {
      return authErrorResponse("AVATAR_UPLOAD_FAILED", "프로필 사진을 저장하지 못했습니다. 잠시 후 다시 시도해 주세요.", 503);
    }
  }

  try {
    const profile = await updateAccountProfile({
      userId: auth.viewer.id,
      nickname: parsed.data.nickname,
      bio: parsed.data.bio,
      avatar: uploadedAvatar,
      updateAvatar: Boolean(uploadedAvatar || parsed.data.removeAvatar),
    });
    if (!profile) {
      await deleteAvatar(uploadedAvatar?.blobPath);
      return authErrorResponse("ONBOARDING_REQUIRED", "프로필 설정을 먼저 완료해 주세요.", 403);
    }

    if ((uploadedAvatar || parsed.data.removeAvatar) && currentProfile.avatarBlobPath !== uploadedAvatar?.blobPath) {
      await deleteAvatar(currentProfile.avatarBlobPath);
    }

    return NextResponse.json({
      ok: true,
      message: "프로필을 저장했어요.",
      profile: {
        nickname: profile.nickname,
        bio: profile.bio,
        avatarUrl: profile.avatarUrl,
      },
    });
  } catch (error) {
    await deleteAvatar(uploadedAvatar?.blobPath);
    if (isNicknameConflict(error)) {
      return authErrorResponse("NICKNAME_TAKEN", "이미 사용 중인 닉네임입니다.", 409);
    }
    return authErrorResponse("PROFILE_SAVE_FAILED", "프로필을 저장하지 못했습니다. 잠시 후 다시 시도해 주세요.", 503);
  }
}
