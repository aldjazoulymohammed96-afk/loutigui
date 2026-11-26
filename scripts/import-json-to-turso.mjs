import fs from "node:fs";
import path from "node:path";
import { createClient } from "@libsql/client";

/**
 * Import a local data/db.json into the Turso state row.
 * Usage: TURSO_DATABASE_URL="libsql://…" TURSO_AUTH_TOKEN="…" npm run db:import
 */
const url =
  process.env.TURSO_DATABASE_URL?.trim() || process.env.DATABASE_URL?.trim();
if (!url) {
  console.error("TURSO_DATABASE_URL est requis pour importer la base locale.");
  process.exit(1);
}
if (/^postgres(ql)?:\/\//i.test(url)) {
  console.error("PostgreSQL n'est plus pris en charge. Fournissez une URL libSQL (libsql://…).");
  process.exit(1);
}

const file = path.join(process.cwd(), "data", "db.json");
if (!fs.existsSync(file)) {
  console.error(`Fichier introuvable : ${file}`);
  process.exit(1);
}

let payload;
try {
  payload = JSON.parse(fs.readFileSync(file, "utf-8"));
} catch (error) {
  console.error("Impossible de lire data/db.json :", error);
  process.exit(1);
}

const client = createClient({
  url,
  authToken: process.env.TURSO_AUTH_TOKEN?.trim() || undefined,
});

try {
  await client.execute(`
    CREATE TABLE IF NOT EXISTS loutigui_state (
      id TEXT PRIMARY KEY,
      data TEXT NOT NULL,
      version INTEGER NOT NULL DEFAULT 0
    )
  `);
  await client.execute({
    sql: `INSERT INTO loutigui_state (id, data, version) VALUES (?, ?, 0)
          ON CONFLICT(id) DO UPDATE SET data = excluded.data,
                                        version = loutigui_state.version + 1`,
    args: ["main", JSON.stringify(payload)],
  });
  console.log("Base locale importée dans Turso.");
} catch (error) {
  console.error("Import impossible :", error);
  process.exitCode = 1;
} finally {
  client.close();
}
