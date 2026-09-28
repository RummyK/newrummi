import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { createSessionToken, verifySessionToken, SESSION_COOKIE_NAME } from "@/lib/auth";
import { isPasswordValid, PASSWORD_POLICY_MESSAGE } from "@/lib/password";

// 로그인된 학생 본인이 자기 비밀번호를 바꾸는 API (현재 비밀번호 확인 후 변경)
export async function POST(req: NextRequest) {
  const token = req.cookies.get(SESSION_COOKIE_NAME)?.value;
  const session = token ? await verifySessionToken(token) : null;

  if (!session || session.role !== "student") {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  const { currentPassword, newPassword } = await req.json();
  if (!currentPassword || !newPassword) {
    return NextResponse.json({ error: "현재 비밀번호와 새 비밀번호를 입력하세요." }, { status: 400 });
  }
  if (!isPasswordValid(newPassword)) {
    return NextResponse.json({ error: PASSWORD_POLICY_MESSAGE }, { status: 400 });
  }

  const { data: student, error } = await supabaseAdmin
    .from("students")
    .select("id, password_hash")
    .eq("id", session.id)
    .maybeSingle();

  if (error || !student) {
    return NextResponse.json({ error: "계정을 찾을 수 없습니다." }, { status: 404 });
  }

  const matches = await bcrypt.compare(currentPassword, student.password_hash);
  if (!matches) {
    return NextResponse.json({ error: "현재 비밀번호가 올바르지 않습니다." }, { status: 401 });
  }

  const newHash = await bcrypt.hash(newPassword, 10);
  await supabaseAdmin
    .from("students")
    .update({ password_hash: newHash, must_change_password: false })
    .eq("id", session.id);

  const newToken = await createSessionToken(
    { role: "student", id: session.id, name: session.name, mustChangePassword: false },
    "12h"
  );

  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE_NAME, newToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 12,
  });
  return res;
}
