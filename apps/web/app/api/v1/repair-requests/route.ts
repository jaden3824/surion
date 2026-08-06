import { NextResponse } from "next/server";
import { createRepairRequestSchema } from "@surion/contracts";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const input = createRepairRequestSchema.safeParse(await request.json());
  if (!input.success) return NextResponse.json({ error: input.error.flatten() }, { status: 400 });
  const supabase = await createSupabaseServerClient();
  if (!supabase) return NextResponse.json({ data: { id: crypto.randomUUID(), status: "PENDING", ...input.data }, mode: "demo" }, { status: 201 });
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  const { data, error } = await supabase.rpc("create_repair_request", { p_case_id: input.data.caseId, p_expert_id: input.data.expertId, p_method: input.data.method, p_preferred_date: input.data.preferredDate, p_note: input.data.note });
  if (error) return NextResponse.json({ error: error.message }, { status: 403 });
  return NextResponse.json({ data }, { status: 201 });
}
