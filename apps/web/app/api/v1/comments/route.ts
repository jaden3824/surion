import { NextResponse } from "next/server";
import { createCommentSchema } from "@surion/contracts";
import { contentPersistenceUnavailable, requireContentWriter } from "@/app/api/v1/_shared";

export async function POST(request: Request) {
  const access = await requireContentWriter();
  if (!access.ok) return access.response;

  const input = createCommentSchema.safeParse(await request.json().catch(() => null));
  if (!input.success) return NextResponse.json({ error: input.error.flatten() }, { status: 400 });

  return contentPersistenceUnavailable();
}
