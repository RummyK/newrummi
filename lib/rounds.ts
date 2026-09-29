// 100문제를 40/30/30으로 나눈 3개 회차 정의. 서버 API와 브라우저 화면 양쪽에서 그대로 가져다 씁니다.
// 문제 번호(problem_number) 기준으로 회차를 나누므로, 나중에 문제를 100개까지 채워 넣기만 하면
// 이 설정을 바꿀 필요 없이 자동으로 회차가 맞춰집니다.
export const ROUND_TIME_LIMIT_MINUTES = 50;

export const ROUNDS = [
  { number: 1, count: 40, minNumber: 1, maxNumber: 40 },
  { number: 2, count: 30, minNumber: 41, maxNumber: 70 },
  { number: 3, count: 30, minNumber: 71, maxNumber: 100 },
] as const;

export type RoundNumber = 1 | 2 | 3;

export function isValidRoundNumber(n: unknown): n is RoundNumber {
  return n === 1 || n === 2 || n === 3;
}

export function getRoundDef(roundNumber: RoundNumber) {
  return ROUNDS.find((r) => r.number === roundNumber)!;
}

export function getRoundForProblemNumber(problemNumber: number): RoundNumber | null {
  const found = ROUNDS.find((r) => problemNumber >= r.minNumber && problemNumber <= r.maxNumber);
  return found ? (found.number as RoundNumber) : null;
}
