import { NextResponse } from "next/server";
import { createCaseSchema } from "@surion/contracts";
import { initialCases } from "@/lib/demo-data";
import { contentPersistenceUnavailable, requireContentWriter } from "@/app/api/v1/_shared";

export async function GET() {
  return NextResponse.json(
    {
      data: initialCases,
      source: "seed",
      readOnly: true,
    },
    { headers: { "Cache-Control": "public, max-age=60, stale-while-revalidate=300" } },
  );
}

export async function POST(request: Request) {
  const access = await requireContentWriter();
  if (!access.ok) return access.response;

  const input = createCaseSchema.safeParse(await request.json().catch(() => null));
  if (!input.success) return NextResponse.json({ error: input.error.flatten() }, { status: 400 });

  return contentPersistenceUnavailable();
}
