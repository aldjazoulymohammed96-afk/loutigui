import { NextRequest, NextResponse } from "next/server";
import { dataStore } from "@/lib/data-store";
import { alreadyReminded, sendReminder } from "@/lib/reminder-engine";
import {
  getNotificationStatus,
  NotificationChannel,
  sendNotification,
} from "@/lib/notification-service";
import { ReminderSequence } from "@/lib/reminder-templates";
import { formatCurrency } from "@/lib/utils";
import { Organization } from "@/types";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function sequenceForDueDate(dueDate: string, leadDays: number): ReminderSequence | null {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(`${dueDate}T00:00:00`);
  if (Number.isNaN(due.getTime())) return null;
  const days = Math.round((due.getTime() - today.getTime()) / 86_400_000);

  if (days === 0) return "DAY_J";
  if (days === leadDays && leadDays > 0) return "J_MINUS_3";
  if (days === -3) return "J_PLUS_3";
  if (days === -7) return "J_PLUS_7";
  if (days === -15) return "NOTICE_OF_DEFAULT";
  return null;
}

/** Real daily summary sent to the organisation's own mailbox. */
async function sendDailyDigest(org: Organization, appUrl: string): Promise<string> {
  const installments = dataStore.getInstallments(org.id, "ALL");
  const overdue = installments.filter(
    (i) => i.remainingDue > 0 && new Date(`${i.dueDate}T00:00:00`) < new Date()
  );
  const today = new Date().toISOString().slice(0, 10);
  const collectedToday = dataStore
    .getPayments(org.id)
    .filter((p) => new Date(p.paidAt).toISOString().slice(0, 10) === today)
    .reduce((sum, p) => sum + p.amount, 0);
  const outstanding = overdue.reduce((sum, i) => sum + i.remainingDue, 0);
  const currency = org.defaultCurrency || "XOF";
  const lines = [
    `Impayés : ${overdue.length} échéance(s)`,
    `Montant restant dû : ${formatCurrency(outstanding, currency)}`,
    `Encaissé aujourd'hui : ${formatCurrency(collectedToday, currency)}`,
    `Espace gestionnaire : ${appUrl.replace(/\/$/, "")}/`,
  ];

  const result = await sendNotification({
    channel: "EMAIL",
    to: org.email,
    subject: `LOUTIGUI · Rapport quotidien du ${today}`,
    text: `Bonjour,\n\n${lines.join("\n")}\n\nMessage généré automatiquement par LOUTIGUI.`,
    html: `<h2>Rapport quotidien LOUTIGUI · ${today}</h2><ul>${lines
      .map((l) => `<li>${l}</li>`)
      .join("")}</ul>`,
  });

  return result.ok ? "rapport envoyé" : `rapport échoué : ${result.error}`;
}

async function processOrganization(orgId: string, appUrl: string) {
  const now = new Date();
  // 1. Billing: make sure this month's échéances exist.
  const generated = dataStore.generateMonthlyInstallments(orgId, now.getFullYear(), now.getMonth() + 1);
  // 2. Statuses + late fees.
  dataStore.refreshInstallmentStatuses(orgId);

  const org = dataStore.getOrganization(orgId);
  const settings = org.settings || {};

  let digest = "désactivé";
  if (settings.dailyDigest && getNotificationStatus().email.configured && org.email) {
    const today = now.toISOString().slice(0, 10);
    if (org.lastDigestSentOn === today) {
      digest = "déjà envoyé aujourd'hui";
    } else {
      digest = await sendDailyDigest(org, appUrl);
      if (digest === "rapport envoyé") {
        dataStore.updateOrganization(orgId, { lastDigestSentOn: today });
      }
    }
  }

  if (settings.autoReminders === false) {
    return { organizationId: orgId, generated: generated.length, processed: 0, sent: 0, failed: 0, digest };
  }

  const leadDays = settings.reminderDaysBefore ?? 3;
  const channels: NotificationChannel[] = [];
  if (settings.smsNotifications !== false) channels.push("SMS");
  if (settings.emailNotifications !== false) channels.push("EMAIL");

  if (channels.length === 0) {
    return { organizationId: orgId, generated: generated.length, processed: 0, sent: 0, failed: 0, digest };
  }

  const installments = dataStore
    .getInstallments(orgId, "ALL")
    .filter((i) => i.remainingDue > 0 && i.status !== "PAID" && i.status !== "CANCELLED");

  let processed = 0;
  let sent = 0;
  let failed = 0;

  for (const installment of installments) {
    const sequence = sequenceForDueDate(installment.dueDate, leadDays);
    if (!sequence) continue;

    for (const channel of channels) {
      if (alreadyReminded(orgId, installment.id, sequence, channel)) continue;
      processed += 1;
      const result = await sendReminder({
        organizationId: orgId,
        installmentId: installment.id,
        channel,
        sequence,
        appUrl,
      });
      if (result.success) sent += 1;
      else failed += 1;
    }
  }

  return { organizationId: orgId, generated: generated.length, processed, sent, failed, digest };
}

export async function GET(request: NextRequest) {
  return handle(request);
}

export async function POST(request: NextRequest) {
  return handle(request);
}

async function handle(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const authorization = request.headers.get("authorization");
  if (secret && authorization !== `Bearer ${secret}`) {
    return NextResponse.json({ success: false, error: "Non autorisé." }, { status: 401 });
  }
  if (!secret && process.env.NODE_ENV === "production") {
    return NextResponse.json(
      { success: false, error: "CRON_SECRET doit être configuré en production." },
      { status: 503 }
    );
  }

  const appUrl = process.env.APP_URL || new URL(request.url).origin;
  const organizations = dataStore.getOrganizations();
  const results = [];

  for (const org of organizations) {
    try {
      results.push(await processOrganization(org.id, appUrl));
    } catch (error) {
      results.push({
        organizationId: org.id,
        error: error instanceof Error ? error.message : "Erreur inconnue",
      });
    }
  }

  const totals = results.reduce(
    (acc, r) => ({
      generated: acc.generated + ("generated" in r ? Number(r.generated) || 0 : 0),
      sent: acc.sent + ("sent" in r ? Number(r.sent) || 0 : 0),
      failed: acc.failed + ("failed" in r ? Number(r.failed) || 0 : 0),
    }),
    { generated: 0, sent: 0, failed: 0 }
  );

  return NextResponse.json({
    success: true,
    message: `${organizations.length} organisation(s) traitée(s) : ${totals.generated} échéance(s) créée(s), ${totals.sent} relance(s) envoyée(s), ${totals.failed} échec(s).`,
    data: { organizations: organizations.length, totals, results },
  });
}
