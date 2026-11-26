import crypto from "crypto";

const SASPAY_BASE_URL = "https://api.saspay.me/api/v1";

export interface PlanConfig {
  id: "STARTER" | "PRO" | "AGENCE";
  name: string;
  amount: string; // Decimal string as required by SasPay, e.g. "10000.00"
  priceFCFA: number;
  maxUnits: number | null;
  features: string[];
  recommended?: boolean;
}

export const SUBSCRIPTION_PLANS: Record<"STARTER" | "PRO" | "AGENCE", PlanConfig> = {
  STARTER: {
    id: "STARTER",
    name: "Starter",
    amount: "10000.00",
    priceFCFA: 10000,
    maxUnits: 10,
    features: [
      "Jusqu'à 10 lots gérés",
      "Encaissement Mobile Money (Wave, Orange, MTN, Moov)",
      "Quittances officielles certifiées avec QR Code",
      "Suivi des impayés & alertes d'échéances",
      "Support technique par WhatsApp",
    ],
  },
  PRO: {
    id: "PRO",
    name: "Pro",
    amount: "25000.00",
    priceFCFA: 25000,
    maxUnits: 35,
    recommended: true,
    features: [
      "Jusqu'à 35 lots gérés",
      "Tout le forfait Starter inclus",
      "Relances WhatsApp automatiques programmées",
      "Générateur de baux de location conformes",
      "Gestion des incidents & maintenance",
      "Assistance prioritaire 7j/7",
    ],
  },
  AGENCE: {
    id: "AGENCE",
    name: "Agence",
    amount: "50000.00",
    priceFCFA: 50000,
    maxUnits: null,
    features: [
      "Lots et immeubles illimités",
      "Accès multi-utilisateurs & collaborateurs",
      "Rapports financiers & exports comptables Excel",
      "Rapprochement multi-immeubles",
      "Gestionnaire de compte dédié",
    ],
  },
};

function getApiKey(): string | null {
  const key = process.env.SASPAY_API_KEY?.trim();
  return key || null;
}

/**
 * Create a SasPay hosted checkout session for subscription payment
 */
export async function createSaspayCheckoutSession(params: {
  planId: "STARTER" | "PRO" | "AGENCE";
  organizationId: string;
  customerEmail: string;
  customerName: string;
  customerPhone?: string;
  returnUrl: string;
}): Promise<{
  success: boolean;
  sessionId?: string;
  checkoutUrl?: string;
  error?: string;
}> {
  const plan = SUBSCRIPTION_PLANS[params.planId];
  if (!plan) {
    return { success: false, error: "Forfait d'abonnement invalide." };
  }

  const apiKey = getApiKey();
  if (!apiKey) {
    return { success: false, error: "Configuration SasPay manquante (SASPAY_API_KEY)." };
  }
  const idempotencyKey = crypto.randomUUID();

  const payload = {
    amount: plan.amount,
    currency: "XOF",
    description: `Abonnement LOUTIGUI ${plan.name} (1 mois)`,
    customer_email: params.customerEmail || "client@loutigui.ci",
    customer_name: params.customerName || "Gestionnaire LOUTIGUI",
    customer_phone: params.customerPhone || "",
    return_url: params.returnUrl,
    metadata: {
      organizationId: params.organizationId,
      plan: params.planId,
    },
  };

  try {
    const res = await fetch(`${SASPAY_BASE_URL}/checkout-sessions/`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "Idempotency-Key": idempotencyKey,
      },
      body: JSON.stringify(payload),
    });

    const data = (await res.json()) as SaspayResponse;

    if (res.ok && data.success && data.data?.checkout_url) {
      return {
        success: true,
        sessionId: data.data.id,
        checkoutUrl: data.data.checkout_url,
      };
    } else {
      const errMsg =
        data.error?.message ||
        (typeof data === "object" ? JSON.stringify(data) : "Erreur lors de la création de la session SasPay.");
      return { success: false, error: errMsg };
    }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Erreur de connexion avec SasPay.",
    };
  }
}

interface SaspayResponse {
  success?: boolean;
  data?: {
    id?: string;
    checkout_url?: string;
    status?: string;
    transaction_id?: string;
    metadata?: Record<string, string>;
    net_amount?: string;
    currency?: string;
  };
  error?: { message?: string };
}

/**
 * Check checkout session status on SasPay
 */
export async function getSaspayCheckoutStatus(sessionId: string): Promise<{
  success: boolean;
  status?: string; // PENDING, SUCCESS, FAILED, CANCELLED
  transactionId?: string;
  raw?: SaspayResponse["data"];
  error?: string;
}> {
  const apiKey = getApiKey();
  if (!apiKey) {
    return { success: false, error: "Configuration SasPay manquante (SASPAY_API_KEY)." };
  }

  try {
    const res = await fetch(`${SASPAY_BASE_URL}/checkout-sessions/${sessionId}/status/`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      cache: "no-store",
    });

    const data = (await res.json()) as SaspayResponse;

    if (res.ok && data.success && data.data) {
      return {
        success: true,
        status: data.data.status,
        transactionId: data.data.transaction_id || undefined,
        raw: data.data,
      };
    } else {
      return { success: false, error: data.error?.message || "Impossible de vérifier le statut SasPay." };
    }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Erreur de communication avec SasPay.",
    };
  }
}

/**
 * Verify a payment directly with SasPay
 */
export async function verifySaspayPayment(paymentId: string): Promise<{
  success: boolean;
  status?: string; // SUCCESS, PENDING, FAILED
  netAmount?: string;
  currency?: string;
  error?: string;
}> {
  const apiKey = getApiKey();
  if (!apiKey) {
    return { success: false, error: "Configuration SasPay manquante (SASPAY_API_KEY)." };
  }

  try {
    const res = await fetch(`${SASPAY_BASE_URL}/payments/${paymentId}/verify/`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      cache: "no-store",
    });

    const data = (await res.json()) as SaspayResponse;

    if (res.ok && data.success && data.data) {
      return {
        success: true,
        status: data.data.status,
        netAmount: data.data.net_amount,
        currency: data.data.currency,
      };
    } else {
      return { success: false, error: data.error?.message || "Échec de vérification du paiement." };
    }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Erreur de connexion à SasPay.",
    };
  }
}

/**
 * Validate webhook signature as described in SasPay documentation:
 * HMAC SHA-256 on f"{timestamp}.{rawBody}" with signing_secret
 */
export function isSaspayWebhookValid(
  rawBody: string,
  signature: string,
  timestamp: string,
  secret: string
): boolean {
  try {
    const ts = parseInt(timestamp, 10);
    const now = Math.floor(Date.now() / 1000);
    // Reject if timestamp drifts by more than 300 seconds
    if (Math.abs(now - ts) > 300) {
      return false;
    }

    const payload = `${timestamp}.${rawBody}`;
    const expected = crypto.createHmac("sha256", secret).update(payload).digest("hex");
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
  } catch {
    return false;
  }
}
