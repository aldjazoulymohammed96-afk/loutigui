import { getLibsqlClient, usesTurso } from "@/lib/libsql-runtime";

/**
 * Distributed sliding-window rate limiter backed by libSQL/Turso.
 *
 * The counter lives in the same durable database as the application state, so
 * every serverless instance enforces the same limit. Updates use a
 * compare-and-swap on `version` (no interactive transaction), which works over
 * Turso's HTTP API. A small in-memory bucket is kept only for local
 * development without Turso; production fails closed if the database is not
 * configured.
 */

interface Bucket {
  hits: number[];
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
}

const memoryBuckets = new Map<string, Bucket>();
const MAX_CAS_ATTEMPTS = 5;
let tableReady: Promise<void> | null = null;

async function getClient() {
  if (!tableReady) {
    tableReady = (async () => {
      const client = await getLibsqlClient();
      await client.execute(`
        CREATE TABLE IF NOT EXISTS loutigui_rate_limits (
          key TEXT PRIMARY KEY,
          hits TEXT NOT NULL,
          version INTEGER NOT NULL DEFAULT 0,
          updated_at INTEGER NOT NULL
        )
      `);
    })().catch((error) => {
      tableReady = null;
      throw error;
    });
  }
  await tableReady;
  return getLibsqlClient();
}

function memoryLimit(key: string, limit: number, windowMs: number, now: number): RateLimitResult {
  const bucket = memoryBuckets.get(key) || { hits: [] };
  bucket.hits = bucket.hits.filter((t) => now - t < windowMs);

  if (bucket.hits.length >= limit) {
    const oldest = bucket.hits[0] ?? now;
    memoryBuckets.set(key, bucket);
    return {
      allowed: false,
      remaining: 0,
      retryAfterSeconds: Math.max(1, Math.ceil((windowMs - (now - oldest)) / 1000)),
    };
  }

  bucket.hits.push(now);
  memoryBuckets.set(key, bucket);
  return { allowed: true, remaining: limit - bucket.hits.length, retryAfterSeconds: 0 };
}

export async function rateLimit(
  key: string,
  limit: number,
  windowMs: number
): Promise<RateLimitResult> {
  const now = Date.now();

  if (!usesTurso()) {
    if (process.env.NODE_ENV === "production") {
      throw new Error(
        "TURSO_DATABASE_URL est obligatoire en production pour le limiteur de débit partagé."
      );
    }
    return memoryLimit(key, limit, windowMs, now);
  }

  const client = await getClient();

  for (let attempt = 0; attempt < MAX_CAS_ATTEMPTS; attempt += 1) {
    const row = await client.execute({
      sql: `SELECT hits, version FROM loutigui_rate_limits WHERE key = ?`,
      args: [key],
    });

    const existing = row.rows[0];
    const version = existing ? Number(existing.version) : 0;
    const stored = existing ? JSON.parse(String(existing.hits)) : [];
    const hits: number[] = Array.isArray(stored) ? stored.filter((t) => typeof t === "number") : [];
    const recent = hits.filter((t) => now - t < windowMs);

    if (recent.length >= limit) {
      const oldest = recent[0] ?? now;
      return {
        allowed: false,
        remaining: 0,
        retryAfterSeconds: Math.max(1, Math.ceil((windowMs - (now - oldest)) / 1000)),
      };
    }

    recent.push(now);

    const write = existing
      ? await client.execute({
          sql: `UPDATE loutigui_rate_limits
                SET hits = ?, version = version + 1, updated_at = ?
                WHERE key = ? AND version = ?`,
          args: [JSON.stringify(recent), now, key, version],
        })
      : await client.execute({
          sql: `INSERT OR IGNORE INTO loutigui_rate_limits (key, hits, version, updated_at)
                VALUES (?, ?, 1, ?)`,
          args: [key, JSON.stringify(recent), now],
        });

    if (write.rowsAffected === 1) {
      // Opportunistic cleanup of expired keys; keep it rare to avoid extra writes.
      if (Math.random() < 0.01) {
        await client.execute({
          sql: `DELETE FROM loutigui_rate_limits WHERE updated_at < ?`,
          args: [now - windowMs * 10],
        });
      }
      return { allowed: true, remaining: limit - recent.length, retryAfterSeconds: 0 };
    }
  }

  // Fail closed: never let a burst through because the shared limiter failed.
  throw new Error("Limiteur de débit indisponible.");
}

/**
 * Only trust IPs set by the hosting platform. On Vercel,
 * `x-vercel-forwarded-for` is written by the edge network; a plain
 * `x-forwarded-for` sent by a client must not be allowed to reset the bucket.
 */
export function rateLimitKey(request: Request, scope: string): string {
  const platformIp =
    request.headers.get("x-vercel-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip")?.trim();
  const ip = platformIp || "unknown";
  return `${scope}:${ip}`;
}
