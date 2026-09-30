"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

const CHECK_ITEMS: { key: string; label: string }[] = [
  { key: "purpose", label: "목적 및 주제를 명확히 작성했다" },
  { key: "algorithm", label: "알고리즘(처리 순서)을 설계했다" },
  { key: "code", label: "코드를 직접 작성하고 실행해봤다" },
  { key: "result", label: "실행 결과를 확인했다" },
  { key: "review", label: "후기 및 개선 방향을 작성했다" },
];

const RUN_TIMEOUT_MS = 8000;

type Report = {
  title: string;
  purpose: string;
  algorithm_design: string;
  code: string;
  run_output: string;
  run_note: string;
  review: string;
  ai_usage_note: string;
  self_check: Record<string, boolean>;
  submitted: boolean;
  submitted_at: string | null;
};

const EMPTY: Report = {
  title: "",
  purpose: "",
  algorithm_design: "",
  code: "# 여기에 프로젝트 코드를 작성하세요\n",
  run_output: "",
  run_note: "",
  review: "",
  ai_usage_note: "",
  self_check: {},
  submitted: false,
  submitted_at: null,
};

export default function ProjectReportPage() {
  const router = useRouter();
  const [report, setReport] = useState<Report>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<"idle" | "draft" | "submit">("idle");
  const [running, setRunning] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const workerRef = useRef<Worker | null>(null);

  useEffect(() => {
    fetch("/api/project")
      .then((res) => res.json())
      .then((data) => {
        if (data.report) {
          setReport({
            title: data.report.title ?? "",
            purpose: data.report.purpose ?? "",
            algorithm_design: data.report.algorithm_design ?? "",
            code: data.report.code || EMPTY.code,
            run_output: data.report.run_output ?? "",
            run_note: data.report.run_note ?? "",
            review: data.report.review ?? "",
            ai_usage_note: data.report.ai_usage_note ?? "",
            self_check: data.report.self_check ?? {},
            submitted: data.report.submitted ?? false,
            submitted_at: data.report.submitted_at ?? null,
          });
        }
      })
      .finally(() => setLoading(false));
  }, []);

  function update<K extends keyof Report>(key: K, value: Report[K]) {
    setReport((prev) => ({ ...prev, [key]: value }));
  }

  function runCode() {
    setRunning(true);
    setMessage(null);

    let worker = workerRef.current;
    if (!worker) {
      worker = new Worker("/pyodide-worker.js");
      workerRef.current = worker;
    }

    const timeoutId = setTimeout(() => {
      worker?.terminate();
      workerRef.current = new Worker("/pyodide-worker.js");
      setRunning(false);
      setMessage({ type: "error", text: "실행 시간이 너무 깁니다 (무한 루프가 있는지 확인하세요)." });
    }, RUN_TIMEOUT_MS);

    worker.onmessage = (e) => {
      clearTimeout(timeoutId);
      const { type, output, error } = e.data;
      setRunning(false);
      if (type === "error") {
        setMessage({ type: "error", text: "실행 중 오류: " + error });
        return;
      }
      if (error) {
        update("run_output", output || "");
        setMessage({ type: "error", text: "코드 오류: " + error });
        return;
      }
      update("run_output", output || "(출력 없음)");
      setMessage({ type: "success", text: "실행 완료! 출력 결과가 저장되었습니다." });
    };

    worker.postMessage({ code: report.code });
  }

  async function save(submit: boolean) {
    setSaving(submit ? "submit" : "draft");
    setMessage(null);
    const res = await fetch("/api/project", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: report.title,
        purpose: report.purpose,
        algorithmDesign: report.algorithm_design,
        code: report.code,
        runOutput: report.run_output,
        runNote: report.run_note,
        review: report.review,
        aiUsageNote: report.ai_usage_note,
        selfCheck: report.self_check,
        submitted: submit,
      }),
    });
    const data = await res.json();
    setSaving("idle");
    if (res.ok) {
      setReport((prev) => ({ ...prev, submitted: data.report.submitted, submitted_at: data.report.submitted_at }));
      setMessage({
        type: "success",
        text: submit ? "제출 완료되었습니다! 🎉" : "임시저장 되었습니다.",
      });
    } else {
      setMessage({ type: "error", text: data.error || "저장에 실패했습니다." });
    }
  }

  if (loading) {
    return (
      <div className="container-wide">
        <p>불러오는 중...</p>
      </div>
    );
  }

  const checkedCount = CHECK_ITEMS.filter((c) => report.self_check[c.key]).length;

  return (
    <div className="container-wide">
      <div className="toolbar">
        <h1 style={{ margin: 0 }}>🛠️ 파이썬 문제해결 프로젝트 보고서</h1>
        <button className="secondary" onClick={() => router.push("/dashboard/2")}>
          메뉴로 돌아가기
        </button>
      </div>
      <p className="subtitle" style={{ margin: "0 0 8px" }}>
        스스로 문제를 정하고 파이썬으로 해결한 과정을 정리해 제출하는 프로젝트예요. 저장은 여러 번 할 수 있고,
        준비되면 마지막에 &quot;제출하기&quot;를 눌러 확정하세요.
      </p>
      {report.submitted && (
        <p className="success" style={{ display: "inline-block" }}>
          ✅ 제출 완료 ({report.submitted_at ? new Date(report.submitted_at).toLocaleString("ko-KR") : ""})
          — 이후에도 수정하고 다시 제출할 수 있어요.
        </p>
      )}

      <h2>1. 프로젝트 제목</h2>
      <input
        value={report.title}
        onChange={(e) => update("title", e.target.value)}
        placeholder="예: 파이썬을 활용한 과목별 성적 계산기"
      />

      <h2>2. 목적 및 주제 선정</h2>
      <p className="subtitle" style={{ margin: "0 0 8px" }}>
        어떤 문제/불편함을 해결하고 싶었는지, 왜 이 주제를 골랐는지 적어주세요.
      </p>
      <textarea
        rows={4}
        value={report.purpose}
        onChange={(e) => update("purpose", e.target.value)}
        placeholder="예: 학기말마다 과목별 점수를 등급으로 바꾸는 게 번거로워서, 자동으로 계산해주는 프로그램을 만들고 싶었다."
      />

      <h2>3. 알고리즘 설계</h2>
      <p className="subtitle" style={{ margin: "0 0 8px" }}>
        프로그램이 어떤 순서로 동작하는지(처리 순서), 어떤 개념(반복문/조건문/함수/리스트 등)을 사용했는지 설명하세요.
      </p>
      <textarea
        rows={5}
        value={report.algorithm_design}
        onChange={(e) => update("algorithm_design", e.target.value)}
        placeholder={"예:\n1. 점수 입력받기\n2. 등급 계산하기\n3. 평점 계산하기\n4. 평균/최고점/최저점 계산\n5. 결과 출력\n\n사용한 개념: 리스트, 딕셔너리, 함수, 반복문, 예외처리"}
      />

      <h2>4. 코드 작성 및 실행</h2>
      <p className="subtitle" style={{ margin: "0 0 8px" }}>
        아래에 직접 작성한 코드를 넣고 실행해보세요. 실행 결과가 자동으로 아래에 저장됩니다.
      </p>
      <textarea
        rows={14}
        style={{ fontFamily: "monospace", fontSize: 14 }}
        value={report.code}
        onChange={(e) => update("code", e.target.value)}
        spellCheck={false}
      />
      <button onClick={runCode} disabled={running}>
        {running ? "실행 중... (처음 실행 시 시간이 걸릴 수 있어요)" : "▶ 코드 실행하기"}
      </button>

      <h2>5. 실행 결과</h2>
      {report.run_output ? (
        <pre style={{ background: "#111", color: "#0f0", padding: 12, borderRadius: 8, whiteSpace: "pre-wrap" }}>
          {report.run_output}
        </pre>
      ) : (
        <p style={{ color: "#666" }}>아직 실행한 결과가 없어요. 위에서 &quot;코드 실행하기&quot;를 눌러보세요.</p>
      )}
      <label htmlFor="runNote">실행 결과에 대한 설명 (선택)</label>
      <textarea
        id="runNote"
        rows={3}
        value={report.run_note}
        onChange={(e) => update("run_note", e.target.value)}
        placeholder="예: 92, 85, 78, 91, 88점을 입력했을 때 각 과목의 등급과 평균 86.8점이 정확히 출력되는 것을 확인했다."
      />

      <h2>6. 후기 및 개선 방향</h2>
      <p className="subtitle" style={{ margin: "0 0 8px" }}>
        프로젝트를 하면서 느낀 점, 어려웠던 점, 앞으로 더 발전시키고 싶은 방향을 적어주세요.
      </p>
      <textarea
        rows={4}
        value={report.review}
        onChange={(e) => update("review", e.target.value)}
        placeholder="예: 예외처리 부분이 어려웠지만 직접 해결해서 뿌듯했다. 다음엔 결과를 파일로 저장하는 기능을 추가하고 싶다."
      />

      <h2>🤖 AI 활용 관련 안내</h2>
      <p className="subtitle" style={{ margin: "0 0 8px" }}>
        본 프로젝트는 스스로 수행한 결과물이어야 합니다. AI 도구(ChatGPT, Claude 등)를 활용했다면, 어떤 부분에
        어떻게 활용했는지 반드시 아래에 사실대로 적어주세요. (활용하지 않았다면 &quot;사용하지 않음&quot;이라고
        적으면 됩니다)
      </p>
      <textarea
        rows={3}
        value={report.ai_usage_note}
        onChange={(e) => update("ai_usage_note", e.target.value)}
        placeholder="예: 사용하지 않음 / 또는: 등급 계산 로직의 오류를 찾을 때 ChatGPT에게 힌트를 물어봤음"
      />

      <h2>자기 점검표 ({checkedCount}/{CHECK_ITEMS.length})</h2>
      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 8 }}>
        {CHECK_ITEMS.map((item) => (
          <label key={item.key} style={{ display: "flex", alignItems: "center", gap: 8, margin: 0, fontWeight: 400 }}>
            <input
              type="checkbox"
              style={{ width: "auto" }}
              checked={!!report.self_check[item.key]}
              onChange={(e) =>
                update("self_check", { ...report.self_check, [item.key]: e.target.checked })
              }
            />
            {item.label}
          </label>
        ))}
      </div>

      {message && (
        <p className={message.type === "success" ? "success" : "error"} style={{ fontSize: 15 }}>
          {message.text}
        </p>
      )}

      <div style={{ display: "flex", gap: 12 }}>
        <button className="secondary" onClick={() => save(false)} disabled={saving !== "idle"}>
          {saving === "draft" ? "저장 중..." : "💾 임시저장"}
        </button>
        <button onClick={() => save(true)} disabled={saving !== "idle"}>
          {saving === "submit" ? "제출 중..." : "✅ 제출하기"}
        </button>
      </div>
    </div>
  );
}
