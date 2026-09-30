import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { requireTeacherSession } from "@/lib/requireTeacher";

// 교사 대시보드용: 학생별 프로젝트 제출 현황 요약
export async function GET(req: NextRequest) {
  const session = await requireTeacherSession(req);
  if (!session) return NextResponse.json({ error: "교사 로그인이 필요합니다." }, { status: 401 });

  const { data: students, error: studentsError } = await supabaseAdmin
    .from("students")
    .select("id, student_number, name, grade, class_no")
    .order("student_number", { ascending: true });
  if (studentsError) return NextResponse.json({ error: "학생 목록을 불러오지 못했습니다." }, { status: 500 });

  const { data: reports, error: reportsError } = await supabaseAdmin
    .from("project_reports")
    .select("student_id, title, submitted, submitted_at, updated_at");
  if (reportsError) return NextResponse.json({ error: "제출 현황을 불러오지 못했습니다." }, { status: 500 });

  const reportByStudent = new Map((reports ?? []).map((r) => [r.student_id, r]));

  const result = (students ?? []).map((st) => {
    const r = reportByStudent.get(st.id);
    return {
      id: st.id,
      student_number: st.student_number,
      name: st.name,
      grade: st.grade,
      class_no: st.class_no,
      title: r?.title || null,
      submitted: r?.submitted ?? false,
      submittedAt: r?.submitted_at ?? null,
      updatedAt: r?.updated_at ?? null,
      hasDraft: !!r,
    };
  });

  return NextResponse.json({ students: result });
}
