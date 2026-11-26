import { AsyncLocalStorage } from "node:async_hooks";
import fs from "fs";
import path from "path";
import type { Client } from "@libsql/client";
import type { DatabaseSchema } from "@/lib/db-types";

/**
 * Transactional state backend.
 *
 * Production uses Turso (libSQL): every operation reads the state document,
 * runs the existing synchronous business logic on a private copy, then writes
 * it back with a compare-and-swap on a version column. If another serverless
 * instance committed in between, the operation is retried on a fresh snapshot.
 * This gives durability and safe concurrent writes without a writable
 * filesystem or an interactive transaction (works over Turso's HTTP API).
 *
 * When no Turso URL is configured (local development only), the same operation
 * is applied to data/db.json with an atomic temp-file + rename write.
 */

const STATE_ID = "main";
const MAX_CAS_ATTEMPTS = 8;
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

/** Turso URL, with a backwards-compatible alias for libSQL URLs. */
function databaseUrl(): string | undefined {
  const primary = process.env.TURSO_DATABASE_URL?.trim();
  if (primary) return primary;

  const legacy = process.env.DATABASE_URL?.trim();
  if (!legacy) return undefined;
  if (/^postgres(ql)?:\/\//i.test(legacy)) {
    throw new Error(
      "DATABASE_URL pointe vers PostgreSQL. Utilisez TURSO_DATABASE_URL avec une URL libSQL (libsql://…)."
    );
  }
  return legacy;
}

export function usesTurso(): boolean {
  return Boolean(databaseUrl());
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

let clientPromise: Promise<Client> | null = null;

async function getClient(): Promise<Client> {
  if (clientPromise) return clientPromise;

  clientPromise = (async () => {
    const url = databaseUrl();
    if (!url) throw new Error("TURSO_DATABASE_URL n'est pas configuré.");

    const { createClient } = await import("@libsql/client");
    const client = createClient({
      url,
      authToken: process.env.TURSO_AUTH_TOKEN?.trim() || undefined,
    });

    await client.execute(`
      CREATE TABLE IF NOT EXISTS loutigui_state (
        id TEXT PRIMARY KEY,
        data TEXT NOT NULL,
        version INTEGER NOT NULL DEFAULT 0
      )
    `);
    await client.execute({
      sql: `INSERT OR IGNORE INTO loutigui_state (id, data, version) VALUES (?, ?, 0)`,
      args: [STATE_ID, JSON.stringify(emptyDatabase())],
    });

    return client;
  })().catch((error) => {
    clientPromise = null;
    throw error;
  });

  return clientPromise;
}

async function withTurso<T>(
  normalize: (raw: unknown) => NormalizeResult,
  work: () => T
): Promise<T> {
  const client = await getClient();

  for (let attempt = 1; attempt <= MAX_CAS_ATTEMPTS; attempt++) {
    const result = await client.execute({
      sql: "SELECT data, version FROM loutigui_state WHERE id = ?",
      args: [STATE_ID],
    });

    const row = result.rows[0];
    const raw = row ? JSON.parse(String(row.data)) : null;
    const version = row ? Number(row.version) : 0;

    const normalized = normalize(raw);
    const ctx: StateContext = { db: normalized.db, dirty: normalized.changed };
    const value = stateContext.run(ctx, work);

    if (!ctx.dirty) return value;

    const update = await client.execute({
      sql: `UPDATE loutigui_state
            SET data = ?, version = version + 1
            WHERE id = ? AND version = ?`,
      args: [JSON.stringify(ctx.db), STATE_ID, version],
    });

    if (update.rowsAffected === 1) return value;

    // Another instance committed first: recompute from the newest snapshot.
    if (attempt === MAX_CAS_ATTEMPTS) {
      throw new Error(
        "Concurrence trop élevée sur la base Turso. Réessayez dans un instant."
      );
    }
  }

  throw new Error("Opération de stockage impossible.");
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
  if (usesTurso()) return withTurso(normalize, work);

  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "TURSO_DATABASE_URL est obligatoire en production : le système de fichiers des serveurs sans état n'est pas persistent."
    );
  }

  return withJsonFile(normalize, work);
}
