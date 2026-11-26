import fs from "node:fs";
import path from "node:path";
import pg from "pg";

/**
 * Import a local data/db.json into the transactional PostgreSQL state row.
 * Usage: DATABASE_URL="postgresql://…" npm run db:import
 */
const connectionString = process.env.DATABASE_URL?.trim();
if (!connectionString) {
  console.error("DATABASE_URL est requis pour importer la base locale.");
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

const url = new URL(connectionString);
const sslMode = url.searchParams.get("sslmode");
const ssl =
  sslMode && sslMode !== "disable"
    ? { rejectUnauthorized: process.env.PGSSL_REJECT_UNAUTHORIZED !== "false" }
    : undefined;

const client = new pg.Client({ connectionString, ssl });

try {
  await client.connect();
  await client.query(`
    CREATE TABLE IF NOT EXISTS loutigui_state (
      id text PRIMARY KEY,
      data jsonb NOT NULL,
      updated_at timestamptz NOT NULL DEFAULT now()
    )
  `);
  await client.query(
    `INSERT INTO loutigui_state (id, data, updated_at)
     VALUES ($1, $2::jsonb, now())
     ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data, updated_at = now()`,
    ["main", JSON.stringify(payload)]
  );
  console.log("Base locale importée dans PostgreSQL.");
} catch (error) {
  console.error("Import impossible :", error);
  process.exitCode = 1;
} finally {
  await client.end();
}
