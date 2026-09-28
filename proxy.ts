import { NextRequest, NextResponse } from "next/server";
import { verifySessionToken, SESSION_COOKIE_NAME } from "@/lib/auth";

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const token = req.cookies.get(SESSION_COOKIE_NAME)?.value;
  const session = token ? await verifySessionToken(token) : null;

  if (pathname.startsWith("/teacher/dashboard")) {
    if (!session || session.role !== "teacher") {
      return NextResponse.redirect(new URL("/teacher/login", req.url));
    }
  }

  if (pathname.startsWith("/dashboard") || pathname.startsWith("/change-password")) {
    if (!session || session.role !== "student") {
      return NextResponse.redirect(new URL("/login", req.url));
    }
    // 비밀번호를 아직 안 바꾼 학생은 문제풀이 화면 대신 비밀번호 변경 화면으로 보냄
    if (session.mustChangePassword && pathname.startsWith("/dashboard")) {
      return NextResponse.redirect(new URL("/change-password", req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/teacher/dashboard/:path*", "/change-password"],
};
