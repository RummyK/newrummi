import { createClient } from "@supabase/supabase-js";

// 이 파일은 서버(API 라우트)에서만 import 하세요.
// service_role 키는 모든 테이블에 접근 가능하므로 클라이언트(브라우저) 코드에서 절대 사용하지 마세요.
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);
