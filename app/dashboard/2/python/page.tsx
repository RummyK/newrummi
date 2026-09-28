"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Problem = {
  id: string;
  problem_number: number;
  title: string;
  difficulty: string | null;
  solved: boolean;
};

export default function PythonProblemListPage() {
  const router = useRouter();
  const [problems, setProblems] = useState<Problem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/problems")
      .then((res) => res.json())
      .then((data) => {
        if (data.problems) setProblems(data.problems);
        setLoading(false);
      });
  }, []);

  return (
    <div className="container-wide">
      <div className="toolbar">
        <h1 style={{ margin: 0 }}>파이썬 문제풀이</h1>
        <button className="secondary" onClick={() => router.push("/dashboard/2")}>
          메뉴로 돌아가기
        </button>
      </div>
      {loading ? (
        <p>불러오는 중...</p>
      ) : (
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
                <td>{p.difficulty ?? "-"}</td>
                <td>{p.solved ? "✅ 정답" : "미해결"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
