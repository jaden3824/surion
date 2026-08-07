import { del } from "@vercel/blob";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { authErrorResponse, authNotConfiguredResponse } from "@/lib/auth/api";
import { getAccountProfile } from "@/lib/auth/profile";
import {
  copyAuthCookies,
  dispatchBetterAuth,
  getCurrentAuthUser,
} from "@/lib/auth/server";

const requestSchema = z.object({
  password: z.string().min(1).max(128),
});

export async function DELETE(request: NextRequest) {
  const parsed = requestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return authErrorResponse("CURRENT_PASSWORD_REQUIRED", "현재 비밀번호를 입력해 주세요.");
  }

  const session = await getCurrentAuthUser();
  if (!session.configured) return authNotConfiguredResponse();
  if (session.unavailable) {
    return authErrorResponse("AUTH_UNAVAILABLE", "계정 서비스를 잠시 사용할 수 없습니다.", 503);
  }
  if (!session.user) {
    return authErrorResponse("UNAUTHORIZED", "로그인이 필요합니다.", 401);
  }

  let avatarBlobPath: string | null = null;
  try {
    avatarBlobPath = (await getAccountProfile(session.user.id))?.avatarBlobPath ?? null;
  } catch {
    return authErrorResponse("AUTH_UNAVAILABLE", "계정 서비스를 잠시 사용할 수 없습니다.", 503);
  }

  let authResponse;
  try {
    authResponse = await dispatchBetterAuth(request, "delete-user", {
      password: parsed.data.password,
    });
  } catch {
    return authErrorResponse("AUTH_UNAVAILABLE", "계정 서비스를 잠시 사용할 수 없습니다.", 503);
  }
  if (!authResponse) return authNotConfiguredResponse();
  if (!authResponse.ok) {
    if (authResponse.status >= 500) {
      return authErrorResponse("AUTH_UNAVAILABLE", "계정 서비스를 잠시 사용할 수 없습니다.", 503);
    }
    return authErrorResponse("INVALID_CURRENT_PASSWORD", "현재 비밀번호를 확인해 주세요.", 401);
  }

  let warning: string | null = null;
  if (avatarBlobPath) {
    const removed = await del(avatarBlobPath).then(() => true).catch(() => false);
    if (!removed) warning = "계정은 삭제되었지만 프로필 사진 정리가 지연되고 있습니다.";
  }

  const response = NextResponse.json({
    ok: true,
    message: warning ?? "계정과 프로필을 삭제했습니다.",
    redirectTo: "/",
    warning,
  });
  return copyAuthCookies(authResponse, response);
}
