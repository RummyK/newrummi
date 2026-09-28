"use client";

import { useRouter } from "next/navigation";

export default function StudentDashboard() {
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  }

  return (
    <div className="container">
      <h1>로그인 성공</h1>
      <p>여기에 파이썬 문제풀이 화면이 다음 단계에서 들어갑니다.</p>
      <button className="secondary" onClick={handleLogout}>
        로그아웃
      </button>
    </div>
  );
}
