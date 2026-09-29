"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type RoundInfo = {
  number: number;
  count: number;
  timeLimitMinutes: number;
  startedAt: string | null;
  endsAt: string | null;
};

function formatRemaining(ms: number) {
  if (ms <= 0) return "00:00";
  const totalSeconds = Math.floor(ms / 1000);
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export default function RoundSelectPage() {
  const router = useRouter();
  const [rounds, setRounds] = useState<RoundInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [now, setNow] = useState(Date.now());
  const [startingRound, setStartingRound] = useState<number | null>(null);

  useEffect(() => {
    fetch("/api/rounds")
      .then((res) => res.json())
      .then((data) => {
        if (data.rounds) setRounds(data.rounds);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  async function handleStart(roundNumber: number) {
    setStartingRound(roundNumber);
    const res = await fetch("/api/rounds/start", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ roundNumber }),
    });
    setStartingRound(null);
    if (res.ok) {
      router.push(`/dashboard/2/python/round/${roundNumber}`);
    } else {
      const data = await res.json();
      alert(data.error || "시작에 실패했습니다.");
    }
  }

  return (
    <div className="container-wide">
      <div className="toolbar">
        <h1 style={{ margin: 0 }}>🐍 파이썬 문제풀이 - 회차 선택</h1>
        <button className="secondary" onClick={() => router.push("/dashboard/2")}>
          메뉴로 돌아가기
        </button>
      </div>

      {loading ? (
        <p>불러오는 중...</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 16, marginTop: 16 }}>
          {rounds.map((r) => {
            const notStarted = !r.endsAt;
            const remaining = r.endsAt ? new Date(r.endsAt).getTime() - now : 0;
            const expired = !notStarted && remaining <= 0;

            return (
              <div key={r.number} className="round-card">
                <div>
                  <h2 style={{ margin: "0 0 4px" }}>
                    {r.number}회차 ({r.count}문제)
                  </h2>
                  <p style={{ margin: 0, color: "#666", fontSize: 14 }}>
                    제한시간 {r.timeLimitMinutes}분
                    {!notStarted && !expired && ` · 남은 시간 ${formatRemaining(remaining)}`}
                    {expired && " · 시간 종료"}
                  </p>
                </div>
                {notStarted && (
                  <button onClick={() => handleStart(r.number)} disabled={startingRound === r.number}>
                    {startingRound === r.number ? "시작하는 중..." : "시작하기"}
                  </button>
                )}
                {!notStarted && !expired && (
                  <button onClick={() => router.push(`/dashboard/2/python/round/${r.number}`)}>이어서 풀기</button>
                )}
                {expired && (
                  <button className="secondary" onClick={() => router.push(`/dashboard/2/python/round/${r.number}`)}>
                    결과 보기
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
