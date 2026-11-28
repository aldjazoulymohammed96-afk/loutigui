import { ReminderLog } from "@/types";
import { dataStore } from "@/lib/data-store";
import { NotificationChannel, sendNotification } from "@/lib/notification-service";
import { normalizePlan, planLimit } from "@/lib/plans";
import {
  buildReminderContent,
  ReminderSequence,
  SEQUENCE_LABELS,
} from "@/lib/reminder-templates";

export interface SendReminderInput {
  organizationId: string;
  installmentId: string;
  channel: NotificationChannel;
  sequence: ReminderSequence;
  appUrl: string;
}

export interface SendReminderResult {
  success: boolean;
  status: number;
  message: string;
  provider?: string;
  log?: ReminderLog;
}

/** Shared by the manual "send reminder" action and the automatic cron job. */
export async function sendReminder(input: SendReminderInput): Promise<SendReminderResult> {
  const installment = await dataStore.getInstallment(input.organizationId, input.installmentId);
  if (!installment) {
    return { success: false, status: 404, message: "Échéance introuvable." };
  }

  const org = await dataStore.getOrganization(input.organizationId);
  const tenant = await dataStore.getTenant(input.organizationId, installment.tenantId);
  const settings = org.settings || {};

  if ((await dataStore.getSubscriptionInfo(input.organizationId)).isExpired) {
    return {
      success: false,
      status: 403,
      message: "Votre abonnement a expiré. Renouvelez-le pour envoyer des relances.",
    };
  }

  if (input.channel === "SMS") {
    const month = new Date().toISOString().slice(0, 7);
    const used = (await dataStore.getReminders(input.organizationId)).filter(
      (r) => r.channel === "SMS" && r.status !== "FAILED" && r.sentAt.slice(0, 7) === month
    ).length;
    const limit = planLimit(normalizePlan(org.subscriptionPlan)).smsPerMonth;
    if (used >= limit) {
      return {
        success: false,
        status: 403,
        message: `Quota SMS du forfait épuisé (${used}/${limit} ce mois-ci). Passez à un forfait supérieur.`,
      };
    }
  }
  const label = SEQUENCE_LABELS[input.sequence][settings.receiptLanguage === "en" ? "en" : "fr"];

  const enabled =
    input.channel === "SMS" ? settings.smsNotifications !== false : settings.emailNotifications !== false;
  if (!enabled) {
    return {
      success: false,
      status: 403,
      message: `Le canal ${input.channel === "SMS" ? "SMS" : "Email"} est désactivé dans les paramètres de l'organisation.`,
    };
  }

  const to = input.channel === "SMS" ? installment.tenantPhone || tenant?.phone || "" : tenant?.email || "";
  if (!to) {
    return {
      success: false,
      status: 422,
      message:
        input.channel === "SMS"
          ? "Aucun numéro de téléphone enregistré pour ce locataire."
          : "Aucune adresse email enregistrée pour ce locataire. Renseignez-la dans sa fiche.",
    };
  }

  const content = buildReminderContent({
    sequence: input.sequence,
    tenantName: installment.tenantName,
    amount: installment.remainingDue,
    currency: org.defaultCurrency || "XOF",
    periodLabel: installment.periodLabel,
    unitNumber: installment.unitNumber,
    organizationName: org.name,
    organizationPhone: org.phone,
    reminderDaysBefore: settings.reminderDaysBefore ?? 3,
    language: settings.receiptLanguage === "en" ? "en" : "fr",
    appUrl: input.appUrl,
  });

  const delivery = await sendNotification({
    channel: input.channel,
    to,
    toName: installment.tenantName,
    text: input.channel === "SMS" ? content.sms : content.emailText,
    subject: content.emailSubject,
    html: content.emailHtml,
  });

  const log = await dataStore.logReminder(input.organizationId, {
    installmentId: installment.id,
    tenantId: installment.tenantId,
    tenantName: installment.tenantName,
    tenantPhone: installment.tenantPhone,
    channel: input.channel,
    sequence: input.sequence,
    messageBody: input.channel === "SMS" ? content.sms : content.emailText,
    status: delivery.ok ? "SENT" : "FAILED",
  });

  return {
    success: delivery.ok,
    status: delivery.ok ? 200 : 503,
    message: delivery.ok
      ? `Relance « ${label} » envoyée par ${input.channel === "SMS" ? "SMS" : "email"} à ${to}.`
      : `Envoi ${input.channel === "SMS" ? "SMS" : "email"} impossible : ${delivery.error || "erreur fournisseur"}`,
    provider: delivery.provider,
    log,
  };
}

/** Avoid duplicate automatic sends for the same event/channel. */
export async function alreadyReminded(
  organizationId: string,
  installmentId: string,
  sequence: ReminderSequence,
  channel: NotificationChannel
): Promise<boolean> {
  return (await dataStore.getReminders(organizationId))
    .some(
      (r) =>
        r.installmentId === installmentId &&
        r.sequence === sequence &&
        r.channel === channel &&
        r.status !== "FAILED"
    );
}
