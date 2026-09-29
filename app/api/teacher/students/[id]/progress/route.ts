import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { requireTeacherSession } from "@/lib/requireTeacher";
import { getRoundForProblemNumber } from "@/lib/rounds";

// 교사 대시보드용: 학생 한 명의 문제별 상세 현황 (정답 / 오답만 있음 / 미시도)
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireTeacherSession(req);
  if (!session) return NextResponse.json({ error: "교사 로그인이 필요합니다." }, { status: 401 });

  const { id: studentId } = await params;

  const { data: student, error: studentError } = await supabaseAdmin
    .from("students")
    .select("id, student_number, name, grade, class_no")
    .eq("id", studentId)
    .maybeSingle();
  if (studentError || !student) {
    return NextResponse.json({ error: "학생을 찾을 수 없습니다." }, { status: 404 });
  }

  const { data: problems, error: problemsError } = await supabaseAdmin
    .from("python_problems")
    .select("id, problem_number, title, difficulty")
    .order("problem_number", { ascending: true });
  if (problemsError) return NextResponse.json({ error: "문제 목록을 불러오지 못했습니다." }, { status: 500 });

  const { data: submissions, error: subError } = await supabaseAdmin
    .from("submissions")
    .select("problem_id, is_correct, submitted_at")
    .eq("student_id", studentId)
    .order("submitted_at", { ascending: true });
  if (subError) return NextResponse.json({ error: "제출 기록을 불러오지 못했습니다." }, { status: 500 });

  const correctSet = new Set<string>();
  const attemptedSet = new Set<string>();
  const attemptCount = new Map<string, number>();
  let lastSubmittedAt: string | null = null;

  for (const s of submissions ?? []) {
    attemptedSet.add(s.problem_id);
    attemptCount.set(s.problem_id, (attemptCount.get(s.problem_id) ?? 0) + 1);
    if (s.is_correct) correctSet.add(s.problem_id);
    lastSubmittedAt = s.submitted_at;
  }

  const result = (problems ?? []).map((p) => {
    let status: "correct" | "wrong" | "none" = "none";
    if (correctSet.has(p.id)) status = "correct";
    else if (attemptedSet.has(p.id)) status = "wrong";
    return {
      id: p.id,
      problem_number: p.problem_number,
      title: p.title,
      difficulty: p.difficulty,
      round: getRoundForProblemNumber(p.problem_number),
      status,
      attempts: attemptCount.get(p.id) ?? 0,
    };
  });

  return NextResponse.json({
    student,
    lastSubmittedAt,
    solvedCount: correctSet.size,
    totalProblems: result.length,
    problems: result,
  });
}
