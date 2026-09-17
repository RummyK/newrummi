import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { createSessionToken, SESSION_COOKIE_NAME } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const { studentNumber, name, password } = await req.json();

  if (!studentNumber || !name || !password) {
    return NextResponse.json({ error: "학번, 이름, 비밀번호를 모두 입력하세요." }, { status: 400 });
  }

  const { data: student, error } = await supabaseAdmin
    .from("students")
    .select("id, student_number, name, password_hash")
    .eq("student_number", studentNumber)
    .eq("name", name)
    .maybeSingle();

  // 학번+이름이 일치하는 계정이 없거나 비밀번호가 틀린 경우, 어느 쪽이 틀렸는지 알려주지 않습니다.
  // (계정 존재 여부를 노출하지 않는 것이 보안상 안전합니다.)
  if (error || !student) {
    return NextResponse.json({ error: "학번, 이름 또는 비밀번호가 올바르지 않습니다." }, { status: 401 });
  }

  const passwordMatches = await bcrypt.compare(password, student.password_hash);
  if (!passwordMatches) {
    return NextResponse.json({ error: "학번, 이름 또는 비밀번호가 올바르지 않습니다." }, { status: 401 });
  }

  const token = await createSessionToken({ role: "student", id: student.id, name: student.name });

  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 12,
  });
  return res;
}
