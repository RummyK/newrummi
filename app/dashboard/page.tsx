// @next-codemod-ignore Cache Components adoption: this segment temporarily allows blocking.
// Remove this opt-out after verifying the segment passes validation without it.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false;

export default function StudentDashboard() {
  return (
    <div className="container">
      <h1>로그인 성공</h1>
      <p>여기에 파이썬 문제풀이 화면이 다음 단계에서 들어갑니다.</p>
    </div>
  );
}
