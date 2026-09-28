import { NextRequest } from "next/server";
import { verifySessionToken, SESSION_COOKIE_NAME, SessionPayload } from "@/lib/auth";

// 교사 전용 API 라우트 앞부분에서 호출: 교사 세션이 아니면 null 반환
export async function requireTeacherSession(req: NextRequest): Promise<SessionPayload | null> {
  const token = req.cookies.get(SESSION_COOKIE_NAME)?.value;
  const session = token ? await verifySessionToken(token) : null;
  if (!session || session.role !== "teacher") return null;
  return session;
}
