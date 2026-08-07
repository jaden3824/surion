import { NextResponse } from "next/server";
import { createRepairRequestSchema } from "@surion/contracts";
import { contentPersistenceUnavailable, requireContentWriter } from "@/app/api/v1/_shared";

export async function POST(request: Request) {
  const access = await requireContentWriter();
  if (!access.ok) return access.response;

  const input = createRepairRequestSchema.safeParse(await request.json().catch(() => null));
  if (!input.success) return NextResponse.json({ error: input.error.flatten() }, { status: 400 });

  // The migrated profile schema does not yet include verified expert records.
  // Keeping this endpoint closed prevents a client-supplied expert id from
  // bypassing the eventual server-side verification check.
  return contentPersistenceUnavailable();
}
