import Link from "next/link";

export default function Home() {
  return (
    <div className="container home-links">
      <h1>정보 학습 사이트</h1>
      <Link href="/login">학생 로그인</Link>
      <Link href="/teacher/login">교사 로그인</Link>
    </div>
  );
}
