-- Supabase SQL Editor 에서 이 파일 전체를 붙여넣고 Run 하세요. (schema.sql 실행 후 두 번째 실행)

-- 1) 학생이 첫 로그인 때 비밀번호를 바꾸도록 강제하는 표시
alter table students
  add column if not exists must_change_password boolean not null default true;

-- 2) 로그인 실패 횟수 기록 (무차별 대입 공격 방어용)
create table if not exists login_attempts (
  key text primary key,            -- 예: 'student:20601' , 'teacher:kimareum'
  fail_count int not null default 0,
  locked_until timestamptz,
  updated_at timestamptz not null default now()
);

-- 서버(service_role)만 접근 가능하도록 RLS 켜기 (정책을 추가하지 않는 것이 의도된 설정)
alter table login_attempts enable row level security;
