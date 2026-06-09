import { createClient } from "@/lib/supabase/server";

/** 현재 세션 사용자가 관리자인지 검증 (서버 전용, 이중 방어의 서버 측). */
export async function requireAdmin(): Promise<
  { ok: true; userId: string } | { ok: false }
> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false };

  const { data, error } = await supabase
    .from("ib_admins")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error || !data) return { ok: false };
  return { ok: true, userId: user.id };
}
