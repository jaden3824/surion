import { NextResponse } from "next/server";
import { createCaseSchema } from "@surion/contracts";
import { initialCases } from "@/lib/demo-data";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return NextResponse.json({ data: initialCases, mode: "demo" });
  const { data, error } = await supabase.from("cases").select("*").order("created_at", { ascending: false }).limit(50);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data, mode: "supabase" });
}

export async function POST(request: Request) {
  const input = createCaseSchema.safeParse(await request.json());
  if (!input.success) return NextResponse.json({ error: input.error.flatten() }, { status: 400 });
  const supabase = await createSupabaseServerClient();
  if (!supabase) return NextResponse.json({ data: { id: crypto.randomUUID(), ...input.data }, mode: "demo" }, { status: 201 });
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  const { data, error } = await supabase.from("cases").insert({
    author_id: auth.user.id,
    category: input.data.category,
    brand: input.data.brand,
    model: input.data.model,
    model_identification_status: input.data.modelIdentificationStatus,
    title: input.data.title,
    symptom: input.data.symptom,
    symptom_type: input.data.symptomType,
    usage_period: input.data.usagePeriod,
    occurred_at_text: input.data.occurredAt,
    attempts_text: input.data.attempts,
    additional_info: input.data.additionalInfo,
  }).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ data }, { status: 201 });
}
