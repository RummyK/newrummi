-- Supabase SQL Editor 에서 이 파일 전체를 붙여넣고 Run 하세요. (migration_003.sql 실행 후 네 번째 실행)
-- 학생이 회차(1/2/3회차)를 시작한 시각과 종료 시각을 기록하는 표.
-- "시작" 버튼을 누른 순간부터 50분이 서버에 기록되므로, 새로고침하거나 다른 기기로 들어와도
-- 타이머가 초기화되지 않고 그대로 이어집니다.

create table if not exists round_attempts (
  id uuid primary key default gen_random_uuid(),
  student_id uuid references students(id) on delete cascade,
  round_number int not null check (round_number in (1, 2, 3)),
  started_at timestamptz not null default now(),
  ends_at timestamptz not null,
  unique (student_id, round_number)
);

alter table round_attempts enable row level security;
-- (정책을 추가하지 않아 service_role 서버 API에서만 접근 가능 - 의도된 설정)
