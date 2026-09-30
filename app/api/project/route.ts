import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { requireStudentSession } from "@/lib/requireStudent";

// 학생 본인의 "파이썬 문제해결 프로젝트" 보고서를 가져옵니다. 아직 없으면 report: null 반환.
export async function GET(req: NextRequest) {
  const session = await requireStudentSession(req);
  if (!session) return NextResponse.json({ error: "학생 로그인이 필요합니다." }, { status: 401 });

  const { data, error } = await supabaseAdmin
    .from("project_reports")
    .select("*")
    .eq("student_id", session.id)
    .maybeSingle();

  if (error) return NextResponse.json({ error: "보고서를 불러오지 못했습니다." }, { status: 500 });

  return NextResponse.json({ report: data ?? null });
}

// 저장(임시저장) 또는 제출. body.submitted가 true면 제출 완료로 표시합니다.
export async function POST(req: NextRequest) {
  const session = await requireStudentSession(req);
  if (!session) return NextResponse.json({ error: "학생 로그인이 필요합니다." }, { status: 401 });

  const body = await req.json();
  const {
    title,
    purpose,
    algorithmDesign,
    code,
    runOutput,
    runNote,
    review,
    aiUsageNote,
    selfCheck,
    submitted,
  } = body;

  const { data: existing } = await supabaseAdmin
    .from("project_reports")
    .select("id, submitted_at")
    .eq("student_id", session.id)
    .maybeSingle();

  const payload = {
    student_id: session.id,
    title: title ?? "",
    purpose: purpose ?? "",
    algorithm_design: algorithmDesign ?? "",
    code: code ?? "",
    run_output: runOutput ?? "",
    run_note: runNote ?? "",
    review: review ?? "",
    ai_usage_note: aiUsageNote ?? "",
    self_check: selfCheck ?? {},
    submitted: !!submitted,
    submitted_at: submitted ? new Date().toISOString() : existing?.submitted_at ?? null,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabaseAdmin
    .from("project_reports")
    .upsert(payload, { onConflict: "student_id" })
    .select()
    .maybeSingle();

  if (error) return NextResponse.json({ error: "저장하지 못했습니다." }, { status: 500 });

  return NextResponse.json({ report: data });
}
