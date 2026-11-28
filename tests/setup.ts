import os from "node:os";
import path from "node:path";
import { randomUUID } from "node:crypto";

(process.env as Record<string, string | undefined>).NODE_ENV = "test";
process.env.SESSION_SECRET = `test-${randomUUID()}-${randomUUID()}`;
process.env.TURSO_DATABASE_URL = `file:${path.join(os.tmpdir(), `loutigui-test-${randomUUID()}.db`)}`;
delete process.env.TURSO_AUTH_TOKEN;
delete process.env.DATABASE_URL;
