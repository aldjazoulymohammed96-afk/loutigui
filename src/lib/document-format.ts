import { Lease, MobileMoneyProvider, PaymentMethod } from "@/types";

export type DocumentLanguage = "fr" | "en";

/** Date-only values are formatted in UTC so the printed day never shifts. */
export function formatDocumentDate(
  value: string | Date | undefined | null,
  lang: DocumentLanguage = "fr"
): string {
  if (!value) return "—";
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat(lang === "en" ? "en-GB" : "fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

/** End date used on a lease when none was explicitly recorded. */
export function defaultLeaseEndDate(startDate: string): string {
  const start = new Date(startDate);
  if (Number.isNaN(start.getTime())) return "—";
  const end = new Date(start);
  end.setUTCFullYear(end.getUTCFullYear() + 1);
  return end.toISOString().slice(0, 10);
}

export function leaseTypeLabel(type: Lease["leaseType"], lang: DocumentLanguage = "fr"): string {
  const labels: Record<Lease["leaseType"], { fr: string; en: string }> = {
    RESIDENTIAL: { fr: "à usage d'habitation", en: "for residential use" },
    COMMERCIAL: { fr: "à usage commercial", en: "for commercial use" },
    FURNISHED: { fr: "meublé à usage d'habitation", en: "furnished residential" },
    VERBAL_RECORDED: { fr: "verbal constaté par écrit", en: "verbal agreement recorded in writing" },
  };
  return labels[type][lang];
}

export function destinationLabel(type: Lease["leaseType"], lang: DocumentLanguage = "fr"): string {
  const labels: Record<Lease["leaseType"], { fr: string; en: string }> = {
    RESIDENTIAL: { fr: "un usage d'habitation", en: "residential use" },
    COMMERCIAL: { fr: "un usage commercial", en: "commercial use" },
    FURNISHED: {
      fr: "un usage d'habitation dans un logement meublé",
      en: "furnished residential use",
    },
    VERBAL_RECORDED: { fr: "un usage d'habitation", en: "residential use" },
  };
  return labels[type][lang];
}

export function frequencyLabel(
  frequency: Lease["billingFrequency"],
  lang: DocumentLanguage = "fr"
): string {
  const labels: Record<Lease["billingFrequency"], { fr: string; en: string }> = {
    MONTHLY: { fr: "Mensuelle", en: "Monthly" },
    QUARTERLY: { fr: "Trimestrielle", en: "Quarterly" },
    ANNUAL: { fr: "Annuelle", en: "Annual" },
  };
  return labels[frequency][lang];
}

const PAYMENT_METHODS: Record<PaymentMethod, { fr: string; en: string }> = {
  MOBILE_MONEY: { fr: "Mobile Money", en: "Mobile Money" },
  CASH: { fr: "Espèces", en: "Cash" },
  BANK_TRANSFER: { fr: "Virement bancaire", en: "Bank transfer" },
  CHECK: { fr: "Chèque", en: "Cheque" },
};

const PROVIDERS: Record<MobileMoneyProvider, string> = {
  WAVE: "Wave",
  ORANGE_MONEY: "Orange Money",
  MTN_MOMO: "MTN MoMo",
  MOOV: "Moov Money",
  CINETPAY: "CinetPay",
};

export function paymentMethodLabel(
  method: PaymentMethod,
  provider: MobileMoneyProvider | undefined,
  lang: DocumentLanguage = "fr"
): string {
  const base = PAYMENT_METHODS[method][lang];
  return provider ? `${base} · ${PROVIDERS[provider]}` : base;
}

export function documentReference(id: string, prefix: string): string {
  const suffix = id.replace(/[^a-zA-Z0-9]/g, "").slice(-10).toUpperCase();
  return `${prefix}-${suffix || "0000"}`;
}
