import "./globals.css";

export const metadata = {
  title: "남목고 정보 학습 사이트",
  description: "파이썬 문제풀이 및 과목 자료 통합 사이트",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
