"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { buildPadletV2Subject, buildPadletV2Body } from "@/lib/padletFormat";

const PADLET_BOARD_URL = process.env.NEXT_PUBLIC_PADLET_BOARD_URL || "";

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
  updated_at: string | null;
  padlet_post_id: string | null;
};

type Student = { id: string; student_number: string; name: string; grade: number | null; class_no: number | null };

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <h2>{title}</h2>
      <div style={{ whiteSpace: "pre-wrap", background: "#f7f7f8", padding: 14, borderRadius: 10, fontSize: 14 }}>
        {children || <span style={{ color: "#999" }}>(작성 없음)</span>}
      </div>
    </div>
  );
}

export default function TeacherPadletReportViewPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [student, setStudent] = useState<Student | null>(null);
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  async function copyForPadlet() {
    if (!student || !report) return;
    const subject = buildPadletV2Subject(student.name, report.title);
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
      alert("복사에 실패했어요.");
    }
  }

  useEffect(() => {
    fetch(`/api/teacher/students/${params.id}/padlet-report`)
      .then(async (res) => {
        const body = await res.json();
        if (!res.ok) {
          setError(body.error || "불러오지 못했습니다.");
          return;
        }
        setStudent(body.student);
        setReport(body.report);
      })
      .finally(() => setLoading(false));
  }, [params.id]);

  if (loading) {
    return (
      <div className="container-wide">
        <p>불러오는 중...</p>
      </div>
    );
  }

  if (error || !student) {
    return (
      <div className="container-wide">
        <p className="error">{error || "학생을 찾을 수 없습니다."}</p>
        <button className="secondary" onClick={() => router.push("/teacher/dashboard")}>
          목록으로
        </button>
      </div>
    );
  }

  const checkedCount = report
    ? CHECK_GROUPS.flatMap((g) => g.items).filter((c) => report.self_check?.[c.key]).length
    : 0;
  const totalCount = CHECK_GROUPS.flatMap((g) => g.items).length;

  return (
    <div className="container-wide">
      <div className="toolbar">
        <h1 style={{ margin: 0 }}>
          📌 {student.name} ({student.student_number}) Padlet업로드 보고서
        </h1>
        <div className="no-print" style={{ display: "flex", gap: 8 }}>
          <button onClick={() => window.print()}>🖨️ PDF로 저장</button>
          <button className="secondary" onClick={() => router.push("/teacher/dashboard")}>
            목록으로
          </button>
        </div>
      </div>

      {!report ? (
        <p style={{ color: "#666" }}>아직 작성한 보고서가 없습니다.</p>
      ) : (
        <>
          <p className="subtitle" style={{ margin: "0 0 16px" }}>
            {student.grade ?? "-"}학년 {student.class_no ?? "-"}반 · 과목: {report.subject || "-"} ·{" "}
            <span className={`badge ${report.submitted ? "badge-solved" : "badge-unsolved"}`}>
              {report.submitted ? "제출 완료" : "임시저장 상태"}
            </span>{" "}
            {report.submitted_at && `· 제출: ${new Date(report.submitted_at).toLocaleString("ko-KR")}`}
            {report.updated_at && ` · 최근 수정: ${new Date(report.updated_at).toLocaleString("ko-KR")}`}
            {report.padlet_post_id && " · 📌 Padlet에 게시됨"}
          </p>

          <div className="no-print" style={{ display: "flex", gap: 8, flexWrap: "wrap", margin: "0 0 20px" }}>
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

          <h2>제목</h2>
          <p style={{ fontSize: 17, fontWeight: 700 }}>
            {report.title || <span style={{ color: "#999" }}>(제목 없음)</span>}
          </p>

          <h2>01. 프로젝트 개요</h2>
          <Section title="▸ 프로젝트 목적">{report.purpose}</Section>
          <Section title="▸ 주제 선정 이유">{report.topic_reason}</Section>

          <h2>02. 알고리즘 설계</h2>
          <div style={{ marginBottom: 20 }}>
            <p style={{ fontWeight: 600, marginBottom: 8 }}>▸ 알고리즘 순서도</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {(report.algorithm_steps?.length === 5 ? report.algorithm_steps : STEP_LABELS.map((l) => ({ label: l, content: "" }))).map(
                (step, i) => (
                  <div
                    key={step.label}
                    style={{ background: "#f7f7f8", padding: "10px 14px", borderRadius: 8, fontSize: 14 }}
                  >
                    <strong>
                      {i + 1}. {step.label}
                    </strong>{" "}
                    — {step.content || <span style={{ color: "#999" }}>(작성 없음)</span>}
                  </div>
                )
              )}
            </div>
          </div>
          <div style={{ marginBottom: 20 }}>
            <p style={{ fontWeight: 600, marginBottom: 8 }}>▸ 핵심 개념</p>
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
                    <td>{report.key_concepts?.[label] || <span style={{ color: "#999" }}>-</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <h2>03. 파이썬 코드</h2>
          <pre
            style={{ background: "#1e1e1e", color: "#e5e5e5", padding: 14, borderRadius: 10, fontSize: 13, overflowX: "auto" }}
          >
            {report.code || "(코드 없음)"}
          </pre>
          <Section title="▸ 코드 설명">{report.code_explanation}</Section>

          <h2>04. 실행 결과 & 분석</h2>
          <pre style={{ background: "#111", color: "#0f0", padding: 12, borderRadius: 8, whiteSpace: "pre-wrap" }}>
            {report.run_output || "(실행 결과 없음)"}
          </pre>
          <Section title="결과 분석">{report.result_analysis}</Section>
          <Section title="오류 및 개선">{report.error_improvement}</Section>

          <h2>05. 프로젝트 후기</h2>
          <Section title="💡 배운 점">{report.learned}</Section>
          <Section title="🔧 어려웠던 점">{report.difficulty_note}</Section>
          <Section title="🚀 발전 방향">{report.future_direction}</Section>

          <Section title="⚠ AI 유의사항">{report.ai_usage_note}</Section>

          <h2>
            ✅ 자기 점검표 ({checkedCount} / {totalCount})
          </h2>
          {CHECK_GROUPS.map((g) => (
            <div key={g.group} style={{ marginBottom: 14 }}>
              <p style={{ fontWeight: 700, fontSize: 14, margin: "0 0 6px" }}>
                ◆ {g.group} ({g.points}점)
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 6, paddingLeft: 4 }}>
                {g.items.map((item) => (
                  <div key={item.key} style={{ fontSize: 14 }}>
                    {report.self_check?.[item.key] ? "✅" : "⬜"} {item.label}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </>
      )}
    </div>
  );
}
