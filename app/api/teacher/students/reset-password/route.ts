import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { requireTeacherSession } from "@/lib/requireTeacher";
import { isPasswordValid, PASSWORD_POLICY_MESSAGE } from "@/lib/password";

// 학생이 비밀번호를 잊어버렸을 때 교사가 임시 비밀번호로 재설정하는 API.
// 재설정 후 학생은 다음 로그인 때 반드시 새 비밀번호로 바꿔야 합니다.
export async function POST(req: NextRequest) {
  const session = await requireTeacherSession(req);
  if (!session) return NextResponse.json({ error: "교사 로그인이 필요합니다." }, { status: 401 });

  const { studentId, newPassword } = await req.json();
  if (!studentId || !newPassword) {
    return NextResponse.json({ error: "학생과 새 비밀번호를 입력하세요." }, { status: 400 });
  }
  if (!isPasswordValid(newPassword)) {
    return NextResponse.json({ error: PASSWORD_POLICY_MESSAGE }, { status: 400 });
  }

  const passwordHash = await bcrypt.hash(newPassword, 10);
  const { error } = await supabaseAdmin
    .from("students")
    .update({ password_hash: passwordHash, must_change_password: true })
    .eq("id", studentId);

  if (error) return NextResponse.json({ error: "재설정 중 오류가 발생했습니다." }, { status: 500 });

  return NextResponse.json({ ok: true });
}
