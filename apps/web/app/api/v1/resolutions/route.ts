import { NextResponse } from "next/server";
import { z } from "zod";
import { contentPersistenceUnavailable, requireContentWriter } from "@/app/api/v1/_shared";

const resolutionSchema = z.object({
  caseId: z.string().uuid(),
  method: z.enum(["직접 해결", "수리온 전문가에게 수리", "외부 수리업체", "제조사 서비스센터", "제품 교체", "미해결 종료"]),
  cause: z.string().min(2),
  summary: z.string().min(5),
  cost: z.number().nonnegative().optional(),
  duration: z.string(),
  working: z.boolean(),
  review: z.string().optional(),
});

export async function POST(request: Request) {
  const access = await requireContentWriter();
  if (!access.ok) return access.response;

  const input = resolutionSchema.safeParse(await request.json().catch(() => null));
  if (!input.success) return NextResponse.json({ error: input.error.flatten() }, { status: 400 });

  // Resolving a post must compare the authenticated user with the post author.
  // The post table is intentionally not migrated in this auth-only release.
  return contentPersistenceUnavailable();
}
