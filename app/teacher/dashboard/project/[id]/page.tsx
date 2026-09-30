"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { buildPadletSubject, buildPadletBody } from "@/lib/padletFormat";

const PADLET_BOARD_URL = process.env.NEXT_PUBLIC_PADLET_BOARD_URL || "";

const CHECK_ITEMS: { key: string; label: string }[] = [
  { key: "purpose", label: "목적 및 주제를 명확히 작성했다" },
  { key: "algorithm", label: "알고리즘(처리 순서)을 설계했다" },
  { key: "code", label: "코드를 직접 작성하고 실행해봤다" },
  { key: "result", label: "실행 결과를 확인했다" },
  { key: "review", label: "후기 및 개선 방향을 작성했다" },
];

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

export default function TeacherProjectViewPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [student, setStudent] = useState<Student | null>(null);
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  async function copyForPadlet() {
    if (!student || !report) return;
    const subject = buildPadletSubject(student.name, report.title);
    const body = buildPadletBody({
      purpose: report.purpose,
      algorithmDesign: report.algorithm_design,
      runOutput: report.run_output,
      review: report.review,
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
    fetch(`/api/teacher/students/${params.id}/project`)
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

  return (
    <div className="container-wide">
      <div className="toolbar">
        <h1 style={{ margin: 0 }}>
          🛠️ {student.name} ({student.student_number}) 프로젝트 보고서
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
            {student.grade ?? "-"}학년 {student.class_no ?? "-"}반 ·{" "}
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
          <p style={{ fontSize: 17, fontWeight: 700 }}>{report.title || <span style={{ color: "#999" }}>(제목 없음)</span>}</p>

          <Section title="1. 목적 및 주제 선정">{report.purpose}</Section>
          <Section title="2. 알고리즘 설계">{report.algorithm_design}</Section>

          <h2>3. 코드</h2>
          <pre style={{ background: "#1e1e1e", color: "#e5e5e5", padding: 14, borderRadius: 10, fontSize: 13, overflowX: "auto" }}>
            {report.code || "(코드 없음)"}
          </pre>

          <h2>4. 실행 결과</h2>
          <pre style={{ background: "#111", color: "#0f0", padding: 12, borderRadius: 8, whiteSpace: "pre-wrap" }}>
            {report.run_output || "(실행 결과 없음)"}
          </pre>
          {report.run_note && (
            <p style={{ fontSize: 14, color: "#444", marginTop: 8 }}>{report.run_note}</p>
          )}

          <Section title="5. 후기 및 개선 방향">{report.review}</Section>
          <Section title="🤖 AI 활용 관련 안내">{report.ai_usage_note}</Section>

          <h2>자기 점검표</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {CHECK_ITEMS.map((item) => (
              <div key={item.key} style={{ fontSize: 14 }}>
                {report.self_check?.[item.key] ? "✅" : "⬜"} {item.label}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
