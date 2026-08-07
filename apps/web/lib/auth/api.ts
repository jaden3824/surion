import { NextResponse } from "next/server";

export const AUTH_NOT_CONFIGURED = {
  ok: false,
  code: "AUTH_NOT_CONFIGURED",
  message: "현재 로그인 서비스를 사용할 수 없습니다.",
} as const;

export function authNotConfiguredResponse() {
  return NextResponse.json(AUTH_NOT_CONFIGURED, { status: 503 });
}

export function authErrorResponse(code: string, message: string, status = 400) {
  return NextResponse.json({ ok: false, code, message }, { status });
}
