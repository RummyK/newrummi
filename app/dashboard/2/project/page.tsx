"use client";

import { useRouter } from "next/navigation";

export default function ProjectTypeSelectPage() {
  const router = useRouter();

  return (
    <div className="container">
      <h1>🛠️ 파이썬 문제해결 프로젝트</h1>
      <p className="subtitle">어떤 방식으로 제출할지 선택하세요</p>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <button className="full" onClick={() => router.push("/dashboard/2/project/research")}>
          📘 탐구 보고서
        </button>
        <button className="full secondary" onClick={() => router.push("/dashboard/2/project/padlet")}>
          📌 Padlet업로드 보고서
        </button>
      </div>
      <button className="secondary full" onClick={() => router.push("/dashboard/2")} style={{ marginTop: 24 }}>
        메뉴로 돌아가기
      </button>
    </div>
  );
}
