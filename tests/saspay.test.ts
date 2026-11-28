import crypto from "node:crypto";
import { describe, expect, it } from "vitest";
import { isSaspayWebhookValid, SUBSCRIPTION_PLANS } from "@/lib/saspay";

const SECRET = "webhook-signing-secret";

function sign(body: string, timestamp: string): string {
  return crypto.createHmac("sha256", SECRET).update(`${timestamp}.${body}`).digest("hex");
}

describe("SasPay webhook", () => {
  const body = JSON.stringify({ event: "transaction.success", data: { id: "pay-1" } });
  const now = String(Math.floor(Date.now() / 1000));

  it("accepts a signature computed on the raw body and a fresh timestamp", () => {
    expect(isSaspayWebhookValid(body, sign(body, now), now, SECRET)).toBe(true);
  });

  it("rejects a signature computed on a re-serialised body", () => {
    const replayed = JSON.stringify(JSON.parse(body), null, 2);
    expect(isSaspayWebhookValid(body, sign(replayed, now), now, SECRET)).toBe(false);
  });

  it("rejects an old timestamp", () => {
    const old = String(Number(now) - 301);
    expect(isSaspayWebhookValid(body, sign(body, old), old, SECRET)).toBe(false);
  });

  it("rejects a wrong secret or malformed signature", () => {
    expect(isSaspayWebhookValid(body, sign(body, now), now, "autre-secret")).toBe(false);
    expect(isSaspayWebhookValid(body, "abc", now, SECRET)).toBe(false);
    expect(isSaspayWebhookValid(body, "", now, SECRET)).toBe(false);
  });

  it("uses decimal strings for every plan amount", () => {
    for (const plan of Object.values(SUBSCRIPTION_PLANS)) {
      expect(plan.amount).toMatch(/^\d+\.\d{2}$/);
      expect(Number(plan.amount)).toBe(plan.priceFCFA);
    }
  });
});
