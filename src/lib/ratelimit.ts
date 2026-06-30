// Durable-ish rate limiting. Uses Upstash Redis (works on Vercel's serverless
// runtime) when UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN are set;
// otherwise falls back to a per-instance in-memory limiter.
//
// TRADEOFF: the in-memory fallback is per-serverless-instance and resets on
// redeploy/scale, so it is best-effort only. For real protection under paid ad
// traffic, configure Upstash (free tier is sufficient). All callers should
// treat a limiter result as advisory + defence-in-depth, never the only guard.

import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

export type Duration = `${number} ${"s" | "m" | "h" | "d"}`;

export interface RateLimitResult {
  success: boolean;
  remaining: number;
}

const hasRedis = Boolean(
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN,
);

const redis = hasRedis ? Redis.fromEnv() : null;

/** True when a real (Upstash) limiter backs the calls. */
export function rateLimitDurable(): boolean {
  return Boolean(redis);
}

// ── Upstash limiters (cached per limit+window) ───────────────────────────────
const upstashCache = new Map<string, Ratelimit>();

function upstashLimiter(limit: number, window: Duration): Ratelimit {
  const key = `${limit}:${window}`;
  let rl = upstashCache.get(key);
  if (!rl) {
    rl = new Ratelimit({
      redis: redis!,
      limiter: Ratelimit.slidingWindow(limit, window),
      prefix: "rl",
      analytics: false,
    });
    upstashCache.set(key, rl);
  }
  return rl;
}

// ── In-memory fallback ───────────────────────────────────────────────────────
const memHits = new Map<string, { count: number; resetAt: number }>();

function durationToMs(window: Duration): number {
  const [n, unit] = window.split(" ");
  const value = Number(n);
  const mult = unit === "s" ? 1e3 : unit === "m" ? 6e4 : unit === "h" ? 3.6e6 : 8.64e7;
  return value * mult;
}

function memLimit(key: string, limit: number, window: Duration): RateLimitResult {
  const now = Date.now();
  const entry = memHits.get(key);
  if (!entry || entry.resetAt <= now) {
    memHits.set(key, { count: 1, resetAt: now + durationToMs(window) });
    return { success: true, remaining: limit - 1 };
  }
  if (entry.count >= limit) return { success: false, remaining: 0 };
  entry.count += 1;
  return { success: true, remaining: limit - entry.count };
}

/**
 * Consume one token for `key`. `limit` per `window` (e.g. `rateLimit("ip:1.2.3.4",
 * 5, "1 m")`). Never throws — on an Upstash error it fails OPEN (allows) so the
 * limiter can never take the site down.
 */
export async function rateLimit(
  key: string,
  limit: number,
  window: Duration,
): Promise<RateLimitResult> {
  if (redis) {
    try {
      const r = await upstashLimiter(limit, window).limit(key);
      return { success: r.success, remaining: r.remaining };
    } catch (err) {
      console.error("[ratelimit] upstash error — failing open:", err);
      return { success: true, remaining: limit };
    }
  }
  return memLimit(key, limit, window);
}

/** Best-effort client IP from forwarding headers. */
export function clientIp(req: Request): string {
  const realIp = req.headers.get("x-real-ip")?.trim();
  if (realIp) return realIp;
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0]?.trim() || "unknown";
  return "unknown";
}
