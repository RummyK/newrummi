// Padlet에 자동 게시가 안 되는 계정(학교/그룹 계정)을 위해, 학생/교사가 직접 복사해서
// Padlet 게시물에 붙여넣을 수 있는 텍스트를 만들어주는 공통 함수입니다.

export function buildPadletSubject(studentName: string, title: string) {
  return `[${studentName}] ${title || "제목 없음"}`;
}

export function buildPadletBody(params: {
  purpose: string;
  algorithmDesign: string;
  runOutput: string;
  review: string;
}) {
  const { purpose, algorithmDesign, runOutput, review } = params;
  return [
    `📌 목적 및 주제`,
    purpose || "-",
    ``,
    `⚙️ 알고리즘 설계`,
    algorithmDesign || "-",
    ``,
    `▶ 실행 결과`,
    runOutput || "-",
    ``,
    `💡 후기 및 개선 방향`,
    review || "-",
  ].join("\n");
}

// Padlet업로드 보고서(양식 2) 전용 포맷
export function buildPadletV2Subject(studentName: string, title: string) {
  return `[${studentName}] ${title || "제목 없음"}`;
}

export function buildPadletV2Body(params: {
  subject: string;
  purpose: string;
  topicReason: string;
  codeExplanation: string;
  runOutput: string;
  resultAnalysis: string;
  learned: string;
  difficultyNote: string;
  futureDirection: string;
}) {
  const {
    subject,
    purpose,
    topicReason,
    codeExplanation,
    runOutput,
    resultAnalysis,
    learned,
    difficultyNote,
    futureDirection,
  } = params;
  return [
    subject ? `과목: ${subject}` : null,
    ``,
    `📌 프로젝트 목적`,
    purpose || "-",
    ``,
    `📎 주제 선정 이유`,
    topicReason || "-",
    ``,
    `⚙️ 코드 설명`,
    codeExplanation || "-",
    ``,
    `▶ 실행 결과`,
    runOutput || "-",
    ``,
    `📊 결과 분석`,
    resultAnalysis || "-",
    ``,
    `💡 배운 점`,
    learned || "-",
    ``,
    `🔧 어려웠던 점`,
    difficultyNote || "-",
    ``,
    `🚀 발전 방향`,
    futureDirection || "-",
  ]
    .filter((line) => line !== null)
    .join("\n");
}
