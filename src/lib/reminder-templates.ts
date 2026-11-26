import { Currency } from "@/types";
import { formatCurrency } from "@/lib/utils";

export type ReminderSequence =
  | "J_MINUS_3"
  | "DAY_J"
  | "J_PLUS_3"
  | "J_PLUS_7"
  | "NOTICE_OF_DEFAULT";

export const REMINDER_SEQUENCES: ReminderSequence[] = [
  "J_MINUS_3",
  "DAY_J",
  "J_PLUS_3",
  "J_PLUS_7",
  "NOTICE_OF_DEFAULT",
];

export const SEQUENCE_LABELS: Record<ReminderSequence, { fr: string; en: string }> = {
  J_MINUS_3: { fr: "Rappel avant échéance", en: "Pre-due reminder" },
  DAY_J: { fr: "Échéance du jour", en: "Due today" },
  J_PLUS_3: { fr: "Rappel J+3", en: "3-day follow-up" },
  J_PLUS_7: { fr: "Relance formelle J+7", en: "Formal follow-up" },
  NOTICE_OF_DEFAULT: { fr: "Mise en demeure", en: "Notice of default" },
};

export interface ReminderContentInput {
  sequence: ReminderSequence;
  tenantName: string;
  amount: number;
  currency: Currency;
  periodLabel: string;
  unitNumber: string;
  organizationName: string;
  organizationPhone?: string;
  reminderDaysBefore: number;
  language: "fr" | "en";
  appUrl: string;
}

export interface ReminderContent {
  sms: string;
  emailSubject: string;
  emailText: string;
  emailHtml: string;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * Pure template builder: safe to use both server-side (real send) and
 * client-side (message preview). No provider keys or secrets live here.
 */
export function buildReminderContent(input: ReminderContentInput): ReminderContent {
  const {
    sequence,
    tenantName,
    amount,
    currency,
    periodLabel,
    unitNumber,
    organizationName,
    organizationPhone,
    reminderDaysBefore,
    language,
    appUrl,
  } = input;

  const money = formatCurrency(amount, currency);
  const portal = `${appUrl.replace(/\/$/, "")}/locataire`;
  const en = language === "en";
  const greeting = en ? `Hello ${tenantName}` : `Bonjour ${tenantName}`;
  const rent = en ? `rent for ${periodLabel}` : `loyer de ${periodLabel}`;
  const unit = en ? `unit ${unitNumber}` : `lot ${unitNumber}`;
  const payHere = en
    ? `Sign in to your tenant space to pay: ${portal}`
    : `Réglez depuis votre espace locataire : ${portal}`;
  const contact = organizationPhone
    ? en
      ? `Need help? ${organizationPhone}`
      : `Une question ? ${organizationPhone}`
    : "";

  const bodies: Record<ReminderSequence, string> = {
    J_MINUS_3: en
      ? `${greeting}, friendly reminder: ${rent} (${money}) for ${unit} is due in ${reminderDaysBefore} day(s). ${payHere}`
      : `${greeting}, rappel amical : votre ${rent} (${money}) pour le ${unit} sera exigible dans ${reminderDaysBefore} jour(s). ${payHere}`,
    DAY_J: en
      ? `${greeting}, ${rent} (${money}) for ${unit} is due today. ${payHere}`
      : `${greeting}, votre ${rent} (${money}) pour le ${unit} est exigible aujourd'hui. ${payHere}`,
    J_PLUS_3: en
      ? `${greeting}, we have not recorded payment of ${rent} (${money}) for ${unit}. Please regularise promptly. ${payHere}`
      : `${greeting}, sauf erreur ou omission de notre part, votre ${rent} (${money}) pour le ${unit} n'a pas encore été enregistré. Merci de régulariser rapidement. ${payHere}`,
    J_PLUS_7: en
      ? `PAYMENT OVERDUE - ${greeting}, ${rent} (${money}) for ${unit} is more than 7 days late. ${payHere}`
      : `AVIS DE RETARD - ${greeting}, votre ${rent} (${money}) pour le ${unit} présente un retard de plus de 7 jours. ${payHere}`,
    NOTICE_OF_DEFAULT: en
      ? `NOTICE OF DEFAULT - ${greeting}, we record non-payment of ${rent} (${money}) for ${unit}. Payment is due within 48 hours, otherwise the file will be handed to our legal counsel.`
      : `MISE EN DEMEURE - ${greeting}, nous constatons le défaut de paiement de votre ${rent} (${money}) pour le ${unit}. À défaut de règlement sous 48h, votre dossier sera transmis à notre conseil juridique.`,
  };

  const sms = [bodies[sequence], contact].filter(Boolean).join(" ");
  const label = SEQUENCE_LABELS[sequence][language];
  const subject = en
    ? `${label} - ${periodLabel} - ${organizationName}`
    : `${label} - ${periodLabel} - ${organizationName}`;

  const emailText = [
    greeting,
    "",
    bodies[sequence],
    "",
    en
      ? `Outstanding balance: ${money}`
      : `Solde restant dû : ${money}`,
    `Organisation : ${organizationName}`,
    contact,
    "",
    en ? "This message was generated automatically by LOUTIGUI." : "Ce message a été généré automatiquement par LOUTIGUI.",
  ].join("\n");

  const emailHtml = `<!doctype html>
<html lang="${language}">
  <body style="margin:0;padding:24px;background:#f1f5f9;font-family:Arial,sans-serif;color:#0f172a">
    <div style="max-width:600px;margin:auto;background:#fff;border:1px solid #e2e8f0;border-radius:16px;padding:24px">
      <p style="font-size:11px;font-weight:bold;color:#059669;letter-spacing:1px;text-transform:uppercase">${escapeHtml(organizationName)}</p>
      <h1 style="font-size:18px;margin:8px 0">${escapeHtml(label)}</h1>
      <p>${escapeHtml(greeting)},</p>
      <p style="line-height:1.6">${escapeHtml(bodies[sequence])}</p>
      <table style="width:100%;border-collapse:collapse;margin:16px 0">
        <tr><td style="padding:8px;border-bottom:1px solid #e2e8f0">${en ? "Period" : "Période"}</td><td style="padding:8px;border-bottom:1px solid #e2e8f0;text-align:right;font-weight:bold">${escapeHtml(periodLabel)}</td></tr>
        <tr><td style="padding:8px;border-bottom:1px solid #e2e8f0">${en ? "Property" : "Bien"}</td><td style="padding:8px;border-bottom:1px solid #e2e8f0;text-align:right;font-weight:bold">${escapeHtml(unitNumber)}</td></tr>
        <tr><td style="padding:8px">${en ? "Outstanding" : "Reste dû"}</td><td style="padding:8px;text-align:right;font-weight:bold;color:#e11d48">${escapeHtml(money)}</td></tr>
      </table>
      <p style="font-size:11px;color:#64748b">${escapeHtml(contact)}</p>
      <p style="font-size:10px;color:#94a3b8;margin-top:20px">${en ? "Automatically generated by LOUTIGUI." : "Message généré automatiquement par LOUTIGUI."}</p>
    </div>
  </body>
</html>`;

  return { sms, emailSubject: subject, emailText, emailHtml };
}
