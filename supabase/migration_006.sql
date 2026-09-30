-- Supabase SQL Editor 에서 이 파일 전체를 붙여넣고 Run 하세요. (migration_005.sql 실행 후 여섯 번째 실행)
-- "파이썬 문제해결 프로젝트" (자동채점이 아닌 보고서형 프로젝트) 제출을 위한 표를 추가합니다.
-- 학생 한 명당 프로젝트 보고서 1개 (계속 수정하다가 마지막에 "제출 완료"로 확정)

create table if not exists project_reports (
  id uuid primary key default gen_random_uuid(),
  student_id uuid references students(id) on delete cascade unique,
  title text,
  purpose text,           -- 1. 목적 및 주제 선정
  algorithm_design text,  -- 2. 알고리즘 설계
  code text,              -- 3. 코드 작성
  run_output text,        -- 4. 실행 결과 (직접 실행해본 출력)
  run_note text,          -- 4. 실행 결과에 대한 설명 (선택)
  review text,            -- 5. 후기 및 개선 방향
  ai_usage_note text,     -- AI 활용 여부/방식 안내
  self_check jsonb default '{}'::jsonb, -- 자기 점검표 체크리스트
  submitted boolean default false,      -- 제출 완료 여부 (false면 임시저장 상태)
  submitted_at timestamptz,
  updated_at timestamptz default now(),
  created_at timestamptz default now()
);

alter table project_reports enable row level security;
-- (정책을 추가하지 않아 service_role 서버 API에서만 접근 가능 - 의도된 설정)
