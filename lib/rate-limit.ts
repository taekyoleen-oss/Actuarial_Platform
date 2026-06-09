// v1.0 최소안: 인메모리 IP 레이트 리밋. 단일 인스턴스 가정.
// (멀티 인스턴스/엣지 분산 환경에서는 v2.0에서 Upstash 등으로 대체)

const hits = new Map<string, { count: number; resetAt: number }>();

/** @returns true=허용, false=차단 */
export function rateLimit(key: string, limit = 5, windowMs = 60_000): boolean {
  const now = Date.now();
  const entry = hits.get(key);
  if (!entry || now > entry.resetAt) {
    hits.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (entry.count >= limit) return false;
  entry.count += 1;
  return true;
}

/** 요청에서 클라이언트 IP 추출 */
export function clientIp(req: Request): string {
  const xff = req.headers.get("x-forwarded-for");
  return xff?.split(",")[0]?.trim() || "unknown";
}
