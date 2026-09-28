import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { createSessionToken, SESSION_COOKIE_NAME } from "@/lib/auth";
import { checkLoginLock, recordLoginFailure, clearLoginFailures } from "@/lib/loginGuard";

export async function POST(req: NextRequest) {
  const { username, password } = await req.json();

  if (!username || !password) {
    return NextResponse.json({ error: "아이디와 비밀번호를 입력하세요." }, { status: 400 });
  }

  const lockKey = `teacher:${username}`;
  const lock = await checkLoginLock(lockKey);
  if (lock.locked) {
    return NextResponse.json(
      { error: `로그인 실패 횟수가 많아 ${lock.retryAfterMinutes}분 후 다시 시도할 수 있습니다.` },
      { status: 429 }
    );
  }

  const { data: teacher, error } = await supabaseAdmin
    .from("teachers")
    .select("id, username, name, password_hash")
    .eq("username", username)
    .maybeSingle();

  if (error || !teacher) {
    await recordLoginFailure(lockKey);
    return NextResponse.json({ error: "아이디 또는 비밀번호가 올바르지 않습니다." }, { status: 401 });
  }

  const passwordMatches = await bcrypt.compare(password, teacher.password_hash);
  if (!passwordMatches) {
    await recordLoginFailure(lockKey);
    return NextResponse.json({ error: "아이디 또는 비밀번호가 올바르지 않습니다." }, { status: 401 });
  }

  await clearLoginFailures(lockKey);

  const token = await createSessionToken({ role: "teacher", id: teacher.id, name: teacher.name }, "8h");

  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 8, // 교사 세션은 8시간으로 학생보다 짧게
  });
  return res;
}
