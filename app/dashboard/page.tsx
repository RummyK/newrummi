"use client";

import { useRouter } from "next/navigation";

const grades = [
  { grade: 1, label: "1학년", ready: false },
  { grade: 2, label: "2학년", ready: true },
  { grade: 3, label: "3학년", ready: false },
];

export default function GradeSelectPage() {
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  }

  return (
    <div className="container">
      <h1>학년을 선택하세요</h1>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {grades.map((g) => (
          <button
            key={g.grade}
            className={g.ready ? "full" : "full secondary"}
            onClick={() => (g.ready ? router.push(`/dashboard/${g.grade}`) : alert("곧 준비될 예정입니다."))}
          >
            {g.label}
            {!g.ready && " (준비 중)"}
          </button>
        ))}
      </div>
      <button className="secondary full" onClick={handleLogout} style={{ marginTop: 24 }}>
        로그아웃
      </button>
    </div>
  );
}
