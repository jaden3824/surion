import { NextResponse } from "next/server";
import { createCommentSchema } from "@surion/contracts";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const input = createCommentSchema.safeParse(await request.json());
  if (!input.success) return NextResponse.json({ error: input.error.flatten() }, { status: 400 });
  const supabase = await createSupabaseServerClient();
  if (!supabase) return NextResponse.json({ data: { id: crypto.randomUUID(), ...input.data, type: "GENERAL" }, mode: "demo" }, { status: 201 });
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  const [{ data: targetCase }, { data: profile }, { data: expertProfile }] = await Promise.all([
    supabase.from("cases").select("author_id").eq("id", input.data.caseId).maybeSingle(),
    supabase.from("profiles").select("is_admin").eq("user_id", auth.user.id).maybeSingle(),
    supabase.from("expert_profiles").select("verification_status").eq("user_id", auth.user.id).maybeSingle(),
  ]);
  const expertStatus = expertProfile?.verification_status;
  const authorRole = targetCase?.author_id === auth.user.id
    ? "QUESTIONER"
    : profile?.is_admin
      ? "ADMIN"
      : expertStatus === "BUSINESS_VERIFIED"
        ? "BUSINESS_EXPERT"
        : expertStatus === "PERSONAL_VERIFIED"
          ? "EXPERT"
          : "USER";
  const validExpertAnswer = ["EXPERT", "BUSINESS_EXPERT"].includes(authorRole) && input.data.body.trim().length >= 30;
  const { data, error } = await supabase.from("comments").insert({
    case_id: input.data.caseId,
    type: "GENERAL",
    body: input.data.body,
    reply_to_comment_id: input.data.replyToCommentId,
    author_id: auth.user.id,
    author_role_snapshot: authorRole,
    valid_expert_answer: validExpertAnswer,
  }).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ data }, { status: 201 });
}
