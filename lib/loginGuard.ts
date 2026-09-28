import { supabaseAdmin } from "@/lib/supabaseAdmin";

// 짧은 시간 안에 로그인을 반복 실패하면 잠시 잠그는 로직 (무차별 대입 공격 방어)
const MAX_FAILS = 5;
const LOCK_MINUTES = 10;

export async function checkLoginLock(key: string): Promise<{ locked: boolean; retryAfterMinutes?: number }> {
  const { data } = await supabaseAdmin.from("login_attempts").select("*").eq("key", key).maybeSingle();
  if (!data || !data.locked_until) return { locked: false };

  const lockedUntil = new Date(data.locked_until).getTime();
  const now = Date.now();
  if (now < lockedUntil) {
    return { locked: true, retryAfterMinutes: Math.ceil((lockedUntil - now) / 60000) };
  }
  return { locked: false };
}

export async function recordLoginFailure(key: string) {
  const { data } = await supabaseAdmin.from("login_attempts").select("*").eq("key", key).maybeSingle();
  const failCount = (data?.fail_count ?? 0) + 1;
  const lockedUntil =
    failCount >= MAX_FAILS ? new Date(Date.now() + LOCK_MINUTES * 60000).toISOString() : null;

  await supabaseAdmin.from("login_attempts").upsert({
    key,
    fail_count: failCount,
    locked_until: lockedUntil,
    updated_at: new Date().toISOString(),
  });
}

export async function clearLoginFailures(key: string) {
  await supabaseAdmin.from("login_attempts").delete().eq("key", key);
}
