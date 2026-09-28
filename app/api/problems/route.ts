import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { requireStudentSession } from "@/lib/requireStudent";

// 문제 목록 + 로그인한 학생 본인의 정답 여부를 함께 내려줍니다. (정답 자체나 answer_hash는 절대 포함하지 않음)
export async function GET(req: NextRequest) {
  const session = await requireStudentSession(req);
  if (!session) return NextResponse.json({ error: "학생 로그인이 필요합니다." }, { status: 401 });

  const { data: problems, error } = await supabaseAdmin
    .from("python_problems")
    .select("id, problem_number, title, difficulty")
    .order("problem_number", { ascending: true });

  if (error) return NextResponse.json({ error: "문제 목록을 불러오지 못했습니다." }, { status: 500 });

  const { data: solvedRows } = await supabaseAdmin
    .from("submissions")
    .select("problem_id")
    .eq("student_id", session.id)
    .eq("is_correct", true);

  const solvedSet = new Set((solvedRows ?? []).map((r) => r.problem_id));

  const result = (problems ?? []).map((p) => ({ ...p, solved: solvedSet.has(p.id) }));
  return NextResponse.json({ problems: result });
}
