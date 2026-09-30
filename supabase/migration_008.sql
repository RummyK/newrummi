-- Supabase SQL Editor 에서 이 파일 전체를 붙여넣고 Run 하세요. (migration_007.sql 실행 후 여덟 번째 실행)
-- "파이썬 문제해결 프로젝트" 안에 두 번째 보고서 양식(Padlet업로드 보고서)을 추가합니다.
-- 기존 "탐구 보고서"(project_reports 표)는 그대로 두고, 별도의 표를 새로 만듭니다.

create table if not exists padlet_reports (
  id uuid primary key default gen_random_uuid(),
  student_id uuid references students(id) on delete cascade unique,
  subject text,              -- 정보 / 수학 / 과학
  title text,
  purpose text,               -- 01. 프로젝트 목적
  topic_reason text,          -- 01. 주제 선정 이유
  algorithm_steps jsonb default '[]'::jsonb,   -- 02. 알고리즘 순서도 (단계별)
  key_concepts jsonb default '{}'::jsonb,      -- 02. 핵심 개념 (조건문/반복문/함수 예시)
  code text,                  -- 03. 전체 소스 코드
  code_explanation text,      -- 03. 코드 설명
  run_output text,            -- 04. 실행 결과 화면
  result_analysis text,       -- 04. 결과 분석
  error_improvement text,     -- 04. 오류 및 개선
  learned text,                -- 05. 배운 점
  difficulty_note text,        -- 05. 어려웠던 점
  future_direction text,       -- 05. 발전 방향
  ai_usage_note text,          -- AI 유의사항 관련 기재
  self_check jsonb default '{}'::jsonb,        -- 자기 점검표
  submitted boolean default false,
  submitted_at timestamptz,
  padlet_post_id text,
  padlet_posted_at timestamptz,
  updated_at timestamptz default now(),
  created_at timestamptz default now()
);

alter table padlet_reports enable row level security;
-- (정책을 추가하지 않아 service_role 서버 API에서만 접근 가능 - 의도된 설정)
