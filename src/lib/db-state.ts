import { AsyncLocalStorage } from "node:async_hooks";
import fs from "fs";
import path from "path";
import type { Pool } from "pg";
import type { DatabaseSchema } from "@/lib/db-types";

/**
 * Transactional state backend.
 *
 * Production uses PostgreSQL: every operation runs in a transaction that
 * locks the state row (`SELECT … FOR UPDATE`), runs the existing business
 * logic synchronously on a private copy, then commits the new document. This
 * gives durability, atomicity and correct behaviour with several serverless
 * instances, without any writable filesystem.
 *
 * When DATABASE_URL is absent (local development only) the same operation is
 * applied to data/db.json with an atomic temp-file + rename write.
 */

const STATE_ID = "main";
const DB_DIR = path.join(process.cwd(), "data");
const DB_FILE = path.join(DB_DIR, "db.json");

export interface NormalizeResult {
  db: DatabaseSchema;
  changed: boolean;
}

interface StateContext {
  db: DatabaseSchema;
  dirty: boolean;
}

const stateContext = new AsyncLocalStorage<StateContext>();

export function usesPostgres(): boolean {
  return Boolean(process.env.DATABASE_URL?.trim());
}

export function emptyDatabase(): DatabaseSchema {
  return {
    schemaVersion: 2,
    organizations: [],
    users: [],
    buildings: [],
    units: [],
    tenants: [],
    leases: [],
    installments: [],
    payments: [],
    receipts: [],
    tickets: [],
    reminders: [],
    auditLogs: [],
    passwordResets: [],
    nextReceiptSeq: 1,
  };
}

/** Working copy for the current operation, never shared between requests. */
export function currentDb(): DatabaseSchema {
  const ctx = stateContext.getStore();
  if (!ctx) throw new Error("Opération de stockage indisponible.");
  return ctx.db;
}

/** Called by the store instead of writing to disk immediately. */
export function markDirty(): void {
  const ctx = stateContext.getStore();
  if (ctx) ctx.dirty = true;
}

let poolPromise: Promise<Pool> | null = null;

async function getPool(): Promise<Pool> {
  if (poolPromise) return poolPromise;

  poolPromise = (async () => {
    const connectionString = process.env.DATABASE_URL?.trim();
    if (!connectionString) {
      throw new Error("DATABASE_URL n'est pas configuré.");
    }

    const { Pool } = await import("pg");
    const url = new URL(connectionString);
    const sslMode = url.searchParams.get("sslmode");
    const ssl =
      sslMode && sslMode !== "disable"
        ? { rejectUnauthorized: process.env.PGSSL_REJECT_UNAUTHORIZED !== "false" }
        : undefined;

    const pool = new Pool({
      connectionString,
      ssl,
      max: Number(process.env.DB_POOL_MAX || 10),
      connectionTimeoutMillis: 10_000,
    });

    await ensureSchema(pool);
    return pool;
  })().catch((error) => {
    poolPromise = null;
    throw error;
  });

  return poolPromise;
}

async function ensureSchema(pool: Pool): Promise<void> {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS loutigui_state (
      id text PRIMARY KEY,
      data jsonb NOT NULL,
      updated_at timestamptz NOT NULL DEFAULT now()
    )
  `);
  await pool.query(
    `INSERT INTO loutigui_state (id, data)
     VALUES ($1, $2::jsonb)
     ON CONFLICT (id) DO NOTHING`,
    [STATE_ID, JSON.stringify(emptyDatabase())]
  );
}

async function withPostgres<T>(
  normalize: (raw: unknown) => NormalizeResult,
  work: () => T
): Promise<T> {
  const pool = await getPool();
  const client = await pool.connect();

  try {
    await client.query("BEGIN");
    const result = await client.query<{ data: DatabaseSchema }>(
      "SELECT data FROM loutigui_state WHERE id = $1 FOR UPDATE",
      [STATE_ID]
    );

    const normalized = normalize(result.rows[0]?.data ?? null);
    const ctx: StateContext = { db: normalized.db, dirty: normalized.changed };
    const value = stateContext.run(ctx, work);

    if (ctx.dirty) {
      await client.query(
        "UPDATE loutigui_state SET data = $1::jsonb, updated_at = now() WHERE id = $2",
        [JSON.stringify(ctx.db), STATE_ID]
      );
    }
    await client.query("COMMIT");
    return value;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

function readJsonFile(): unknown {
  try {
    if (!fs.existsSync(DB_FILE)) return null;
    return JSON.parse(fs.readFileSync(DB_FILE, "utf-8"));
  } catch (error) {
    console.error("Impossible de lire data/db.json, démarrage sur une base vide :", error);
    return null;
  }
}

function writeJsonFile(db: DatabaseSchema): void {
  try {
    if (!fs.existsSync(DB_DIR)) fs.mkdirSync(DB_DIR, { recursive: true });
    const tempFile = `${DB_FILE}.${process.pid}.tmp`;
    fs.writeFileSync(tempFile, JSON.stringify(db, null, 2), { encoding: "utf-8", mode: 0o600 });
    fs.renameSync(tempFile, DB_FILE);
  } catch (error) {
    console.error("Échec de la sauvegarde de la base de données :", error);
    throw new Error("Impossible d'enregistrer les données. Réessayez.");
  }
}

function withJsonFile<T>(normalize: (raw: unknown) => NormalizeResult, work: () => T): T {
  const normalized = normalize(readJsonFile());
  const ctx: StateContext = { db: normalized.db, dirty: normalized.changed };
  const value = stateContext.run(ctx, work);
  if (ctx.dirty) writeJsonFile(ctx.db);
  return value;
}

/** Run one complete operation against an isolated, fresh state snapshot. */
export async function withState<T>(
  normalize: (raw: unknown) => NormalizeResult,
  work: () => T
): Promise<T> {
  if (usesPostgres()) return withPostgres(normalize, work);

  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "DATABASE_URL est obligatoire en production : le système de fichiers des serveurs sans état n'est pas persistent."
    );
  }

  return withJsonFile(normalize, work);
}
