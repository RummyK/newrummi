import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { requireStudentSession } from "@/lib/requireStudent";
import { ROUNDS, ROUND_TIME_LIMIT_MINUTES } from "@/lib/rounds";

// 회차 선택 화면(3개 카드)에 필요한 요약 정보: 회차별 문제 수, 학생 본인의 시작/종료 시각(있다면)
export async function GET(req: NextRequest) {
  const session = await requireStudentSession(req);
  if (!session) return NextResponse.json({ error: "학생 로그인이 필요합니다." }, { status: 401 });

  const { data: attempts } = await supabaseAdmin
    .from("round_attempts")
    .select("round_number, started_at, ends_at")
    .eq("student_id", session.id);

  const attemptMap = new Map((attempts ?? []).map((a) => [a.round_number, a]));

  const rounds = ROUNDS.map((r) => {
    const attempt = attemptMap.get(r.number);
    return {
      number: r.number,
      count: r.count,
      timeLimitMinutes: ROUND_TIME_LIMIT_MINUTES,
      startedAt: attempt?.started_at ?? null,
      endsAt: attempt?.ends_at ?? null,
    };
  });

  return NextResponse.json({ rounds });
}
