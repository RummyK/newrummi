-- Supabase 대시보드 > SQL Editor 에서 이 파일 전체를 붙여넣고 Run 하세요.
-- (이미 한 번 실행하셨다면 다시 실행할 필요 없습니다 - migration_002.sql로 넘어가세요.)

create extension if not exists "pgcrypto";

-- 교사 계정 (학생 계정과 완전히 분리)
create table if not exists teachers (
  id uuid primary key default gen_random_uuid(),
  username text unique not null,
  password_hash text not null,
  name text not null,
  created_at timestamptz default now()
);

-- 학생 계정: 학번 + 이름 + 비밀번호 3가지 모두 일치해야 로그인
create table if not exists students (
  id uuid primary key default gen_random_uuid(),
  student_number text unique not null,  -- 학번, 예: 20601
  name text not null,
  password_hash text not null,
  grade int,
  class_no int,
  created_at timestamptz default now()
);

-- 과목 (프로그래밍, 인공지능 기초 등 여러 과목 자료 업로드용)
create table if not exists subjects (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  teacher_id uuid references teachers(id) on delete set null,
  created_at timestamptz default now()
);

-- 과목별 업로드 자료 (파일은 Supabase Storage에 저장하고 경로만 기록)
create table if not exists materials (
  id uuid primary key default gen_random_uuid(),
  subject_id uuid references subjects(id) on delete cascade,
  title text not null,
  description text,
  file_path text,
  uploaded_at timestamptz default now()
);

-- 파이썬 문제
create table if not exists python_problems (
  id uuid primary key default gen_random_uuid(),
  problem_number int not null,
  title text not null,
  description text,
  answer_hash text,
  difficulty text,
  created_at timestamptz default now()
);

-- 학생 제출 기록
create table if not exists submissions (
  id uuid primary key default gen_random_uuid(),
  student_id uuid references students(id) on delete cascade,
  problem_id uuid references python_problems(id) on delete cascade,
  code text,
  is_correct boolean,
  submitted_at timestamptz default now()
);

-- 모든 테이블은 RLS를 켜고, 서버(API 라우트)에서만 service_role 키로 접근하도록 제한합니다.
-- 클라이언트(브라우저)는 절대 이 테이블에 직접 접근하지 않고, 반드시 /api/* 경유합니다.
alter table teachers enable row level security;
alter table students enable row level security;
alter table subjects enable row level security;
alter table materials enable row level security;
alter table python_problems enable row level security;
alter table submissions enable row level security;
-- (정책을 하나도 추가하지 않으면 anon/authenticated 키로는 아무것도 조회/수정 못 하고,
--  service_role 키를 쓰는 서버 API 라우트만 접근 가능합니다 - 이것이 의도된 보안 설정입니다.)
