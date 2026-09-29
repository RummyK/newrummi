"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getRoundForProblemNumber } from "@/lib/rounds";

type Problem = {
  id: string;
  problem_number: number;
  title: string;
  description: string;
  difficulty: string | null;
};

const RUN_TIMEOUT_MS = 8000;

function formatRemaining(ms: number) {
  if (ms <= 0) return "00:00";
  const totalSeconds = Math.floor(ms / 1000);
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export default function PythonProblemSolvePage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [problem, setProblem] = useState<Problem | null>(null);
  const [code, setCode] = useState("# 여기에 코드를 작성하세요\n");
  const [output, setOutput] = useState("");
  const [running, setRunning] = useState(false);
  const [resultMsg, setResultMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [pyodideLoading, setPyodideLoading] = useState(true);
  const [endsAt, setEndsAt] = useState<string | null>(null);
  const [now, setNow] = useState(Date.now());

  const workerRef = useRef<Worker | null>(null);

  const roundNumber = problem ? getRoundForProblemNumber(problem.problem_number) : null;
  const roundListPath = roundNumber ? `/dashboard/2/python/round/${roundNumber}` : "/dashboard/2/python";

  useEffect(() => {
    fetch(`/api/problems/${params.id}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.problem) setProblem(data.problem);
      });
  }, [params.id]);

  useEffect(() => {
    if (!problem) return;
    const rn = getRoundForProblemNumber(problem.problem_number);
    if (!rn) return;
    fetch(`/api/rounds/${rn}`)
      .then((res) => res.json())
      .then((data) => setEndsAt(data.endsAt ?? null));
  }, [problem]);

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // 문제 화면에 들어오면 미리 Pyodide 워커를 하나 띄워서 로딩 시간을 줄입니다.
    const worker = new Worker("/pyodide-worker.js");
    workerRef.current = worker;
    setPyodideLoading(false); // 워커 자체는 바로 뜨고, pyodide 로딩은 첫 실행 때 내부적으로 진행됨
    return () => {
      worker.terminate();
    };
  }, []);

  function runAndSubmit() {
    setRunning(true);
    setOutput("");
    setResultMsg(null);

    let worker = workerRef.current;
    if (!worker) {
      worker = new Worker("/pyodide-worker.js");
      workerRef.current = worker;
    }

    const timeoutId = setTimeout(() => {
      worker?.terminate();
      workerRef.current = new Worker("/pyodide-worker.js"); // 다음 실행을 위해 새 워커 준비
      setRunning(false);
      setResultMsg({ type: "error", text: "실행 시간이 너무 깁니다 (무한 루프가 있는지 확인하세요)." });
    }, RUN_TIMEOUT_MS);

    worker.onmessage = async (e) => {
      clearTimeout(timeoutId);
      const { type, output: out, error } = e.data;

      if (type === "error") {
        setRunning(false);
        setOutput("");
        setResultMsg({ type: "error", text: "실행 중 오류: " + error });
        return;
      }

      setOutput(out || "");
      if (error) {
        setRunning(false);
        setResultMsg({ type: "error", text: "코드 오류: " + error });
        return;
      }

      const res = await fetch("/api/problems/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ problemId: params.id, code, output: out, runError: error }),
      });
      const data = await res.json();
      setRunning(false);
      setResultMsg(
        data.correct
          ? { type: "success", text: "정답입니다! 🎉" }
          : { type: "error", text: "오답입니다. 출력 결과를 다시 확인해보세요." }
      );
    };

    worker.postMessage({ code });
  }

  if (!problem) {
    return (
      <div className="container-wide">
        <p>문제를 불러오는 중...</p>
      </div>
    );
  }

  const remaining = endsAt ? new Date(endsAt).getTime() - now : null;
  const expired = remaining !== null && remaining <= 0;

  return (
    <div className="container-wide">
      <div className="toolbar">
        <h1 style={{ margin: 0 }}>
          {problem.problem_number}. {problem.title}
        </h1>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          {remaining !== null && (
            <span
              style={{
                fontFamily: "monospace",
                fontSize: 20,
                fontWeight: 700,
                color: expired || remaining < 5 * 60 * 1000 ? "#c0392b" : "#1a1a1a",
              }}
            >
              {expired ? "시간 종료" : formatRemaining(remaining)}
            </span>
          )}
          <button className="secondary" onClick={() => router.push(roundListPath)}>
            {roundNumber ? `${roundNumber}회차 목록으로` : "목록으로"}
          </button>
        </div>
      </div>
      {expired && <p className="error">회차 시간이 종료되어 더 이상 제출할 수 없습니다.</p>}

      <p style={{ whiteSpace: "pre-wrap", background: "#f7f7f8", padding: 16, borderRadius: 8 }}>
        {problem.description}
      </p>

      <label htmlFor="code">코드 작성</label>
      <textarea
        id="code"
        rows={12}
        style={{ fontFamily: "monospace", fontSize: 14 }}
        value={code}
        onChange={(e) => setCode(e.target.value)}
        spellCheck={false}
      />

      <button onClick={runAndSubmit} disabled={running || pyodideLoading || expired}>
        {running ? "채점 중... (처음 실행 시 파이썬 로딩에 시간이 걸릴 수 있어요)" : "실행 및 채점"}
      </button>

      {output && (
        <>
          <label>출력 결과</label>
          <pre style={{ background: "#111", color: "#0f0", padding: 12, borderRadius: 8, whiteSpace: "pre-wrap" }}>
            {output}
          </pre>
        </>
      )}

      {resultMsg && (
        <>
          <p className={resultMsg.type === "success" ? "success" : "error"} style={{ fontSize: 16 }}>
            {resultMsg.text}
          </p>
          <div style={{ display: "flex", gap: 8 }}>
            <button className="secondary" onClick={() => router.push(roundListPath)}>
              📋 {roundNumber ? `${roundNumber}회차 목록으로 돌아가기` : "목록으로 돌아가기"}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
