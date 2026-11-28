import type { Client } from "@libsql/client";

/**
 * Shared libSQL connection for the small auxiliary tables (rate limits,
 * idempotency, checkout sessions, locks). All of them work over Turso's HTTP
 * API and therefore avoid interactive transactions.
 */
export function databaseUrl(): string | undefined {
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

let clientPromise: Promise<Client> | null = null;

export async function getLibsqlClient(): Promise<Client> {
  if (clientPromise) return clientPromise;

  clientPromise = (async () => {
    const url = databaseUrl();
    if (!url) throw new Error("TURSO_DATABASE_URL n'est pas configuré.");
    const { createClient } = await import("@libsql/client");
    return createClient({
      url,
      authToken: process.env.TURSO_AUTH_TOKEN?.trim() || undefined,
    });
  })().catch((error) => {
    clientPromise = null;
    throw error;
  });

  return clientPromise;
}
