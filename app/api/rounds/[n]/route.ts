import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { requireStudentSession } from "@/lib/requireStudent";
import { getRoundDef, isValidRoundNumber } from "@/lib/rounds";

// 특정 회차의 문제 목록 + 학생 본인의 회차 시작/종료 시각 + 문제별 정답 여부
export async function GET(req: NextRequest, { params }: { params: Promise<{ n: string }> }) {
  const session = await requireStudentSession(req);
  if (!session) return NextResponse.json({ error: "학생 로그인이 필요합니다." }, { status: 401 });

  const { n } = await params;
  const roundNumber = Number(n);
  if (!isValidRoundNumber(roundNumber)) {
    return NextResponse.json({ error: "잘못된 회차입니다." }, { status: 400 });
  }
  const roundDef = getRoundDef(roundNumber);

  const { data: attempt } = await supabaseAdmin
    .from("round_attempts")
    .select("started_at, ends_at")
    .eq("student_id", session.id)
    .eq("round_number", roundNumber)
    .maybeSingle();

  const { data: problems, error } = await supabaseAdmin
    .from("python_problems")
    .select("id, problem_number, title, difficulty")
    .gte("problem_number", roundDef.minNumber)
    .lte("problem_number", roundDef.maxNumber)
    .order("problem_number", { ascending: true });

  if (error) return NextResponse.json({ error: "문제 목록을 불러오지 못했습니다." }, { status: 500 });

  const { data: solvedRows } = await supabaseAdmin
    .from("submissions")
    .select("problem_id")
    .eq("student_id", session.id)
    .eq("is_correct", true);
  const solvedSet = new Set((solvedRows ?? []).map((r) => r.problem_id));

  return NextResponse.json({
    round: { number: roundNumber, count: roundDef.count },
    startedAt: attempt?.started_at ?? null,
    endsAt: attempt?.ends_at ?? null,
    problems: (problems ?? []).map((p) => ({ ...p, solved: solvedSet.has(p.id) })),
  });
}
