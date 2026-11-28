import fs from "node:fs";
import path from "node:path";
import { createClient } from "@libsql/client";

/**
 * Export the Turso state document to a timestamped JSON file.
 * The file contains password hashes: keep it outside the repository and store
 * it in a private location (the scheduled GitHub Action uploads it as an
 * artifact instead of committing it).
 */
const url = process.env.TURSO_DATABASE_URL?.trim() || process.env.DATABASE_URL?.trim();
if (!url) {
  console.error("TURSO_DATABASE_URL est requis pour la sauvegarde.");
  process.exit(1);
}
if (/^postgres(ql)?:\/\//i.test(url)) {
  console.error("PostgreSQL n'est plus pris en charge. Fournissez une URL libSQL (libsql://…).");
  process.exit(1);
}

const client = createClient({
  url,
  authToken: process.env.TURSO_AUTH_TOKEN?.trim() || undefined,
});

try {
  const result = await client.execute(
    `SELECT data, version FROM loutigui_state WHERE id = 'main'`
  );
  const row = result.rows[0];
  if (!row) throw new Error("Aucun état trouvé dans la base Turso.");

  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const dir = path.join(process.cwd(), "backups");
  fs.mkdirSync(dir, { recursive: true });

  const file = path.join(dir, `loutigui-${stamp}.json`);
  fs.writeFileSync(
    file,
    JSON.stringify(
      {
        exportedAt: new Date().toISOString(),
        version: Number(row.version),
        data: JSON.parse(String(row.data)),
      },
      null,
      2
    ),
    { encoding: "utf-8", mode: 0o600 }
  );

  console.log(`Sauvegarde créée : ${path.relative(process.cwd(), file)} (version ${row.version}).`);
} catch (error) {
  console.error("Sauvegarde impossible :", error instanceof Error ? error.message : error);
  process.exitCode = 1;
} finally {
  client.close();
}
