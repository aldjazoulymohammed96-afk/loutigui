import { getLibsqlClient, usesTurso } from "@/lib/libsql-runtime";

/** Short-lived distributed lock used to avoid overlapping cron executions. */
const memoryLocks = new Map<string, number>();
let tableReady: Promise<void> | null = null;

async function ensureTable(): Promise<void> {
  if (!tableReady) {
    tableReady = (async () => {
      const client = await getLibsqlClient();
      await client.execute(`
        CREATE TABLE IF NOT EXISTS loutigui_locks (
          name TEXT PRIMARY KEY,
          expires_at INTEGER NOT NULL
        )
      `);
    })().catch((error) => {
      tableReady = null;
      throw error;
    });
  }
  return tableReady;
}

function guard(): void {
  if (process.env.NODE_ENV === "production" && !usesTurso()) {
    throw new Error("TURSO_DATABASE_URL est obligatoire en production pour les verrous distribués.");
  }
}

export async function acquireLock(name: string, ttlSeconds: number): Promise<boolean> {
  guard();
  const now = Date.now();

  if (!usesTurso()) {
    const expires = memoryLocks.get(name) ?? 0;
    if (expires > now) return false;
    memoryLocks.set(name, now + ttlSeconds * 1000);
    return true;
  }

  await ensureTable();
  const client = await getLibsqlClient();
  await client.execute({
    sql: `DELETE FROM loutigui_locks WHERE name = ? AND expires_at <= ?`,
    args: [name, now],
  });
  const result = await client.execute({
    sql: `INSERT OR IGNORE INTO loutigui_locks (name, expires_at) VALUES (?, ?)`,
    args: [name, now + ttlSeconds * 1000],
  });
  return result.rowsAffected === 1;
}

export async function releaseLock(name: string): Promise<void> {
  guard();
  memoryLocks.delete(name);
  if (!usesTurso()) return;

  await ensureTable();
  const client = await getLibsqlClient();
  await client.execute({ sql: `DELETE FROM loutigui_locks WHERE name = ?`, args: [name] });
}
