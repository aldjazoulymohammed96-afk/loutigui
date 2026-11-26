"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  Installment,
  Lease,
  MaintenanceTicket,
  Organization,
  Receipt,
  ReminderLog,
  Tenant,
  Unit,
} from "@/types";
import { useApp } from "@/context/AppContext";
import { formatCurrency } from "@/lib/utils";
import { useApiQuery } from "@/lib/api-client";
import { ArrowRight, CheckCircle2, CreditCard, Smartphone } from "lucide-react";
import {
  LazyContratBailModal,
  LazyMaintenanceRequestModal,
  LazyQuittanceModal,
  LazyTenantPaymentModal,
} from "@/components/LazyModals";
import {
  InstallmentHistoryCard,
  LeaseOverviewCard,
  MaintenanceCard,
  ReceiptsCard,
  ReminderHistoryCard,
  SupportCard,
  TenantProfileCard,
  TenantSectionNav,
  TenantStatsRow,
} from "@/components/tenant/TenantPortalComponents";

export default function EspaceLocatairePage() {
  const { currency, refreshTrigger } = useApp();
  const [selectedTenantId, setSelectedTenantId] = useState<string>("");
  const [activeReceipt, setActiveReceipt] = useState<Receipt | null>(null);
  const [targetInstallment, setTargetInstallment] = useState<Installment | null>(null);
  const [isContractOpen, setIsContractOpen] = useState(false);
  const [isMaintenanceOpen, setIsMaintenanceOpen] = useState(false);

  const { data: tenants = [], isLoading: isLoadingTenants } = useApiQuery<Tenant[]>(
    "tenants",
    "/api/tenants",
    { refreshKey: refreshTrigger }
  );
  const { data: allInstallments = [] } = useApiQuery<Installment[]>(
    "installments?status=ALL",
    "/api/installments?status=ALL",
    { refreshKey: refreshTrigger }
  );
  const { data: allReceipts = [] } = useApiQuery<Receipt[]>(
    "receipts",
    "/api/receipts",
    { refreshKey: refreshTrigger }
  );
  const { data: properties } = useApiQuery<{ buildings: unknown[]; units: Unit[] }>(
    "properties",
    "/api/properties",
    { refreshKey: refreshTrigger }
  );
  const { data: allLeases = [] } = useApiQuery<Lease[]>("leases", "/api/leases", {
    refreshKey: refreshTrigger,
  });
  const { data: organization } = useApiQuery<Organization | null>(
    "organization",
    "/api/organization",
    { refreshKey: refreshTrigger }
  );
  const { data: allTickets = [] } = useApiQuery<MaintenanceTicket[]>(
    "maintenance",
    "/api/maintenance",
    { refreshKey: refreshTrigger }
  );
  const { data: allReminders = [] } = useApiQuery<ReminderLog[]>(
    "reminders",
    "/api/reminders",
    { refreshKey: refreshTrigger }
  );

  // Select the first tenant with an active lease instead of a hard-coded index.
  useEffect(() => {
    if (selectedTenantId || tenants.length === 0) return;
    const active = allLeases.find((l) => l.status === "ACTIVE");
    setSelectedTenantId(
      (active && tenants.find((t) => t.id === active.tenantId)?.id) || tenants[0].id
    );
  }, [tenants, allLeases, selectedTenantId]);

  const units = useMemo(() => properties?.units ?? [], [properties]);

  const currentTenant = useMemo(
    () => tenants.find((t) => t.id === selectedTenantId),
    [tenants, selectedTenantId]
  );

  const installments = useMemo(
    () => allInstallments.filter((i) => i.tenantId === selectedTenantId),
    [allInstallments, selectedTenantId]
  );

  const receipts = useMemo(() => {
    if (!currentTenant) return [];
    const name = `${currentTenant.firstName} ${currentTenant.lastName}`;
    // Rely on the installment link first: two tenants can share a phone number.
    const installmentIds = new Set(
      allInstallments.filter((i) => i.tenantId === selectedTenantId).map((i) => i.id)
    );
    return allReceipts.filter(
      (r) => installmentIds.has(r.installmentId) || r.tenantName === name
    );
  }, [allReceipts, allInstallments, currentTenant, selectedTenantId]);

  const lease = useMemo(() => {
    const mine = allLeases.filter((l) => l.tenantId === selectedTenantId);
    return mine.find((l) => l.status === "ACTIVE") ?? mine[0];
  }, [allLeases, selectedTenantId]);

  const unit = useMemo(
    () =>
      units.find((u) => u.id === lease?.unitId) ??
      units.find((u) => u.currentTenantId === selectedTenantId),
    [units, lease, selectedTenantId]
  );

  const tickets = useMemo(
    () => allTickets.filter((t) => t.tenantId === selectedTenantId),
    [allTickets, selectedTenantId]
  );

  const reminders = useMemo(
    () => allReminders.filter((r) => r.tenantId === selectedTenantId),
    [allReminders, selectedTenantId]
  );

  const stats = useMemo(() => {
    const activeInstallments = installments.filter((i) => i.status !== "CANCELLED");
    return {
      totalPaid: receipts.reduce((sum, r) => sum + r.amountPaid, 0),
      remainingDue: activeInstallments.reduce((sum, i) => sum + i.remainingDue, 0),
      openTickets: tickets.filter((t) => t.status !== "RESOLVED").length,
    };
  }, [installments, receipts, tickets]);

  const pendingInstallment = useMemo(
    () =>
      installments
        .filter((i) => i.remainingDue > 0 && i.status !== "CANCELLED")
        .sort((a, b) => a.dueDate.localeCompare(b.dueDate))[0],
    [installments]
  );

  const canOpenContract = !!(currentTenant && lease && unit && organization);

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-28 lg:pb-6">
      {/* Header & tenant switcher */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-teal-800 to-emerald-900 text-white shadow-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Smartphone className="w-5 h-5 text-emerald-300" />
            <span className="text-[10px] font-extrabold uppercase tracking-wider bg-white/20 px-2 py-0.5 rounded-full">
              Portail PWA Locataire Libre-Service
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black">
            Bonjour, {currentTenant ? `${currentTenant.firstName} ${currentTenant.lastName}` : "Cher Locataire"}
          </h1>
          <p className="text-xs text-emerald-100">
            Consultez votre solde, payez par Mobile Money, gérez vos documents et vos interventions.
          </p>
        </div>

        <div className="bg-white/10 p-2 rounded-xl border border-white/20 text-xs">
          <label htmlFor="tenant-switcher" className="block text-[10px] font-bold uppercase text-emerald-200 mb-1">
            Locataire actif :
          </label>
          <select
            id="tenant-switcher"
            value={selectedTenantId}
            onChange={(e) => setSelectedTenantId(e.target.value)}
            className="bg-slate-900 text-white px-3 py-1.5 rounded-lg border border-white/20 text-xs font-semibold focus:outline-none"
          >
            {tenants.map((t) => (
              <option key={t.id} value={t.id}>
                {t.firstName} {t.lastName} ({t.phone})
              </option>
            ))}
          </select>
        </div>
      </div>

      {isLoadingTenants && tenants.length === 0 ? (
        <div className="p-8 text-center text-xs font-bold text-slate-500 dark:text-slate-400 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          Chargement de votre espace locataire...
        </div>
      ) : (
        <>
          <TenantSectionNav />

          <TenantStatsRow
            totalPaid={stats.totalPaid}
            remainingDue={stats.remainingDue}
            receiptsCount={receipts.length}
            openTickets={stats.openTickets}
            currency={currency}
          />

          {/* Prochaine échéance ou compte à jour */}
          {pendingInstallment ? (
            <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border-2 border-rose-500/50 shadow-lg space-y-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-rose-500 animate-ping" />
                  <h2 className="text-base font-extrabold text-slate-900 dark:text-white">
                    Loyer de {pendingInstallment.periodLabel} à Régler
                  </h2>
                </div>
                <span className="px-3 py-1 rounded-full text-xs font-extrabold uppercase bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300">
                  {pendingInstallment.status === "OVERDUE" ? "Retard constaté" : "Solde restant"}
                </span>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Lot : {pendingInstallment.unitNumber} ({pendingInstallment.buildingName})
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Date d&apos;exigibilité : {pendingInstallment.dueDate}
                  </p>
                </div>
                <div className="text-left sm:text-right">
                  <p className="text-xs text-slate-400 font-bold uppercase">Montant net dû</p>
                  <p className="text-2xl font-black text-rose-600 dark:text-rose-400">
                    {formatCurrency(pendingInstallment.remainingDue, currency)}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setTargetInstallment(pendingInstallment)}
                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white font-extrabold text-sm py-4 rounded-xl shadow-lg shadow-emerald-700/25 transition active:scale-[0.99]"
              >
                <CreditCard className="w-5 h-5" />
                <span>Payer en 1 clic par Mobile Money (Wave / Orange)</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-emerald-500/50 shadow-sm text-center py-8 space-y-2">
              <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <h2 className="text-lg font-black text-slate-900 dark:text-white">
                Votre compte locataire est parfaitement à jour !
              </h2>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Aucun loyer impayé. Merci pour votre ponctualité.
              </p>
            </div>
          )}

          {currentTenant && <TenantProfileCard tenant={currentTenant} />}

          <LeaseOverviewCard
            lease={lease}
            unit={unit}
            currency={currency}
            onOpenContract={() => setIsContractOpen(true)}
          />

          <InstallmentHistoryCard
            installments={installments}
            currency={currency}
            onPay={setTargetInstallment}
          />

          <ReceiptsCard
            receipts={receipts}
            currency={currency}
            onOpen={setActiveReceipt}
          />

          <MaintenanceCard
            tickets={tickets}
            onNewTicket={() => setIsMaintenanceOpen(true)}
          />

          <ReminderHistoryCard reminders={reminders} />

          <SupportCard organizationPhone={organization?.phone} />
        </>
      )}

      {/* Lazy-loaded modals: none of these enter the initial bundle. */}
      {targetInstallment && (
        <LazyTenantPaymentModal
          installment={targetInstallment}
          currency={currency}
          onClose={() => setTargetInstallment(null)}
          onSuccess={(receipt) => {
            if (receipt) setActiveReceipt(receipt);
          }}
        />
      )}

      {activeReceipt && (
        <LazyQuittanceModal
          receipt={activeReceipt}
          onClose={() => setActiveReceipt(null)}
        />
      )}

      {isContractOpen && canOpenContract && (
        <LazyContratBailModal
          lease={lease!}
          tenant={currentTenant!}
          unit={unit!}
          organization={organization!}
          onClose={() => setIsContractOpen(false)}
        />
      )}

      {isMaintenanceOpen && currentTenant && (
        <LazyMaintenanceRequestModal
          tenant={currentTenant}
          unit={unit}
          onClose={() => setIsMaintenanceOpen(false)}
        />
      )}
    </div>
  );
}
