import crypto from "crypto";
import { logError } from "@/lib/logger";

const SASPAY_BASE_URL = "https://api.saspay.me/api/v1";

/**
 * Provider identifiers are pasted into URL paths. Reject anything that is not
 * a plain opaque token so a `../` cannot normalise the request to another
 * endpoint carrying our API key. Callers must also encodeURIComponent().
 */
export function isValidProviderId(value: string): boolean {
  return /^[A-Za-z0-9_-]{1,128}$/.test(value);
}

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
  code?: string;
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

    if (res.ok && data.success && data.data?.checkout_url && data.data.id) {
      return {
        success: true,
        sessionId: data.data.id,
        checkoutUrl: data.data.checkout_url,
      };
    }

    // Keep provider details in the server logs; the browser only sees a
    // stable code and a generic message.
    logError("SasPay: création de session refusée", undefined, {
      status: res.status,
      providerMessage: data.error?.message,
    });
    return {
      success: false,
      code: "SASPAY_CHECKOUT_FAILED",
      error: "Le paiement n'a pas pu être initié. Veuillez réessayer.",
    };
  } catch (err) {
    logError("SasPay: erreur de connexion lors de la création de session", err);
    return {
      success: false,
      code: "SASPAY_UNAVAILABLE",
      error: "Le service de paiement est momentanément indisponible.",
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
  code?: string;
  error?: string;
}> {
  if (!isValidProviderId(sessionId)) {
    return { success: false, error: "Identifiant de session de paiement invalide." };
  }
  const apiKey = getApiKey();
  if (!apiKey) {
    return { success: false, error: "Configuration SasPay manquante (SASPAY_API_KEY)." };
  }

  try {
    const res = await fetch(`${SASPAY_BASE_URL}/checkout-sessions/${encodeURIComponent(sessionId)}/status/`, {
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
      logError("SasPay: vérification de session refusée", undefined, {
        status: res.status,
        providerMessage: data.error?.message,
      });
      return {
        success: false,
        code: "SASPAY_STATUS_CHECK_FAILED",
        error: "Impossible de vérifier le statut du paiement pour le moment.",
      };
    }
  } catch (err) {
    logError("SasPay: erreur de connexion lors de la vérification", err);
    return {
      success: false,
      code: "SASPAY_UNAVAILABLE",
      error: "Le service de paiement est momentanément indisponible.",
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
  code?: string;
  error?: string;
}> {
  if (!isValidProviderId(paymentId)) {
    return { success: false, error: "Identifiant de paiement invalide." };
  }
  const apiKey = getApiKey();
  if (!apiKey) {
    return { success: false, error: "Configuration SasPay manquante (SASPAY_API_KEY)." };
  }

  try {
    const res = await fetch(`${SASPAY_BASE_URL}/payments/${encodeURIComponent(paymentId)}/verify/`, {
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
      logError("SasPay: vérification de paiement refusée", undefined, {
        status: res.status,
        providerMessage: data.error?.message,
      });
      return {
        success: false,
        code: "SASPAY_VERIFY_FAILED",
        error: "La vérification du paiement a échoué. Veuillez réessayer.",
      };
    }
  } catch (err) {
    logError("SasPay: erreur de connexion lors de la vérification du paiement", err);
    return {
      success: false,
      code: "SASPAY_UNAVAILABLE",
      error: "Le service de paiement est momentanément indisponible.",
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
