import { NextRequest, NextResponse } from "next/server";
import { dataStore } from "@/lib/data-store";
import {
  canManageMoney,
  canManageOrganization,
  errorResponse,
  getClientIp,
  requireAuth,
} from "@/lib/auth";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function csvCell(value: unknown): string {
  const text = value === undefined || value === null ? "" : String(value);
  return `"${text.replace(/"/g, '""')}"`;
}

function toCsv(headers: string[], rows: unknown[][]): string {
  const lines = [headers.map(csvCell).join(";"), ...rows.map((row) => row.map(csvCell).join(";"))];
  return `\uFEFF${lines.join("\r\n")}\r\n`;
}

function attachment(body: string, filename: string, contentType: string) {
  return new NextResponse(body, {
    status: 200,
    headers: {
      "Content-Type": contentType,
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}

export async function GET(request: NextRequest) {
  try {
    const { user, organization } = await requireAuth();
    if (!canManageMoney(user.role)) {
      return NextResponse.json(
        { success: false, error: "Votre rôle ne permet pas d'exporter les données." },
        { status: 403 }
      );
    }

    const format = request.nextUrl.searchParams.get("format") || "json";
    const today = new Date().toISOString().split("T")[0];

    await dataStore.audit({
      organizationId: organization.id,
      userId: user.id,
      userEmail: user.email,
      action: "DATA_EXPORTED",
      entity: "Organization",
      entityId: organization.id,
      metadata: { format },
      ip: getClientIp(request),
    });

    if (format === "receipts") {
      const rows = (await dataStore.getReceipts(organization.id)).map((r) => [
        r.receiptNumber, r.issuedAt, r.tenantName, r.tenantPhone,
        `${r.unitNumber} (${r.buildingName})`, r.periodLabel, r.amountPaid,
        r.rentAmount, r.chargesAmount, r.remainingDue, r.paymentMethod,
        r.provider || "", r.transactionRef || "", r.verificationHash,
      ]);
      return attachment(
        toCsv(
          ["Numéro", "Émise le", "Locataire", "Téléphone", "Lot", "Période", "Montant réglé", "Loyer", "Charges", "Reste dû", "Mode", "Opérateur", "Référence", "Hash de vérification"],
          rows
        ),
        `quittances-${today}.csv`,
        "text/csv; charset=utf-8"
      );
    }

    if (format === "installments") {
      const rows = (await dataStore.getInstallments(organization.id)).map((i) => [
        i.tenantName, i.unitNumber, i.buildingName, i.periodLabel, i.dueDate,
        i.totalDue, i.amountPaid, i.remainingDue, i.status,
      ]);
      return attachment(
        toCsv(
          ["Locataire", "Lot", "Immeuble", "Période", "Échéance", "Total dû", "Payé", "Reste dû", "Statut"],
          rows
        ),
        `echeances-${today}.csv`,
        "text/csv; charset=utf-8"
      );
    }

    if (!canManageOrganization(user.role)) {
      return NextResponse.json(
        { success: false, error: "La sauvegarde complète est réservée aux administrateurs." },
        { status: 403 }
      );
    }

    // Full backup of THIS organisation only, and never any credential.
    // Explicit field list: credentials can never leak into a backup file.
    const users = (await dataStore.getUsers(organization.id)).map((u) => ({
      id: u.id,
      organizationId: u.organizationId,
      name: u.name,
      phone: u.phone,
      email: u.email,
      role: u.role,
      avatarUrl: u.avatarUrl,
      createdAt: u.createdAt,
    }));

    const backup = {
      exportedAt: new Date().toISOString(),
      organization,
      users,
      buildings: await dataStore.getBuildings(organization.id),
      units: await dataStore.getUnits(organization.id),
      tenants: await dataStore.getTenants(organization.id),
      leases: await dataStore.getLeases(organization.id),
      installments: await dataStore.getInstallments(organization.id),
      payments: await dataStore.getPayments(organization.id),
      receipts: await dataStore.getReceipts(organization.id),
      reminders: await dataStore.getReminders(organization.id),
      tickets: await dataStore.getTickets(organization.id),
      auditLogs: await dataStore.getAuditLogs(organization.id),
    };
    return attachment(
      JSON.stringify(backup, null, 2),
      `loutigui-sauvegarde-${today}.json`,
      "application/json; charset=utf-8"
    );
  } catch (error) {
    return errorResponse(error);
  }
}
