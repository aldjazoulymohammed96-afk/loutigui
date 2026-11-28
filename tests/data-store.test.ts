import { describe, expect, it } from "vitest";
import { dataStore } from "@/lib/data-store";
import { verifyPassword } from "@/lib/password";

describe("data store", () => {
  it("registers an organisation with a hashed password and a 7-day trial", async () => {
    const { user, organization } = await dataStore.register({
      name: "Propriétaire Test",
      phone: "+2250100000001",
      email: "proprietaire-test@example.ci",
      password: "Valide123",
    });

    expect(user.passwordHash).not.toContain("Valide123");
    expect(verifyPassword("Valide123", user.passwordHash)).toBe(true);
    expect(organization.subscriptionStatus).toBe("TRIAL");

    const subscription = await dataStore.getSubscriptionInfo(organization.id);
    expect(subscription.isTrial).toBe(true);
    expect(subscription.daysRemaining).toBeGreaterThan(0);
  });

  it("isolates users and tenants by organisation", async () => {
    const a = await dataStore.register({
      name: "Organisation A",
      phone: "+2250100000002",
      password: "Valide123",
    });
    const b = await dataStore.register({
      name: "Organisation B",
      phone: "+2250100000003",
      password: "Valide123",
    });

    const usersA = await dataStore.getUsers(a.organization.id);
    const usersB = await dataStore.getUsers(b.organization.id);

    expect(usersA).toHaveLength(1);
    expect(usersB).toHaveLength(1);
    expect(usersA[0].id).not.toBe(usersB[0].id);
    expect(await dataStore.getTenants(a.organization.id)).toEqual([]);
  });

  it("rejects a duplicate phone number", async () => {
    await dataStore.register({ name: "Doublon", phone: "+2250100000004", password: "Valide123" });

    await expect(
      dataStore.register({ name: "Doublon 2", phone: "+2250100000004", password: "Valide123" })
    ).rejects.toThrow(/existe déjà/);
  });
});
