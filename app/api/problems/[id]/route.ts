import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { requireStudentSession } from "@/lib/requireStudent";

// 문제 상세 (설명만) - answer_hash는 절대 클라이언트로 보내지 않음
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireStudentSession(req);
  if (!session) return NextResponse.json({ error: "학생 로그인이 필요합니다." }, { status: 401 });

  const { id } = await params;

  const { data: problem, error } = await supabaseAdmin
    .from("python_problems")
    .select("id, problem_number, title, description, difficulty")
    .eq("id", id)
    .maybeSingle();

  if (error || !problem) return NextResponse.json({ error: "문제를 찾을 수 없습니다." }, { status: 404 });

  return NextResponse.json({ problem });
}
