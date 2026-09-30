import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { requireTeacherSession } from "@/lib/requireTeacher";

// 교사용: 학생 한 명의 Padlet업로드 보고서 전체 내용
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

  const { data: report, error: reportError } = await supabaseAdmin
    .from("padlet_reports")
    .select("*")
    .eq("student_id", studentId)
    .maybeSingle();
  if (reportError) return NextResponse.json({ error: "보고서를 불러오지 못했습니다." }, { status: 500 });

  return NextResponse.json({ student, report: report ?? null });
}
