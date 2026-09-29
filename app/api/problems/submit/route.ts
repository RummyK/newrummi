import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { requireStudentSession } from "@/lib/requireStudent";
import { getRoundForProblemNumber } from "@/lib/rounds";

// 채점은 반드시 서버에서만 합니다: 브라우저(Pyodide)는 코드를 "실행"만 하고 출력을 서버로 보내면,
// 서버가 그 출력의 SHA-256 해시를 정답 해시와 비교합니다. 정답 자체는 학생 화면에 절대 내려가지 않습니다.
export async function POST(req: NextRequest) {
  const session = await requireStudentSession(req);
  if (!session) return NextResponse.json({ error: "학생 로그인이 필요합니다." }, { status: 401 });

  const { problemId, code, output, runError } = await req.json();
  if (!problemId || typeof code !== "string") {
    return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
  }

  const { data: problem, error } = await supabaseAdmin
    .from("python_problems")
    .select("id, problem_number, answer_hash")
    .eq("id", problemId)
    .maybeSingle();

  if (error || !problem) return NextResponse.json({ error: "문제를 찾을 수 없습니다." }, { status: 404 });

  // 이 문제가 속한 회차의 제한 시간이 지났으면 채점하지 않음 (타이머는 서버 기준 시각으로만 판단)
  const roundNumber = getRoundForProblemNumber(problem.problem_number);
  if (roundNumber) {
    const { data: attempt } = await supabaseAdmin
      .from("round_attempts")
      .select("ends_at")
      .eq("student_id", session.id)
      .eq("round_number", roundNumber)
      .maybeSingle();

    if (!attempt) {
      return NextResponse.json({ error: "회차를 먼저 시작해야 제출할 수 있습니다." }, { status: 403 });
    }
    if (new Date(attempt.ends_at).getTime() < Date.now()) {
      return NextResponse.json({ error: "회차 시간이 종료되어 더 이상 제출할 수 없습니다." }, { status: 403 });
    }
  }

  let isCorrect = false;
  if (!runError && typeof output === "string") {
    const outputHash = crypto.createHash("sha256").update(output.trim()).digest("hex");
    isCorrect = outputHash === problem.answer_hash;
  }

  await supabaseAdmin.from("submissions").insert({
    student_id: session.id,
    problem_id: problemId,
    code,
    is_correct: isCorrect,
  });

  return NextResponse.json({ correct: isCorrect });
}
