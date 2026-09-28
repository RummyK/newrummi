import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { requireTeacherSession } from "@/lib/requireTeacher";
import { isPasswordValid, PASSWORD_POLICY_MESSAGE } from "@/lib/password";

type StudentRow = {
  studentNumber: string;
  name: string;
  grade?: number | null;
  classNo?: number | null;
};

// 교사가 학번,이름,학년,반을 여러 줄 붙여넣거나 CSV로 올려서 한 번에 학생 계정을 만드는 API.
// 모든 신규 학생은 같은 초기 비밀번호로 생성되고, 첫 로그인 때 반드시 비밀번호를 바꾸도록 설정됩니다.
// 이미 존재하는 학번은 건드리지 않고 건너뜁니다 (기존 학생 비밀번호가 덮어써지는 사고 방지).
export async function POST(req: NextRequest) {
  const session = await requireTeacherSession(req);
  if (!session) return NextResponse.json({ error: "교사 로그인이 필요합니다." }, { status: 401 });

  const { initialPassword, students } = (await req.json()) as {
    initialPassword: string;
    students: StudentRow[];
  };

  if (!isPasswordValid(initialPassword)) {
    return NextResponse.json({ error: `초기 비밀번호: ${PASSWORD_POLICY_MESSAGE}` }, { status: 400 });
  }
  if (!Array.isArray(students) || students.length === 0) {
    return NextResponse.json({ error: "등록할 학생 목록이 비어 있습니다." }, { status: 400 });
  }
  if (students.length > 1000) {
    return NextResponse.json({ error: "한 번에 최대 1000명까지 등록할 수 있습니다." }, { status: 400 });
  }

  const cleaned = students
    .map((s) => ({
      studentNumber: String(s.studentNumber ?? "").trim(),
      name: String(s.name ?? "").trim(),
      grade: s.grade ?? null,
      classNo: s.classNo ?? null,
    }))
    .filter((s) => s.studentNumber && s.name);

  if (cleaned.length === 0) {
    return NextResponse.json({ error: "학번과 이름이 모두 있는 행이 없습니다." }, { status: 400 });
  }

  const { data: existing } = await supabaseAdmin
    .from("students")
    .select("student_number")
    .in(
      "student_number",
      cleaned.map((s) => s.studentNumber)
    );
  const existingSet = new Set((existing ?? []).map((r) => r.student_number));

  const toInsert = cleaned.filter((s) => !existingSet.has(s.studentNumber));
  const skipped = cleaned.filter((s) => existingSet.has(s.studentNumber)).map((s) => s.studentNumber);

  if (toInsert.length === 0) {
    return NextResponse.json({ inserted: 0, skipped });
  }

  const passwordHash = await bcrypt.hash(initialPassword, 10);

  const rows = toInsert.map((s) => ({
    student_number: s.studentNumber,
    name: s.name,
    grade: s.grade,
    class_no: s.classNo,
    password_hash: passwordHash,
    must_change_password: true,
  }));

  const { error } = await supabaseAdmin.from("students").insert(rows);
  if (error) {
    return NextResponse.json({ error: "학생 등록 중 오류가 발생했습니다: " + error.message }, { status: 500 });
  }

  return NextResponse.json({ inserted: toInsert.length, skipped });
}
