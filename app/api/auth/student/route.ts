import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { createSessionToken, SESSION_COOKIE_NAME } from "@/lib/auth";
import { checkLoginLock, recordLoginFailure, clearLoginFailures } from "@/lib/loginGuard";

export async function POST(req: NextRequest) {
  const { studentNumber, name, password } = await req.json();

  if (!studentNumber || !name || !password) {
    return NextResponse.json({ error: "학번, 이름, 비밀번호를 모두 입력하세요." }, { status: 400 });
  }

  const lockKey = `student:${studentNumber}`;
  const lock = await checkLoginLock(lockKey);
  if (lock.locked) {
    return NextResponse.json(
      { error: `로그인 실패 횟수가 많아 ${lock.retryAfterMinutes}분 후 다시 시도할 수 있습니다.` },
      { status: 429 }
    );
  }

  const { data: student, error } = await supabaseAdmin
    .from("students")
    .select("id, student_number, name, password_hash, must_change_password")
    .eq("student_number", studentNumber)
    .eq("name", name)
    .maybeSingle();

  // 학번+이름이 일치하는 계정이 없거나 비밀번호가 틀린 경우, 어느 쪽이 틀렸는지 알려주지 않습니다.
  if (error || !student) {
    await recordLoginFailure(lockKey);
    return NextResponse.json({ error: "학번, 이름 또는 비밀번호가 올바르지 않습니다." }, { status: 401 });
  }

  const passwordMatches = await bcrypt.compare(password, student.password_hash);
  if (!passwordMatches) {
    await recordLoginFailure(lockKey);
    return NextResponse.json({ error: "학번, 이름 또는 비밀번호가 올바르지 않습니다." }, { status: 401 });
  }

  await clearLoginFailures(lockKey);

  const token = await createSessionToken(
    { role: "student", id: student.id, name: student.name, mustChangePassword: student.must_change_password },
    "12h"
  );

  const res = NextResponse.json({ ok: true, mustChangePassword: student.must_change_password });
  res.cookies.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 12,
  });
  return res;
}
