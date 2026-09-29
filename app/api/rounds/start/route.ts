import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { requireStudentSession } from "@/lib/requireStudent";
import { isValidRoundNumber, ROUND_TIME_LIMIT_MINUTES } from "@/lib/rounds";

// 학생이 회차 "시작" 버튼을 누를 때 호출. 이미 시작한 적이 있으면 그 기록을 그대로 돌려주고
// (타이머를 다시 50분으로 되돌리지 않음), 처음이면 지금부터 50분짜리 기록을 새로 만듭니다.
export async function POST(req: NextRequest) {
  const session = await requireStudentSession(req);
  if (!session) return NextResponse.json({ error: "학생 로그인이 필요합니다." }, { status: 401 });

  const { roundNumber } = await req.json();
  if (!isValidRoundNumber(roundNumber)) {
    return NextResponse.json({ error: "잘못된 회차입니다." }, { status: 400 });
  }

  const { data: existing } = await supabaseAdmin
    .from("round_attempts")
    .select("started_at, ends_at")
    .eq("student_id", session.id)
    .eq("round_number", roundNumber)
    .maybeSingle();

  if (existing) {
    return NextResponse.json({ startedAt: existing.started_at, endsAt: existing.ends_at });
  }

  const startedAt = new Date();
  const endsAt = new Date(startedAt.getTime() + ROUND_TIME_LIMIT_MINUTES * 60000);

  const { error } = await supabaseAdmin.from("round_attempts").insert({
    student_id: session.id,
    round_number: roundNumber,
    started_at: startedAt.toISOString(),
    ends_at: endsAt.toISOString(),
  });

  if (error) return NextResponse.json({ error: "회차 시작에 실패했습니다." }, { status: 500 });

  return NextResponse.json({ startedAt: startedAt.toISOString(), endsAt: endsAt.toISOString() });
}
