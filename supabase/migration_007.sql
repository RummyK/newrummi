-- Supabase SQL Editor 에서 이 파일 전체를 붙여넣고 Run 하세요. (migration_006.sql 실행 후 일곱 번째 실행)
-- 프로젝트를 제출할 때 Padlet에도 자동으로 게시하기 위해, 이미 게시했는지 기록하는 컬럼을 추가합니다.

alter table project_reports add column if not exists padlet_post_id text;
alter table project_reports add column if not exists padlet_posted_at timestamptz;
