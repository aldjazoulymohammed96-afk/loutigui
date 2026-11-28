import { getLibsqlClient, usesTurso } from "@/lib/libsql-runtime";

export interface CheckoutSessionRecord {
  sessionId: string;
  organizationId: string;
  plan: "STARTER" | "PRO" | "AGENCE";
  amount: string;
  currency: string;
}

/**
 * Cheap server-side mapping created before the customer leaves the site.
 * The callback never has to trust metadata echoed by the payment provider:
 * if the echo is missing or tampered with, our own record remains authoritative.
 */
const memorySessions = new Map<string, CheckoutSessionRecord>();
let tableReady: Promise<void> | null = null;

async function ensureTable(): Promise<void> {
  if (!tableReady) {
    tableReady = (async () => {
      const client = await getLibsqlClient();
      await client.execute(`
        CREATE TABLE IF NOT EXISTS loutigui_checkout_sessions (
          session_id TEXT PRIMARY KEY,
          organization_id TEXT NOT NULL,
          plan TEXT NOT NULL,
          amount TEXT NOT NULL,
          currency TEXT NOT NULL,
          created_at INTEGER NOT NULL
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
    throw new Error(
      "TURSO_DATABASE_URL est obligatoire en production pour le suivi des sessions de paiement."
    );
  }
}

export async function saveCheckoutSession(record: CheckoutSessionRecord): Promise<void> {
  guard();
  if (!usesTurso()) {
    memorySessions.set(record.sessionId, record);
    return;
  }

  await ensureTable();
  const client = await getLibsqlClient();
  await client.execute({
    sql: `INSERT OR REPLACE INTO loutigui_checkout_sessions
          (session_id, organization_id, plan, amount, currency, created_at)
          VALUES (?, ?, ?, ?, ?, ?)`,
    args: [
      record.sessionId,
      record.organizationId,
      record.plan,
      record.amount,
      record.currency,
      Date.now(),
    ],
  });
}

export async function getCheckoutSession(sessionId: string): Promise<CheckoutSessionRecord | undefined> {
  guard();
  if (!usesTurso()) return memorySessions.get(sessionId);

  await ensureTable();
  const client = await getLibsqlClient();
  const result = await client.execute({
    sql: `SELECT session_id, organization_id, plan, amount, currency
          FROM loutigui_checkout_sessions WHERE session_id = ?`,
    args: [sessionId],
  });
  const row = result.rows[0];
  if (!row) return undefined;
  return {
    sessionId: String(row.session_id),
    organizationId: String(row.organization_id),
    plan: String(row.plan) as CheckoutSessionRecord["plan"],
    amount: String(row.amount),
    currency: String(row.currency),
  };
}
