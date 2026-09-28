// 비밀번호 정책: 8자 이상. 학생·교사 공통 규칙이라 한 곳에 모아둠.
export function isPasswordValid(password: string): boolean {
  return typeof password === "string" && password.length >= 8;
}

export const PASSWORD_POLICY_MESSAGE = "비밀번호는 8자 이상이어야 합니다.";
