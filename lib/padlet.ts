// 학생이 프로젝트를 "제출"할 때, 설정되어 있으면 Padlet 보드에도 자동으로 게시합니다.
// PADLET_API_KEY / PADLET_BOARD_ID 환경변수가 없으면 그냥 건너뜁니다 (기능이 꺼진 상태로 동작).
// Padlet 공개 API는 개인 유료 계정에서만 발급되는 API 키가 필요합니다. (그룹/학교 계정 불가)

export async function postToPadlet(subject: string, body: string): Promise<string | null> {
  const apiKey = process.env.PADLET_API_KEY;
  const boardId = process.env.PADLET_BOARD_ID;

  if (!apiKey || !boardId) {
    // 아직 설정 전이면 조용히 건너뜁니다. (학생 제출 자체는 정상적으로 계속 진행)
    return null;
  }

  try {
    const res = await fetch(`https://api.padlet.dev/v1/boards/${boardId}/posts`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
      },
      body: JSON.stringify({
        type: "post",
        content: {
          subject: subject.slice(0, 200),
          body: body.slice(0, 2000),
        },
      }),
    });

    if (!res.ok) {
      console.error("Padlet 게시 실패:", res.status, await res.text());
      return null;
    }

    const data = await res.json();
    return data?.data?.id ?? null;
  } catch (err) {
    console.error("Padlet 게시 중 오류:", err);
    return null;
  }
}
