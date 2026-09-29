import Link from "next/link";

export default function Home() {
  return (
    <>
      <div className="banner">
        <div className="banner-emoji">🌙✨</div>
        <h1 className="banner-title">남목고등학교 정보 수행평가 사이트</h1>
        <p className="banner-sub">김아름T</p>
      </div>
      <div className="container home-links" style={{ margin: "24px auto 72px" }}>
        <Link href="/login">🧑‍🎓 학생 로그인</Link>
        <Link href="/teacher/login">🍎 교사 로그인</Link>
      </div>
    </>
  );
}
