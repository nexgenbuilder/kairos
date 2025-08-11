// src/lib/limiter.ts
// token-bucket-ish: N requests/window per IP. In-memory for dev/single node.
type Bucket = { tokens: number; resetAt: number };
const buckets = new Map<string, Bucket>();

const WINDOW_MS = Number(process.env.RL_WINDOW_MS ?? 10_000);   // 10s
const MAX_TOKENS = Number(process.env.RL_MAX_TOKENS ?? 50);     // 50 writes / 10s per IP

export function checkLimit(ip: string): { allowed: boolean; retryAfter?: number } {
  const now = Date.now();
  const b = buckets.get(ip);
  if (!b || b.resetAt <= now) {
    buckets.set(ip, { tokens: MAX_TOKENS - 1, resetAt: now + WINDOW_MS });
    return { allowed: true };
  }
  if (b.tokens > 0) {
    b.tokens -= 1;
    return { allowed: true };
  }
  return { allowed: false, retryAfter: Math.ceil((b.resetAt - now) / 1000) };
}
