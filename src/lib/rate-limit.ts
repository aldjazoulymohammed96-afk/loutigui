/**
 * Minimal in-memory sliding-window rate limiter.
 *
 * It protects a single Node process (sufficient for a self-hosted deployment
 * or a single Vercel instance). For multi-instance deployments, replace the
 * Map with Redis/Upstash — the interface stays the same.
 */

interface Bucket {
  hits: number[];
}

const buckets = new Map<string, Bucket>();

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
}

export function rateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now();
  const bucket = buckets.get(key) || { hits: [] };
  bucket.hits = bucket.hits.filter((t) => now - t < windowMs);

  if (bucket.hits.length >= limit) {
    const oldest = bucket.hits[0] ?? now;
    buckets.set(key, bucket);
    return {
      allowed: false,
      remaining: 0,
      retryAfterSeconds: Math.max(1, Math.ceil((windowMs - (now - oldest)) / 1000)),
    };
  }

  bucket.hits.push(now);
  buckets.set(key, bucket);

  // Opportunistic cleanup to avoid unbounded memory growth.
  if (buckets.size > 5000) {
    for (const [k, v] of buckets) {
      if (v.hits.length === 0 || now - (v.hits[v.hits.length - 1] ?? 0) > windowMs) {
        buckets.delete(k);
      }
    }
  }

  return { allowed: true, remaining: limit - bucket.hits.length, retryAfterSeconds: 0 };
}

export function rateLimitKey(request: Request, scope: string): string {
  const forwarded = request.headers.get("x-forwarded-for");
  const ip = forwarded?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "unknown";
  return `${scope}:${ip}`;
}
