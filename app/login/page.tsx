"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function StudentLoginPage() {
  const router = useRouter();
  const [studentNumber, setStudentNumber] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const res = await fetch("/api/auth/student", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ studentNumber, name, password }),
    });
    const data = await res.json();
    setLoading(false);
    if (res.ok) {
      router.push(data.mustChangePassword ? "/change-password" : "/dashboard");
    } else {
      setError(data.error || "로그인에 실패했습니다.");
    }
  }

  return (
    <div className="container">
      <h1>학생 로그인</h1>
      <form onSubmit={handleSubmit}>
        <label htmlFor="studentNumber">학번</label>
        <input
          id="studentNumber"
          value={studentNumber}
          onChange={(e) => setStudentNumber(e.target.value)}
          placeholder="예: 20601"
          required
        />
        <label htmlFor="name">이름</label>
        <input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
        <label htmlFor="password">비밀번호</label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        {error && <p className="error">{error}</p>}
        <button type="submit" className="full" disabled={loading}>
          {loading ? "확인 중..." : "로그인"}
        </button>
      </form>
    </div>
  );
}
