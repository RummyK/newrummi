import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { requireTeacherSession } from "@/lib/requireTeacher";

// 교사 대시보드에서 학생 목록을 보여주기 위한 API. 비밀번호 해시는 절대 응답에 포함하지 않습니다.
export async function GET(req: NextRequest) {
  const session = await requireTeacherSession(req);
  if (!session) return NextResponse.json({ error: "교사 로그인이 필요합니다." }, { status: 401 });

  const { data, error } = await supabaseAdmin
    .from("students")
    .select("id, student_number, name, grade, class_no, must_change_password, created_at")
    .order("student_number", { ascending: true });

  if (error) return NextResponse.json({ error: "학생 목록을 불러오지 못했습니다." }, { status: 500 });

  return NextResponse.json({ students: data });
}
