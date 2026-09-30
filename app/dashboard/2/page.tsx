"use client";

import { useRouter } from "next/navigation";

export default function Grade2MenuPage() {
  const router = useRouter();

  return (
    <div className="container">
      <h1>2️⃣ 2학년 · 프로그래밍</h1>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <button className="full" onClick={() => router.push("/dashboard/2/python")}>
          🐍 파이썬 문제풀이
        </button>
        <button className="full secondary" onClick={() => router.push("/dashboard/2/project")}>
          🛠️ 파이썬 문제해결 프로젝트
        </button>
      </div>
      <button className="secondary full" onClick={() => router.push("/dashboard")} style={{ marginTop: 24 }}>
        학년 다시 선택
      </button>
    </div>
  );
}
