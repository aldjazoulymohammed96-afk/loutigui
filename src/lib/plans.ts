import { SubscriptionPlanType } from "@/types";

export interface PlanLimits {
  units: number;
  users: number;
  smsPerMonth: number;
  label: string;
}

export const PLAN_LIMITS: Record<SubscriptionPlanType, PlanLimits> = {
  STARTER: { units: 10, users: 1, smsPerMonth: 50, label: "Starter" },
  PRO: { units: 35, users: 5, smsPerMonth: 300, label: "Pro" },
  AGENCE: { units: Number.POSITIVE_INFINITY, users: 20, smsPerMonth: 2000, label: "Agence" },
};

export function normalizePlan(plan: string | undefined | null): SubscriptionPlanType {
  const upper = String(plan || "STARTER").toUpperCase();
  if (upper === "PRO" || upper === "AGENCE" || upper === "STARTER") {
    return upper;
  }
  // Legacy aliases.
  if (upper === "DIASPORA" || upper === "AGENCY") return "AGENCE";
  if (upper === "ENTERPRISE") return "AGENCE";
  return "STARTER";
}

export function planLimit(plan: SubscriptionPlanType): PlanLimits {
  return PLAN_LIMITS[plan] ?? PLAN_LIMITS.STARTER;
}
