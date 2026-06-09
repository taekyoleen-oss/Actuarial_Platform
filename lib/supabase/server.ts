import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";

type CookieToSet = { name: string; value: string; options?: CookieOptions };

/** 서버 컴포넌트/Route Handler용 Supabase 클라이언트 (anon 키 + 쿠키 세션). */
export async function createClient() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: CookieToSet[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // 서버 컴포넌트에서 set 호출 시 무시 (미들웨어가 세션 갱신 담당)
          }
        },
      },
    }
  );
}

/**
 * 서비스 롤 클라이언트 — 서버 전용. 파일 업로드 등 RLS 우회가 필요한 관리 작업에만 사용.
 * 절대 클라이언트 번들에 포함되지 않도록 Route Handler/Server Action에서만 import.
 */
export function createServiceClient() {
  const { createClient: createSb } = require("@supabase/supabase-js");
  return createSb(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  );
}
