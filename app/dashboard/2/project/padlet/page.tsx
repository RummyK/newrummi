"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { buildPadletV2Subject, buildPadletV2Body } from "@/lib/padletFormat";

const PADLET_BOARD_URL = process.env.NEXT_PUBLIC_PADLET_BOARD_URL || "";
const RUN_TIMEOUT_MS = 8000;

const SUBJECTS = ["정보", "수학", "과학"];

const STEP_LABELS = ["입력 받기", "조건 판단", "처리 수행", "결과 저장", "출력"];
const CONCEPT_LABELS = ["조건문", "반복문", "함수"];

const CHECK_GROUPS: { group: string; points: number; items: { key: string; label: string }[] }[] = [
  {
    group: "파이썬 문제풀이",
    points: 50,
    items: [
      { key: "sol5", label: "풀이 5개 이상 작성함" },
      { key: "noerror", label: "오류 없이 실행됨" },
      { key: "variety", label: "다양한 문법 활용함" },
    ],
  },
  {
    group: "문제해결 과정 기록",
    points: 30,
    items: [
      { key: "algosteps", label: "알고리즘 단계 기록함" },
      { key: "errorprocess", label: "오류 수정 과정 서술함" },
    ],
  },
  {
    group: "프로젝트 보고서",
    points: 20,
    items: [
      { key: "formcomplete", label: "양식 완전히 작성함" },
      { key: "codeexplained", label: "코드 설명 포함함" },
    ],
  },
];
const ALL_CHECK_ITEMS = CHECK_GROUPS.flatMap((g) => g.items);

type Report = {
  subject: string;
  title: string;
  purpose: string;
  topic_reason: string;
  algorithm_steps: { label: string; content: string }[];
  key_concepts: Record<string, string>;
  code: string;
  code_explanation: string;
  run_output: string;
  result_analysis: string;
  error_improvement: string;
  learned: string;
  difficulty_note: string;
  future_direction: string;
  ai_usage_note: string;
  self_check: Record<string, boolean>;
  submitted: boolean;
  submitted_at: string | null;
  padlet_post_id: string | null;
};

const EMPTY: Report = {
  subject: "정보",
  title: "",
  purpose: "",
  topic_reason: "",
  algorithm_steps: STEP_LABELS.map((label) => ({ label, content: "" })),
  key_concepts: {},
  code: "# 여기에 파이썬 코드를 붙여넣으세요\n",
  code_explanation: "",
  run_output: "",
  result_analysis: "",
  error_improvement: "",
  learned: "",
  difficulty_note: "",
  future_direction: "",
  ai_usage_note: "",
  self_check: {},
  submitted: false,
  submitted_at: null,
  padlet_post_id: null,
};

export default function PadletReportPage() {
  const router = useRouter();
  const [report, setReport] = useState<Report>(EMPTY);
  const [studentName, setStudentName] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<"idle" | "draft" | "submit">("idle");
  const [running, setRunning] = useState(false);
  const [copied, setCopied] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const workerRef = useRef<Worker | null>(null);

  useEffect(() => {
    fetch("/api/padlet-report")
      .then((res) => res.json())
      .then((data) => {
        if (data.report) {
          const steps: { label: string; content: string }[] =
            Array.isArray(data.report.algorithm_steps) && data.report.algorithm_steps.length === 5
              ? data.report.algorithm_steps
              : EMPTY.algorithm_steps;
          setReport({
            subject: data.report.subject || "정보",
            title: data.report.title ?? "",
            purpose: data.report.purpose ?? "",
            topic_reason: data.report.topic_reason ?? "",
            algorithm_steps: steps,
            key_concepts: data.report.key_concepts ?? {},
            code: data.report.code || EMPTY.code,
            code_explanation: data.report.code_explanation ?? "",
            run_output: data.report.run_output ?? "",
            result_analysis: data.report.result_analysis ?? "",
            error_improvement: data.report.error_improvement ?? "",
            learned: data.report.learned ?? "",
            difficulty_note: data.report.difficulty_note ?? "",
            future_direction: data.report.future_direction ?? "",
            ai_usage_note: data.report.ai_usage_note ?? "",
            self_check: data.report.self_check ?? {},
            submitted: data.report.submitted ?? false,
            submitted_at: data.report.submitted_at ?? null,
            padlet_post_id: data.report.padlet_post_id ?? null,
          });
        }
        if (data.studentName) setStudentName(data.studentName);
      })
      .finally(() => setLoading(false));
  }, []);

  function update<K extends keyof Report>(key: K, value: Report[K]) {
    setReport((prev) => ({ ...prev, [key]: value }));
  }

  function updateStep(index: number, content: string) {
    setReport((prev) => {
      const steps = [...prev.algorithm_steps];
      steps[index] = { ...steps[index], content };
      return { ...prev, algorithm_steps: steps };
    });
  }

  function updateConcept(label: string, value: string) {
    setReport((prev) => ({ ...prev, key_concepts: { ...prev.key_concepts, [label]: value } }));
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
    const res = await fetch("/api/padlet-report", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        subject: report.subject,
        title: report.title,
        purpose: report.purpose,
        topicReason: report.topic_reason,
        algorithmSteps: report.algorithm_steps,
        keyConcepts: report.key_concepts,
        code: report.code,
        codeExplanation: report.code_explanation,
        runOutput: report.run_output,
        resultAnalysis: report.result_analysis,
        errorImprovement: report.error_improvement,
        learned: report.learned,
        difficultyNote: report.difficulty_note,
        futureDirection: report.future_direction,
        aiUsageNote: report.ai_usage_note,
        selfCheck: report.self_check,
        submitted: submit,
      }),
    });
    const data = await res.json();
    setSaving("idle");
    if (res.ok) {
      setReport((prev) => ({
        ...prev,
        submitted: data.report.submitted,
        submitted_at: data.report.submitted_at,
        padlet_post_id: data.report.padlet_post_id ?? prev.padlet_post_id,
      }));
      setMessage({ type: "success", text: submit ? "제출 완료되었습니다! 🎉" : "임시저장 되었습니다." });
    } else {
      setMessage({ type: "error", text: data.error || "저장에 실패했습니다." });
    }
  }

  async function copyForPadlet() {
    const subject = buildPadletV2Subject(studentName, report.title);
    const body = buildPadletV2Body({
      subject: report.subject,
      purpose: report.purpose,
      topicReason: report.topic_reason,
      codeExplanation: report.code_explanation,
      runOutput: report.run_output,
      resultAnalysis: report.result_analysis,
      learned: report.learned,
      difficultyNote: report.difficulty_note,
      futureDirection: report.future_direction,
    });
    try {
      await navigator.clipboard.writeText(`${subject}\n\n${body}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      setMessage({ type: "error", text: "복사에 실패했어요. 직접 선택해서 복사해주세요." });
    }
  }

  if (loading) {
    return (
      <div className="container-wide">
        <p>불러오는 중...</p>
      </div>
    );
  }

  const checkedCount = ALL_CHECK_ITEMS.filter((c) => report.self_check[c.key]).length;
  const today = new Date().toLocaleDateString("ko-KR");

  return (
    <div className="container-wide">
      <div className="toolbar">
        <h1 style={{ margin: 0 }}>📌 Padlet업로드 보고서</h1>
        <button className="secondary" onClick={() => router.push("/dashboard/2/project")}>
          보고서 종류 선택으로
        </button>
      </div>
      <p className="subtitle" style={{ margin: "0 0 8px" }}>
        학번: {studentName ? "본인 계정으로 자동 기록됨" : "-"} · 이름: {studentName || "-"} · 날짜: {today}
      </p>

      {report.submitted && (
        <>
          <p className="success" style={{ display: "inline-block" }}>
            ✅ 제출 완료 ({report.submitted_at ? new Date(report.submitted_at).toLocaleString("ko-KR") : ""})
            — 이후에도 수정하고 다시 제출할 수 있어요.
            {report.padlet_post_id && " · 📌 Padlet에도 게시되었어요."}
          </p>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", margin: "8px 0 16px" }}>
            <button className="secondary" style={{ marginTop: 0 }} onClick={copyForPadlet}>
              {copied ? "✅ 복사됨!" : "📋 Padlet 게시용 내용 복사하기"}
            </button>
            {PADLET_BOARD_URL && (
              <a href={PADLET_BOARD_URL} target="_blank" rel="noopener noreferrer">
                <button className="secondary" style={{ marginTop: 0 }} type="button">
                  🔗 Padlet 보드 열기
                </button>
              </a>
            )}
          </div>
          <p className="subtitle" style={{ margin: "0 0 16px" }}>
            위 버튼으로 내용을 복사한 뒤, Padlet 보드에서 &quot;+&quot; 버튼을 눌러 새 게시물을 만들고
            붙여넣기(Ctrl+V) 하면 돼요.
          </p>
        </>
      )}

      <label htmlFor="subject">과목</label>
      <select
        id="subject"
        value={report.subject}
        onChange={(e) => update("subject", e.target.value)}
        style={{
          width: "100%",
          padding: "11px 14px",
          border: "1.5px solid var(--border)",
          borderRadius: 10,
          fontSize: 15,
          fontFamily: "inherit",
          background: "#fafafa",
        }}
      >
        {SUBJECTS.map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
      </select>

      <label htmlFor="title">📌 프로젝트 제목</label>
      <input id="title" value={report.title} onChange={(e) => update("title", e.target.value)} />

      <h2>01. 프로젝트 개요</h2>
      <label htmlFor="purpose">▸ 프로젝트 목적</label>
      <textarea
        id="purpose"
        rows={3}
        value={report.purpose}
        onChange={(e) => update("purpose", e.target.value)}
        placeholder="이 프로젝트를 통해 해결하고자 하는 문제나 목표를 작성하세요."
      />
      <label htmlFor="topicReason">▸ 주제 선정 이유</label>
      <textarea
        id="topicReason"
        rows={3}
        value={report.topic_reason}
        onChange={(e) => update("topic_reason", e.target.value)}
        placeholder="이 주제를 선택한 이유와 배경을 설명하세요."
      />

      <h2>02. 알고리즘 설계</h2>
      <label>▸ 알고리즘 순서도 (단계별)</label>
      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 8 }}>
        {report.algorithm_steps.map((step, i) => (
          <div key={step.label} style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span
              style={{
                minWidth: 92,
                fontSize: 13,
                fontWeight: 700,
                color: "var(--primary-dark)",
              }}
            >
              ① {i + 1}. {step.label}
            </span>
            <input
              value={step.content}
              onChange={(e) => updateStep(i, e.target.value)}
              placeholder={`${step.label} 단계에서 하는 일을 간단히 적어주세요`}
              style={{ margin: 0 }}
            />
          </div>
        ))}
      </div>

      <label style={{ marginTop: 24 }}>▸ 핵심 개념</label>
      <table>
        <thead>
          <tr>
            <th style={{ width: 100 }}>개념</th>
            <th>예시 / 설명</th>
          </tr>
        </thead>
        <tbody>
          {CONCEPT_LABELS.map((label) => (
            <tr key={label}>
              <td style={{ fontWeight: 700 }}>{label}</td>
              <td>
                <input
                  value={report.key_concepts[label] ?? ""}
                  onChange={(e) => updateConcept(label, e.target.value)}
                  placeholder={`${label}을(를) 어디에 어떻게 썼는지`}
                  style={{ margin: 0 }}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <h2>03. 파이썬 코드</h2>
      <label htmlFor="code">▸ 전체 소스 코드 (main.py)</label>
      <textarea
        id="code"
        rows={14}
        style={{ fontFamily: "monospace", fontSize: 14 }}
        value={report.code}
        onChange={(e) => update("code", e.target.value)}
        spellCheck={false}
      />
      <button onClick={runCode} disabled={running}>
        {running ? "실행 중... (처음 실행 시 시간이 걸릴 수 있어요)" : "▶ 코드 실행하기"}
      </button>

      <label htmlFor="codeExplanation">▸ 코드 설명 (주요 기능 및 동작 원리)</label>
      <textarea
        id="codeExplanation"
        rows={4}
        value={report.code_explanation}
        onChange={(e) => update("code_explanation", e.target.value)}
        placeholder="예) get_grade() 함수는 점수를 받아 등급 문자열을 반환합니다."
      />

      <h2>04. 실행 결과 & 분석</h2>
      <label>● 실행 결과 화면</label>
      {report.run_output ? (
        <pre style={{ background: "#111", color: "#0f0", padding: 12, borderRadius: 8, whiteSpace: "pre-wrap" }}>
          {report.run_output}
        </pre>
      ) : (
        <p style={{ color: "#666" }}>위에서 &quot;코드 실행하기&quot;를 눌러 결과를 채워보세요.</p>
      )}

      <label htmlFor="resultAnalysis">결과 분석 (예상한 결과와 비교하여 설명)</label>
      <textarea
        id="resultAnalysis"
        rows={3}
        value={report.result_analysis}
        onChange={(e) => update("result_analysis", e.target.value)}
      />
      <label htmlFor="errorImprovement">오류 및 개선 (발생한 오류와 개선 방향 서술)</label>
      <textarea
        id="errorImprovement"
        rows={3}
        value={report.error_improvement}
        onChange={(e) => update("error_improvement", e.target.value)}
      />

      <h2>05. 프로젝트 후기</h2>
      <label htmlFor="learned">💡 배운 점</label>
      <textarea id="learned" rows={3} value={report.learned} onChange={(e) => update("learned", e.target.value)} />
      <label htmlFor="difficultyNote">🔧 어려웠던 점</label>
      <textarea
        id="difficultyNote"
        rows={3}
        value={report.difficulty_note}
        onChange={(e) => update("difficulty_note", e.target.value)}
      />
      <label htmlFor="futureDirection">🚀 발전 방향</label>
      <textarea
        id="futureDirection"
        rows={3}
        value={report.future_direction}
        onChange={(e) => update("future_direction", e.target.value)}
      />

      <h2>⚠ AI 유의사항</h2>
      <p className="subtitle" style={{ margin: "0 0 8px" }}>
        AI 도구(ChatGPT 등) 활용 시, 반드시 ① 어떤 AI를 사용했는지 ② 어떤 방식으로 활용했는지 ③ 내가 직접 작성하거나
        수정한 부분이 어디인지를 보고서에 명시해야 합니다. AI가 생성한 코드를 그대로 제출하는 것은 부정행위로
        간주됩니다.
      </p>
      <textarea
        rows={3}
        value={report.ai_usage_note}
        onChange={(e) => update("ai_usage_note", e.target.value)}
        placeholder="예: 사용하지 않음 / 또는: ChatGPT에게 오류 원인을 질문했고, 코드는 직접 작성·수정함"
      />

      <h2>✅ 자기 점검표</h2>
      <p className="subtitle" style={{ margin: "0 0 8px" }}>
        {checkedCount} / {ALL_CHECK_ITEMS.length}개 체크됨
      </p>
      {CHECK_GROUPS.map((g) => (
        <div key={g.group} style={{ marginBottom: 14 }}>
          <p style={{ fontWeight: 700, fontSize: 14, margin: "0 0 6px" }}>
            ◆ {g.group} ({g.points}점)
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 6, paddingLeft: 4 }}>
            {g.items.map((item) => (
              <label
                key={item.key}
                style={{ display: "flex", alignItems: "center", gap: 8, margin: 0, fontWeight: 400 }}
              >
                <input
                  type="checkbox"
                  style={{ width: "auto" }}
                  checked={!!report.self_check[item.key]}
                  onChange={(e) => update("self_check", { ...report.self_check, [item.key]: e.target.checked })}
                />
                {item.label}
              </label>
            ))}
          </div>
        </div>
      ))}

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
