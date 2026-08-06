import { NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const resolutionSchema = z.object({
  caseId: z.string().uuid(),
  method: z.enum(["직접 해결", "수리온 전문가에게 수리", "외부 수리업체", "제조사 서비스센터", "제품 교체", "미해결 종료"]),
  cause: z.string().min(2),
  summary: z.string().min(5),
  cost: z.number().nonnegative().optional(),
  duration: z.string(),
  helperCommentId: z.string().uuid().optional(),
  working: z.boolean(),
  review: z.string().optional(),
});

export async function POST(request: Request) {
  const input = resolutionSchema.safeParse(await request.json());
  if (!input.success) return NextResponse.json({ error: input.error.flatten() }, { status: 400 });
  const supabase = await createSupabaseServerClient();
  if (!supabase) return NextResponse.json({ data: input.data, mode: "demo" }, { status: 201 });
  const { data, error } = await supabase.rpc("resolve_case", { p_case_id: input.data.caseId, p_resolution: input.data });
  if (error) return NextResponse.json({ error: error.message }, { status: 403 });
  return NextResponse.json({ data }, { status: 201 });
}
