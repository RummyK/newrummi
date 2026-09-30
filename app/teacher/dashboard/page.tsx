"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Student = {
  id: string;
  student_number: string;
  name: string;
  grade: number | null;
  class_no: number | null;
  must_change_password: boolean;
  created_at: string;
};

type ProgressRow = {
  id: string;
  student_number: string;
  name: string;
  grade: number | null;
  class_no: number | null;
  solvedCount: number;
  wrongCount: number;
  totalProblems: number;
};

type ProjectRow = {
  id: string;
  student_number: string;
  name: string;
  grade: number | null;
  class_no: number | null;
  title: string | null;
  submitted: boolean;
  submittedAt: string | null;
  hasDraft: boolean;
};

function parsePastedRows(text: string) {
  // 한 줄에 "학번,이름,학년,반" 또는 "학번 이름 학년 반" 형태를 모두 허용
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const parts = line.split(/[,\t]|\s+/).map((p) => p.trim()).filter(Boolean);
      const [studentNumber, name, grade, classNo] = parts;
      return {
        studentNumber: studentNumber ?? "",
        name: name ?? "",
        grade: grade ? Number(grade) : null,
        classNo: classNo ? Number(classNo) : null,
      };
    });
}

export default function TeacherDashboard() {
  const router = useRouter();
  const [students, setStudents] = useState<Student[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [progress, setProgress] = useState<ProgressRow[]>([]);
  const [loadingProgress, setLoadingProgress] = useState(true);
  const [projects, setProjects] = useState<ProjectRow[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(true);

  const [pasteText, setPasteText] = useState("");
  const [initialPassword, setInitialPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [resultMsg, setResultMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  async function loadStudents() {
    setLoadingList(true);
    const res = await fetch("/api/teacher/students");
    if (res.ok) {
      const data = await res.json();
      setStudents(data.students);
    }
    setLoadingList(false);
  }

  async function loadProgress() {
    setLoadingProgress(true);
    const res = await fetch("/api/teacher/progress");
    if (res.ok) {
      const data = await res.json();
      setProgress(data.students);
    }
    setLoadingProgress(false);
  }

  async function loadProjects() {
    setLoadingProjects(true);
    const res = await fetch("/api/teacher/projects");
    if (res.ok) {
      const data = await res.json();
      setProjects(data.students);
    }
    setLoadingProjects(false);
  }

  useEffect(() => {
    loadStudents();
    loadProgress();
    loadProjects();
  }, []);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/teacher/login");
  }

  async function handleBulkSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg("");
    setResultMsg("");

    const rows = parsePastedRows(pasteText);
    if (rows.length === 0) {
      setErrorMsg("등록할 학생 정보를 입력하세요.");
      return;
    }
    if (initialPassword.length < 8) {
      setErrorMsg("초기 비밀번호는 8자 이상이어야 합니다.");
      return;
    }

    setSubmitting(true);
    const res = await fetch("/api/teacher/students/bulk", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ initialPassword, students: rows }),
    });
    const data = await res.json();
    setSubmitting(false);

    if (res.ok) {
      setResultMsg(
        `${data.inserted}명 등록 완료.` +
          (data.skipped.length > 0 ? ` (이미 있어서 건너뜀: ${data.skipped.join(", ")})` : "")
      );
      setPasteText("");
      loadStudents();
    } else {
      setErrorMsg(data.error || "등록에 실패했습니다.");
    }
  }

  async function handleReset(studentId: string, studentName: string) {
    const newPassword = window.prompt(`${studentName} 학생의 새 임시 비밀번호를 입력하세요 (8자 이상)`);
    if (!newPassword) return;
    if (newPassword.length < 8) {
      alert("비밀번호는 8자 이상이어야 합니다.");
      return;
    }
    const res = await fetch("/api/teacher/students/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ studentId, newPassword }),
    });
    if (res.ok) {
      alert("비밀번호가 재설정되었습니다. 학생에게 새 비밀번호를 알려주세요.");
      loadStudents();
    } else {
      const data = await res.json();
      alert(data.error || "재설정에 실패했습니다.");
    }
  }

  return (
    <div className="container-wide">
      <div className="toolbar">
        <h1 style={{ margin: 0 }}>교사 대시보드</h1>
        <button className="secondary" onClick={handleLogout}>
          로그아웃
        </button>
      </div>

      <h2>📊 학생 진행 현황</h2>
      {loadingProgress ? (
        <p>불러오는 중...</p>
      ) : progress.length === 0 ? (
        <p style={{ color: "#666" }}>등록된 학생이 없습니다.</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>학번</th>
              <th>이름</th>
              <th>학년/반</th>
              <th>진행률</th>
              <th>정답</th>
              <th>오답</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {progress.map((p) => (
              <tr key={p.id}>
                <td>{p.student_number}</td>
                <td>{p.name}</td>
                <td>
                  {p.grade ?? "-"}학년 {p.class_no ?? "-"}반
                </td>
                <td>
                  {p.solvedCount} / {p.totalProblems}
                </td>
                <td>
                  <span className="badge badge-solved">{p.solvedCount}</span>
                </td>
                <td>
                  <span className="badge badge-상">{p.wrongCount}</span>
                </td>
                <td>
                  <button
                    className="secondary"
                    style={{ marginTop: 0, padding: "8px 14px", fontSize: 13 }}
                    onClick={() => router.push(`/teacher/dashboard/student/${p.id}`)}
                  >
                    상세보기
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <h2>🛠️ 프로젝트 제출 현황</h2>
      {loadingProjects ? (
        <p>불러오는 중...</p>
      ) : projects.length === 0 ? (
        <p style={{ color: "#666" }}>등록된 학생이 없습니다.</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>학번</th>
              <th>이름</th>
              <th>제목</th>
              <th>상태</th>
              <th>제출 시각</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {projects.map((p) => (
              <tr key={p.id}>
                <td>{p.student_number}</td>
                <td>{p.name}</td>
                <td>{p.title || <span style={{ color: "#999" }}>-</span>}</td>
                <td>
                  <span className={`badge ${p.submitted ? "badge-solved" : "badge-unsolved"}`}>
                    {p.submitted ? "제출 완료" : p.hasDraft ? "작성 중" : "시작 안 함"}
                  </span>
                </td>
                <td>{p.submittedAt ? new Date(p.submittedAt).toLocaleString("ko-KR") : "-"}</td>
                <td>
                  <button
                    className="secondary"
                    style={{ marginTop: 0, padding: "8px 14px", fontSize: 13 }}
                    onClick={() => router.push(`/teacher/dashboard/project/${p.id}`)}
                  >
                    보고서 보기
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <h2>학생 일괄 등록</h2>
      <p style={{ fontSize: 14, color: "#666" }}>
        한 줄에 한 명씩, <b>학번,이름,학년,반</b> 순서로 붙여넣으세요 (엑셀에서 복사해도 됩니다). 학년·반은
        생략해도 됩니다. 이미 등록된 학번은 건드리지 않고 건너뜁니다.
      </p>
      <form onSubmit={handleBulkSubmit}>
        <textarea
          rows={8}
          placeholder={"20601,홍길동,2,6\n20602,김철수,2,6"}
          value={pasteText}
          onChange={(e) => setPasteText(e.target.value)}
        />
        <label htmlFor="initialPassword">신규 학생 초기 비밀번호 (모두 동일, 8자 이상)</label>
        <input
          id="initialPassword"
          value={initialPassword}
          onChange={(e) => setInitialPassword(e.target.value)}
          placeholder="예: python2026"
        />
        {errorMsg && <p className="error">{errorMsg}</p>}
        {resultMsg && <p className="success">{resultMsg}</p>}
        <button type="submit" disabled={submitting}>
          {submitting ? "등록 중..." : "학생 등록"}
        </button>
      </form>

      <h2>학생 목록 ({students.length}명)</h2>
      {loadingList ? (
        <p>불러오는 중...</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>학번</th>
              <th>이름</th>
              <th>학년/반</th>
              <th>상태</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {students.map((s) => (
              <tr key={s.id}>
                <td>{s.student_number}</td>
                <td>{s.name}</td>
                <td>
                  {s.grade ?? "-"}학년 {s.class_no ?? "-"}반
                </td>
                <td>{s.must_change_password && <span className="badge">비번 미변경</span>}</td>
                <td>
                  <button className="secondary" onClick={() => handleReset(s.id, s.name)}>
                    비밀번호 재설정
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
