import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { requireTeacherSession } from "@/lib/requireTeacher";

// 교사 대시보드용: 학생별 전체 진행 현황 요약 (맞은 문제 수 / 틀린 문제 수 / 전체 문제 수)
export async function GET(req: NextRequest) {
  const session = await requireTeacherSession(req);
  if (!session) return NextResponse.json({ error: "교사 로그인이 필요합니다." }, { status: 401 });

  const { data: students, error: studentsError } = await supabaseAdmin
    .from("students")
    .select("id, student_number, name, grade, class_no")
    .order("student_number", { ascending: true });
  if (studentsError) return NextResponse.json({ error: "학생 목록을 불러오지 못했습니다." }, { status: 500 });

  const { count: totalProblems } = await supabaseAdmin
    .from("python_problems")
    .select("id", { count: "exact", head: true });

  const { data: submissions, error: subError } = await supabaseAdmin
    .from("submissions")
    .select("student_id, problem_id, is_correct");
  if (subError) return NextResponse.json({ error: "제출 기록을 불러오지 못했습니다." }, { status: 500 });

  const correctByStudent = new Map<string, Set<string>>();
  const attemptedByStudent = new Map<string, Set<string>>();

  for (const s of submissions ?? []) {
    if (!attemptedByStudent.has(s.student_id)) attemptedByStudent.set(s.student_id, new Set());
    attemptedByStudent.get(s.student_id)!.add(s.problem_id);
    if (s.is_correct) {
      if (!correctByStudent.has(s.student_id)) correctByStudent.set(s.student_id, new Set());
      correctByStudent.get(s.student_id)!.add(s.problem_id);
    }
  }

  const result = (students ?? []).map((st) => {
    const correctSet = correctByStudent.get(st.id) ?? new Set();
    const attemptedSet = attemptedByStudent.get(st.id) ?? new Set();
    const wrongOnlyCount = [...attemptedSet].filter((pid) => !correctSet.has(pid)).length;
    return {
      id: st.id,
      student_number: st.student_number,
      name: st.name,
      grade: st.grade,
      class_no: st.class_no,
      solvedCount: correctSet.size,
      wrongCount: wrongOnlyCount,
      totalProblems: totalProblems ?? 0,
    };
  });

  return NextResponse.json({ students: result });
}
