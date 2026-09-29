"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

type ProblemProgress = {
  id: string;
  problem_number: number;
  title: string;
  difficulty: string | null;
  round: 1 | 2 | 3 | null;
  status: "correct" | "wrong" | "none";
  attempts: number;
};

type StudentProgress = {
  student: { id: string; student_number: string; name: string; grade: number | null; class_no: number | null };
  lastSubmittedAt: string | null;
  solvedCount: number;
  totalProblems: number;
  problems: ProblemProgress[];
};

const STATUS_LABEL: Record<ProblemProgress["status"], string> = {
  correct: "✅ 정답",
  wrong: "❌ 오답",
  none: "미시도",
};
const STATUS_CLASS: Record<ProblemProgress["status"], string> = {
  correct: "badge-solved",
  wrong: "badge-상",
  none: "badge-unsolved",
};

export default function StudentProgressPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [data, setData] = useState<StudentProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<"all" | ProblemProgress["status"]>("all");

  useEffect(() => {
    fetch(`/api/teacher/students/${params.id}/progress`)
      .then(async (res) => {
        const body = await res.json();
        if (!res.ok) {
          setError(body.error || "불러오지 못했습니다.");
          return;
        }
        setData(body);
      })
      .finally(() => setLoading(false));
  }, [params.id]);

  if (loading) {
    return (
      <div className="container-wide">
        <p>불러오는 중...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="container-wide">
        <p className="error">{error || "학생 정보를 찾을 수 없습니다."}</p>
        <button className="secondary" onClick={() => router.push("/teacher/dashboard")}>
          목록으로
        </button>
      </div>
    );
  }

  const wrongCount = data.problems.filter((p) => p.status === "wrong").length;
  const noneCount = data.problems.filter((p) => p.status === "none").length;
  const filtered = filter === "all" ? data.problems : data.problems.filter((p) => p.status === filter);

  const rounds: (1 | 2 | 3)[] = [1, 2, 3];

  return (
    <div className="container-wide">
      <div className="toolbar">
        <h1 style={{ margin: 0 }}>
          📊 {data.student.name} ({data.student.student_number}) 진행 현황
        </h1>
        <button className="secondary" onClick={() => router.push("/teacher/dashboard")}>
          목록으로
        </button>
      </div>
      <p className="subtitle" style={{ margin: "0 0 16px" }}>
        {data.student.grade ?? "-"}학년 {data.student.class_no ?? "-"}반 · 전체 {data.totalProblems}문제 중{" "}
        <b style={{ color: "#15803d" }}>정답 {data.solvedCount}</b> ·{" "}
        <b style={{ color: "#c0392b" }}>오답 {wrongCount}</b> · 미시도 {noneCount}
      </p>

      <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
        {([
          ["all", "전체"],
          ["correct", "정답만"],
          ["wrong", "오답만"],
          ["none", "미시도만"],
        ] as const).map(([key, label]) => (
          <button
            key={key}
            className={filter === key ? "" : "secondary"}
            style={{ marginTop: 0, padding: "8px 16px", fontSize: 13 }}
            onClick={() => setFilter(key)}
          >
            {label}
          </button>
        ))}
      </div>

      {rounds.map((roundNum) => {
        const roundProblems = filtered.filter((p) => p.round === roundNum);
        if (roundProblems.length === 0) return null;
        return (
          <div key={roundNum} style={{ marginBottom: 28 }}>
            <h2>{roundNum}회차</h2>
            <table>
              <thead>
                <tr>
                  <th>번호</th>
                  <th>제목</th>
                  <th>난이도</th>
                  <th>시도 횟수</th>
                  <th>상태</th>
                </tr>
              </thead>
              <tbody>
                {roundProblems.map((p) => (
                  <tr key={p.id}>
                    <td>{p.problem_number}</td>
                    <td>{p.title}</td>
                    <td>
                      {p.difficulty ? <span className={`badge badge-${p.difficulty}`}>{p.difficulty}</span> : "-"}
                    </td>
                    <td>{p.attempts}</td>
                    <td>
                      <span className={`badge ${STATUS_CLASS[p.status]}`}>{STATUS_LABEL[p.status]}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      })}
      {filtered.length === 0 && <p style={{ color: "#666" }}>해당하는 문제가 없습니다.</p>}
    </div>
  );
}
