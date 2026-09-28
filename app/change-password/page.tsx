"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ChangePasswordPage() {
  const router = useRouter();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (newPassword.length < 8) {
      setError("새 비밀번호는 8자 이상이어야 합니다.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("새 비밀번호가 서로 일치하지 않습니다.");
      return;
    }

    setLoading(true);
    const res = await fetch("/api/auth/change-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPassword, newPassword }),
    });
    const data = await res.json();
    setLoading(false);
    if (res.ok) {
      router.push("/dashboard");
    } else {
      setError(data.error || "변경에 실패했습니다.");
    }
  }

  return (
    <div className="container">
      <h1>비밀번호 변경</h1>
      <p style={{ fontSize: 14, color: "#666" }}>
        처음 로그인하셨네요. 다른 사람이 알 수 없는 새 비밀번호로 바꿔주세요.
      </p>
      <form onSubmit={handleSubmit}>
        <label htmlFor="currentPassword">현재 비밀번호</label>
        <input
          id="currentPassword"
          type="password"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          required
        />
        <label htmlFor="newPassword">새 비밀번호 (8자 이상)</label>
        <input
          id="newPassword"
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          required
        />
        <label htmlFor="confirmPassword">새 비밀번호 확인</label>
        <input
          id="confirmPassword"
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
        />
        {error && <p className="error">{error}</p>}
        <button type="submit" className="full" disabled={loading}>
          {loading ? "변경 중..." : "비밀번호 변경"}
        </button>
      </form>
    </div>
  );
}
