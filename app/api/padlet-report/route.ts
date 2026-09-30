import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { requireStudentSession } from "@/lib/requireStudent";
import { postToPadlet } from "@/lib/padlet";
import { buildPadletV2Subject, buildPadletV2Body } from "@/lib/padletFormat";

// 학생 본인의 "Padlet업로드 보고서"를 가져옵니다. 아직 없으면 report: null 반환.
export async function GET(req: NextRequest) {
  const session = await requireStudentSession(req);
  if (!session) return NextResponse.json({ error: "학생 로그인이 필요합니다." }, { status: 401 });

  const { data, error } = await supabaseAdmin
    .from("padlet_reports")
    .select("*")
    .eq("student_id", session.id)
    .maybeSingle();

  if (error) return NextResponse.json({ error: "보고서를 불러오지 못했습니다." }, { status: 500 });

  return NextResponse.json({ report: data ?? null, studentName: session.name });
}

// 저장(임시저장) 또는 제출.
export async function POST(req: NextRequest) {
  const session = await requireStudentSession(req);
  if (!session) return NextResponse.json({ error: "학생 로그인이 필요합니다." }, { status: 401 });

  const body = await req.json();
  const {
    subject,
    title,
    purpose,
    topicReason,
    algorithmSteps,
    keyConcepts,
    code,
    codeExplanation,
    runOutput,
    resultAnalysis,
    errorImprovement,
    learned,
    difficultyNote,
    futureDirection,
    aiUsageNote,
    selfCheck,
    submitted,
  } = body;

  const { data: existing } = await supabaseAdmin
    .from("padlet_reports")
    .select("id, submitted_at, padlet_post_id")
    .eq("student_id", session.id)
    .maybeSingle();

  const payload = {
    student_id: session.id,
    subject: subject ?? "",
    title: title ?? "",
    purpose: purpose ?? "",
    topic_reason: topicReason ?? "",
    algorithm_steps: algorithmSteps ?? [],
    key_concepts: keyConcepts ?? {},
    code: code ?? "",
    code_explanation: codeExplanation ?? "",
    run_output: runOutput ?? "",
    result_analysis: resultAnalysis ?? "",
    error_improvement: errorImprovement ?? "",
    learned: learned ?? "",
    difficulty_note: difficultyNote ?? "",
    future_direction: futureDirection ?? "",
    ai_usage_note: aiUsageNote ?? "",
    self_check: selfCheck ?? {},
    submitted: !!submitted,
    submitted_at: submitted ? new Date().toISOString() : existing?.submitted_at ?? null,
    updated_at: new Date().toISOString(),
  };

  let { data, error } = await supabaseAdmin
    .from("padlet_reports")
    .upsert(payload, { onConflict: "student_id" })
    .select()
    .maybeSingle();

  if (error) return NextResponse.json({ error: "저장하지 못했습니다." }, { status: 500 });

  // 제출 순간, 아직 Padlet에 올라간 적이 없으면 (개인 유료 계정으로 API가 설정되어 있을 때만) 자동 게시합니다.
  if (submitted && !existing?.padlet_post_id && data) {
    const postSubject = buildPadletV2Subject(session.name, title);
    const postBody = buildPadletV2Body({
      subject: subject ?? "",
      purpose: purpose ?? "",
      topicReason: topicReason ?? "",
      codeExplanation: codeExplanation ?? "",
      runOutput: runOutput ?? "",
      resultAnalysis: resultAnalysis ?? "",
      learned: learned ?? "",
      difficultyNote: difficultyNote ?? "",
      futureDirection: futureDirection ?? "",
    });
    const postId = await postToPadlet(postSubject, postBody);
    if (postId) {
      const { data: updated } = await supabaseAdmin
        .from("padlet_reports")
        .update({ padlet_post_id: postId, padlet_posted_at: new Date().toISOString() })
        .eq("student_id", session.id)
        .select()
        .maybeSingle();
      if (updated) data = updated;
    }
  }

  return NextResponse.json({ report: data });
}
