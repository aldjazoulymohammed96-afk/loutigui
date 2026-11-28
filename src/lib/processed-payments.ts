import { getLibsqlClient, usesTurso } from "@/lib/libsql-runtime";

/**
 * Atomic idempotency ledger for money-moving webhooks.
 *
 * A UNIQUE primary key in Turso decides who wins when two signed webhooks for
 * the same provider reference arrive concurrently. This is stronger than
 * reading the state document first and writing it afterwards, which leaves a
 * race window between two serverless instances.
 */
const memoryClaims = new Map<string, { organizationId: string; plan?: string }>();
let tableReady: Promise<void> | null = null;

async function ensureTable(): Promise<void> {
  if (!tableReady) {
    tableReady = (async () => {
      const client = await getLibsqlClient();
      await client.execute(`
        CREATE TABLE IF NOT EXISTS loutigui_processed_payments (
          scope TEXT NOT NULL,
          reference TEXT NOT NULL,
          organization_id TEXT NOT NULL,
          plan TEXT,
          created_at INTEGER NOT NULL,
          PRIMARY KEY (scope, reference)
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
      "TURSO_DATABASE_URL est obligatoire en production pour l'idempotence des paiements."
    );
  }
}

export interface PaymentClaim {
  reference: string;
  scope: "subscription" | "rent";
  organizationId: string;
  plan?: string;
}

/** Returns true only for the caller that atomically claimed this reference. */
export async function claimPaymentReference(claim: PaymentClaim): Promise<boolean> {
  guard();
  const key = `${claim.scope}:${claim.reference}`;

  if (!usesTurso()) {
    if (memoryClaims.has(key)) return false;
    memoryClaims.set(key, { organizationId: claim.organizationId, plan: claim.plan });
    return true;
  }

  await ensureTable();
  const client = await getLibsqlClient();
  const result = await client.execute({
    sql: `INSERT OR IGNORE INTO loutigui_processed_payments
          (reference, scope, organization_id, plan, created_at)
          VALUES (?, ?, ?, ?, ?)`,
    args: [claim.reference, claim.scope, claim.organizationId, claim.plan ?? null, Date.now()],
  });
  return result.rowsAffected === 1;
}

/** Release a claim when the subsequent business write failed, so a retry can work. */
export async function releasePaymentReference(reference: string, scope: PaymentClaim["scope"]): Promise<void> {
  guard();
  memoryClaims.delete(`${scope}:${reference}`);
  if (!usesTurso()) return;

  await ensureTable();
  const client = await getLibsqlClient();
  await client.execute({
    sql: `DELETE FROM loutigui_processed_payments WHERE reference = ? AND scope = ?`,
    args: [reference, scope],
  });
}
