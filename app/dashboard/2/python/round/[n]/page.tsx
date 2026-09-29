"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

type Problem = {
  id: string;
  problem_number: number;
  title: string;
  difficulty: string | null;
  solved: boolean;
};

function formatRemaining(ms: number) {
  if (ms <= 0) return "00:00";
  const totalSeconds = Math.floor(ms / 1000);
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export default function RoundProblemListPage() {
  const params = useParams<{ n: string }>();
  const router = useRouter();
  const [problems, setProblems] = useState<Problem[]>([]);
  const [endsAt, setEndsAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    fetch(`/api/rounds/${params.n}`)
      .then((res) => res.json())
      .then((data) => {
        if (!data.endsAt) {
          // 시작하지 않은 회차에 바로 들어온 경우 회차 선택 화면으로 되돌림
          router.replace("/dashboard/2/python");
          return;
        }
        setProblems(data.problems ?? []);
        setEndsAt(data.endsAt);
        setLoading(false);
      });
  }, [params.n, router]);

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="container-wide">
        <p>불러오는 중...</p>
      </div>
    );
  }

  const remaining = endsAt ? new Date(endsAt).getTime() - now : 0;
  const expired = remaining <= 0;

  return (
    <div className="container-wide">
      <div className="toolbar">
        <h1 style={{ margin: 0 }}>{params.n}회차</h1>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <span
            style={{
              fontFamily: "monospace",
              fontSize: 22,
              fontWeight: 700,
              color: expired ? "#c0392b" : remaining < 5 * 60 * 1000 ? "#c0392b" : "#1a1a1a",
            }}
          >
            {expired ? "시간 종료" : formatRemaining(remaining)}
          </span>
          <button className="secondary" onClick={() => router.push("/dashboard/2/python")}>
            회차 목록
          </button>
        </div>
      </div>

      <table>
        <thead>
          <tr>
            <th>번호</th>
            <th>제목</th>
            <th>난이도</th>
            <th>상태</th>
          </tr>
        </thead>
        <tbody>
          {problems.map((p) => (
            <tr
              key={p.id}
              style={{ cursor: "pointer" }}
              onClick={() => router.push(`/dashboard/2/python/${p.id}`)}
            >
              <td>{p.problem_number}</td>
              <td>{p.title}</td>
              <td>
                {p.difficulty ? <span className={`badge badge-${p.difficulty}`}>{p.difficulty}</span> : "-"}
              </td>
              <td>
                <span className={`badge ${p.solved ? "badge-solved" : "badge-unsolved"}`}>
                  {p.solved ? "✅ 정답" : "미해결"}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {problems.length === 0 && (
        <p style={{ color: "#666" }}>이 회차에 아직 등록된 문제가 없습니다.</p>
      )}
    </div>
  );
}
