import { NextResponse } from "next/server";
import { requireAuthUser, type AuthRequirement } from "@/lib/auth/viewer";

type ContentAccessResult =
  | { ok: true }
  | { ok: false; response: NextResponse };

/**
 * Content writes must never fall back to browser-only or generated demo data.
 * Authentication and account status are checked before a route reports that
 * shared content persistence is not available yet.
 */
export async function requireContentWriter(): Promise<ContentAccessResult> {
  const auth = await requireAuthUser();
  if (!auth.ok) {
    const messages: Record<Extract<AuthRequirement, { ok: false }>["code"], string> = {
      AUTH_NOT_CONFIGURED: "현재 로그인 서비스를 사용할 수 없습니다.",
      AUTH_UNAVAILABLE: "로그인 상태를 확인하지 못했습니다. 잠시 후 다시 시도해 주세요.",
      UNAUTHORIZED: "로그인이 필요합니다.",
      ACCOUNT_SUSPENDED: "이 계정은 현재 글을 작성할 수 없습니다.",
      ONBOARDING_REQUIRED: "프로필 설정과 필수 동의를 먼저 완료해 주세요.",
    };

    return {
      ok: false,
      response: NextResponse.json(
        {
          ok: false,
          code: auth.code,
          message: messages[auth.code],
        },
        { status: auth.status, headers: { "Cache-Control": "no-store" } },
      ),
    };
  }

  return { ok: true };
}

/**
 * The Neon migration in this release covers identity/profile data only. Until
 * community tables and their server-side authorization rules are migrated,
 * reject every mutation instead of acknowledging data that was not persisted.
 */
export function contentPersistenceUnavailable() {
  return NextResponse.json(
    {
      ok: false,
      code: "CONTENT_WRITE_UNAVAILABLE",
      message: "공용 게시글 저장 기능을 준비하고 있습니다. 입력한 내용은 저장되지 않았습니다.",
    },
    { status: 503, headers: { "Cache-Control": "no-store" } },
  );
}
