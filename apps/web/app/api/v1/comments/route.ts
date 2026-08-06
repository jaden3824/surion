import { NextResponse } from "next/server";
import { createCommentSchema } from "@surion/contracts";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const input = createCommentSchema.safeParse(await request.json());
  if (!input.success) return NextResponse.json({ error: input.error.flatten() }, { status: 400 });
  const supabase = await createSupabaseServerClient();
  if (!supabase) return NextResponse.json({ data: { id: crypto.randomUUID(), ...input.data }, mode: "demo" }, { status: 201 });
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  const { data, error } = await supabase.from("comments").insert({ case_id: input.data.caseId, type: input.data.type, body: input.data.body, reply_to_comment_id: input.data.replyToCommentId, author_id: auth.user.id }).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ data }, { status: 201 });
}
