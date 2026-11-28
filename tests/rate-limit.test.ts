import { createClient, type Client } from "@libsql/client";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { rateLimit } from "@/lib/rate-limit";

describe("distributed rate limit", () => {
  let client: Client;

  beforeAll(async () => {
    client = createClient({ url: process.env.TURSO_DATABASE_URL as string });
    await rateLimit("warmup", 1, 1000);
  });

  beforeEach(async () => {
    await client.execute("DELETE FROM loutigui_rate_limits");
  });

  it("allows up to the limit then blocks the next request", async () => {
    const first = await rateLimit("login:test", 2, 60_000);
    const second = await rateLimit("login:test", 2, 60_000);
    const third = await rateLimit("login:test", 2, 60_000);

    expect([first.allowed, second.allowed, third.allowed]).toEqual([true, true, false]);
    expect(first.remaining).toBe(1);
    expect(second.remaining).toBe(0);
    expect(third.retryAfterSeconds).toBeGreaterThan(0);
  });

  it("keeps independent keys isolated", async () => {
    await rateLimit("scope:a", 1, 60_000);
    const other = await rateLimit("scope:b", 1, 60_000);

    expect(other.allowed).toBe(true);
  });

  it("lets requests through again after the window expires", async () => {
    // Use a generous window so CI latency cannot expire it mid-assertion.
    await rateLimit("short:window", 1, 500);
    expect((await rateLimit("short:window", 1, 500)).allowed).toBe(false);

    await new Promise((resolve) => setTimeout(resolve, 600));
    expect((await rateLimit("short:window", 1, 500)).allowed).toBe(true);
  });

  it("fails closed in production when libSQL is not configured", async () => {
    const url = process.env.TURSO_DATABASE_URL;

    try {
      vi.stubEnv("NODE_ENV", "production");
      delete process.env.TURSO_DATABASE_URL;
      await expect(rateLimit("prod:guard", 1, 1000)).rejects.toThrow(/TURSO_DATABASE_URL/);
    } finally {
      process.env.TURSO_DATABASE_URL = url;
      vi.unstubAllEnvs();
    }
  });
});
