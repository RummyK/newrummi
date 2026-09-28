-- Supabase SQL Editor 에서 이 파일 전체를 붙여넣고 Run 하세요. (migration_002.sql 실행 후 세 번째 실행)
-- 파이썬 문제풀이 화면에 쓸 샘플 문제 8개를 넣습니다. (나중에 교사 화면에서 직접 추가/수정하는 기능으로 확장 가능)

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'python_problems_number_unique'
  ) then
    alter table python_problems add constraint python_problems_number_unique unique (problem_number);
  end if;
end $$;

insert into python_problems (problem_number, title, description, answer_hash, difficulty) values
(1, '문자열 출력', '화면에 정확히 다음 문장 한 줄을 출력하시오.

Hello, Python!', '1c68755fc075a6bb08a82e80a5f1d3c8a8d40086a73cd8195ec7c43a7554f188', '하'),
(2, '두 수의 합', '정수 3과 5를 더한 값을 출력하시오.', '2c624232cdd221771294dfbb310aca000a0df6ac8b66b696d90ef06fdefb64a3', '하'),
(3, '1부터 10까지의 합', '1부터 10까지의 합을 출력하시오. (반복문을 사용하세요)', '02d20bbd7e394ad5999a4cebabac9619732c343a4cac99470c03e23ba2bdc2bc', '하'),
(4, '구구단 2단', '구구단 2단을 "2 x 1 = 2" 형식으로, 1부터 9까지 한 줄에 하나씩 출력하시오.', '022a924459a04b1c22295dcfc090bbc458610f1cae5e1be76d783cbf6882e8be', '중'),
(5, '리스트의 합과 평균', '리스트 [1, 2, 3, 4, 5]의 합과 평균을 각각 한 줄씩 출력하시오. (합을 먼저, 평균을 다음 줄에)', 'e8b3fdc87e7d796237c08593c0cae3286a1f1b667e8394dc24915770db9eecf1', '중'),
(6, '짝수만 출력', '1부터 20까지의 숫자 중 짝수만 한 줄에 하나씩 출력하시오.', '8b0776f02aa890dec852da460e81d2697831ef827939ca1c8b30f816543cf335', '중'),
(7, '문자열 뒤집기', '문자열 "Python"을 거꾸로 뒤집어 출력하시오.', 'd7505b341557b55db09e9e7615a7439208d881340522f0f159d3ba75461551d4', '중'),
(8, '3의 배수 개수', '1부터 100까지의 수 중에서 3의 배수의 개수를 출력하시오.', 'c6f3ac57944a531490cd39902d0f777715fd005efac9a30622d5f5205e7f6894', '상')
on conflict (problem_number) do nothing;
