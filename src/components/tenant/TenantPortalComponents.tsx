"use client";

import React, { useMemo, useState } from "react";
import type { LucideIcon } from "lucide-react";
import {
  AlertCircle,
  BellRing,
  CalendarDays,
  ChevronDown,
  CircleDot,
  ClipboardList,
  FileCheck2,
  FileText,
  Home,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  ReceiptText,
  ShieldCheck,
  UserRound,
  Wallet,
  Wrench,
  Contact,
  Building2,
} from "lucide-react";
import {
  Currency,
  Installment,
  Lease,
  MaintenanceTicket,
  Receipt,
  ReminderLog,
  Tenant,
  Unit,
} from "@/types";
import { cn, formatCurrency } from "@/lib/utils";

type Tone = "success" | "warning" | "danger" | "info" | "neutral";

const toneClasses: Record<Tone, string> = {
  success: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300",
  warning: "bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300",
  danger: "bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300",
  info: "bg-sky-50 text-sky-700 dark:bg-sky-950/60 dark:text-sky-300",
  neutral: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
};

export function Badge({
  children,
  tone = "neutral",
  className,
}: {
  children: React.ReactNode;
  tone?: Tone;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "shrink-0 px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide",
        toneClasses[tone],
        className
      )}
    >
      {children}
    </span>
  );
}

export function PortalCard({
  id,
  icon: Icon,
  title,
  description,
  action,
  children,
  className,
}: {
  id?: string;
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      id={id}
      className={cn(
        "p-5 sm:p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 scroll-mt-28",
        className
      )}
    >
      <div className="flex items-start justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
        <div className="flex items-start gap-2 min-w-0">
          <Icon className="w-5 h-5 text-emerald-600 mt-0.5 shrink-0" />
          <div className="min-w-0">
            <h2 className="font-extrabold text-sm text-slate-900 dark:text-white">{title}</h2>
            {description && (
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{description}</p>
            )}
          </div>
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

export function EmptyState({
  icon: Icon,
  title,
  message,
}: {
  icon: LucideIcon;
  title: string;
  message: string;
}) {
  return (
    <div className="flex flex-col items-center text-center py-8 px-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-dashed border-slate-200 dark:border-slate-700">
      <div className="w-10 h-10 rounded-full bg-white dark:bg-slate-800 shadow-sm flex items-center justify-center mb-2">
        <Icon className="w-5 h-5 text-slate-400" />
      </div>
      <p className="text-xs font-extrabold text-slate-700 dark:text-slate-200">{title}</p>
      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 max-w-xs">{message}</p>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Quick navigation & KPIs                                                    */
/* -------------------------------------------------------------------------- */

const SECTIONS = [
  { id: "portal-account", label: "Mon profil" },
  { id: "portal-lease", label: "Mon bail" },
  { id: "portal-payments", label: "Échéances" },
  { id: "portal-receipts", label: "Quittances" },
  { id: "portal-maintenance", label: "Maintenance" },
  { id: "portal-reminders", label: "Relances" },
];

export function TenantSectionNav() {
  return (
    <nav
      aria-label="Sections de l'espace locataire"
      className="flex gap-2 overflow-x-auto pb-1"
    >
      {SECTIONS.map((section) => (
        <button
          key={section.id}
          type="button"
          onClick={() =>
            document
              .getElementById(section.id)
              ?.scrollIntoView({ behavior: "smooth", block: "start" })
          }
          className="shrink-0 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-[11px] font-bold text-slate-600 dark:text-slate-300 hover:border-emerald-300 hover:text-emerald-700 dark:hover:text-emerald-300 transition"
        >
          {section.label}
        </button>
      ))}
    </nav>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  tone: "emerald" | "rose" | "sky" | "amber";
}) {
  const tones = {
    emerald: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300",
    rose: "bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300",
    sky: "bg-sky-50 text-sky-700 dark:bg-sky-950/60 dark:text-sky-300",
    amber: "bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300",
  };
  return (
    <div className="flex items-center gap-3 p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
      <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center shrink-0", tones[tone])}>
        <Icon className="w-4 h-4" />
      </div>
      <div className="min-w-0">
        <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400 truncate">
          {label}
        </p>
        <p className="text-sm font-black text-slate-900 dark:text-white truncate">{value}</p>
      </div>
    </div>
  );
}

export function TenantStatsRow({
  totalPaid,
  remainingDue,
  receiptsCount,
  openTickets,
  currency,
}: {
  totalPaid: number;
  remainingDue: number;
  receiptsCount: number;
  openTickets: number;
  currency: Currency;
}) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      <StatCard icon={Wallet} label="Total réglé" value={formatCurrency(totalPaid, currency)} tone="emerald" />
      <StatCard
        icon={AlertCircle}
        label="Reste à régler"
        value={formatCurrency(remainingDue, currency)}
        tone={remainingDue > 0 ? "rose" : "emerald"}
      />
      <StatCard icon={ReceiptText} label="Quittances" value={`${receiptsCount} document(s)`} tone="sky" />
      <StatCard
        icon={Wrench}
        label="Tickets ouverts"
        value={`${openTickets} en cours`}
        tone={openTickets > 0 ? "amber" : "emerald"}
      />
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Profile & lease                                                            */
/* -------------------------------------------------------------------------- */

function InfoLine({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2.5 py-2 border-b border-slate-100 dark:border-slate-800 last:border-0">
      <Icon className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0" />
      <div className="min-w-0">
        <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">{label}</p>
        <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 break-words">{value}</p>
      </div>
    </div>
  );
}

export function TenantProfileCard({ tenant }: { tenant: Tenant }) {
  const whatsappUrl = `https://wa.me/${tenant.phone.replace(/[^\d]/g, "")}`;
  return (
    <PortalCard
      id="portal-account"
      icon={UserRound}
      title="Mon Profil Locataire"
      description=" Informations enregistrées dans le dossier de location."
      action={<Badge tone="info">Vérifié</Badge>}
    >
      <div className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/40 dark:to-teal-950/30 border border-emerald-200 dark:border-emerald-800">
        <div className="w-11 h-11 rounded-full bg-emerald-700 text-white flex items-center justify-center font-black text-sm shrink-0">
          {tenant.firstName.slice(0, 1)}
          {tenant.lastName.slice(0, 1)}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-black text-slate-900 dark:text-white truncate">
            {tenant.firstName} {tenant.lastName}
          </p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
            Locataire depuis le {new Date(tenant.createdAt).toLocaleDateString("fr-FR")}
          </p>
        </div>
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0 p-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition"
          aria-label="Contacter le gestionnaire sur WhatsApp"
        >
          <MessageCircle className="w-4 h-4" />
        </a>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-5">
        <InfoLine icon={Phone} label="Téléphone principal" value={tenant.phone} />
        <InfoLine icon={Mail} label="Email" value={tenant.email || "Non renseigné"} />
        <InfoLine
          icon={ShieldCheck}
          label={`Pièce d'identité (${tenant.identityType})`}
          value={tenant.identityNumber}
        />
        <InfoLine
          icon={Contact}
          label="Profession / Employeur"
          value={[tenant.profession, tenant.employer].filter(Boolean).join(" · ") || "Non renseignée"}
        />
        <InfoLine
          icon={UserRound}
          label="Contact d'urgence"
          value={[tenant.emergencyContactName, tenant.emergencyContactPhone].filter(Boolean).join(" · ") || "Non renseigné"}
        />
        <InfoLine
          icon={UserRound}
          label="Garant"
          value={[tenant.guarantorName, tenant.guarantorPhone].filter(Boolean).join(" · ") || "Non renseigné"}
        />
      </div>
    </PortalCard>
  );
}

export function LeaseOverviewCard({
  lease,
  unit,
  currency,
  onOpenContract,
}: {
  lease?: Lease;
  unit?: Unit;
  currency: Currency;
  onOpenContract: () => void;
}) {
  if (!lease) {
    return (
      <PortalCard id="portal-lease" icon={FileText} title="Mon Contrat de Bail">
        <EmptyState
          icon={FileText}
          title="Aucun bail actif enregistré"
          message="Votre gestionnaire finalisera le contrat et le rendra disponible ici."
        />
      </PortalCard>
    );
  }

  const typeLabels: Record<Lease["leaseType"], string> = {
    RESIDENTIAL: "Habitation",
    COMMERCIAL: "Commercial",
    FURNISHED: "Meublé",
    VERBAL_RECORDED: "Verbal enregistré",
  };

  return (
    <PortalCard
      id="portal-lease"
      icon={FileText}
      title="Mon Contrat de Bail"
      description="Conditions contractuelles et informations du logement."
      action={
        <Badge tone={lease.status === "ACTIVE" ? "success" : "warning"}>
          {lease.status === "ACTIVE" ? "En cours" : lease.status === "NOTICE_GIVEN" ? "Préavis en cours" : lease.status.toLowerCase()}
        </Badge>
      }
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 flex items-center justify-center shrink-0">
            <Home className="w-5 h-5 text-emerald-700 dark:text-emerald-300" />
          </div>
          <div>
            <p className="text-sm font-black text-slate-900 dark:text-white">
              Lot {unit?.unitNumber || "—"} · {typeLabels[lease.leaseType]}
            </p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              {unit?.buildingName || "Immeuble non renseigné"}
              {unit?.surfaceM2 ? ` · ${unit.surfaceM2} m² · ${unit.roomsCount} pièce(s)` : ""}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onOpenContract}
          className="shrink-0 inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold transition"
        >
          <FileText className="w-3.5 h-3.5" />
          Voir / imprimer le bail
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {[
          { label: "Loyer mensuel", value: formatCurrency(lease.rentAmount, currency) },
          { label: "Charges", value: formatCurrency(lease.chargesAmount, currency) },
          { label: "Dépôt de garantie", value: formatCurrency(lease.depositAmount, currency) },
          { label: "Début de bail", value: new Date(lease.startDate).toLocaleDateString("fr-FR") },
          { label: "Échéance", value: `Le ${lease.paymentDueDay} de chaque mois` },
          { label: "Délai de grâce", value: `${lease.gracePeriodDays} jour(s) · pénalité ${lease.lateFeePercentage}%` },
        ].map((item) => (
          <div key={item.label} className="p-3 rounded-xl bg-white dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700">
            <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">{item.label}</p>
            <p className="text-xs font-extrabold text-slate-800 dark:text-slate-200 mt-0.5">{item.value}</p>
          </div>
        ))}
      </div>
    </PortalCard>
  );
}

/* -------------------------------------------------------------------------- */
/* Installments & receipts                                                    */
/* -------------------------------------------------------------------------- */

const installmentTone: Record<Installment["status"], Tone> = {
  UPCOMING: "info",
  PARTIAL: "warning",
  PAID: "success",
  OVERDUE: "danger",
  CANCELLED: "neutral",
};

const installmentLabel: Record<Installment["status"], string> = {
  UPCOMING: "À venir",
  PARTIAL: "Partiel",
  PAID: "Soldé",
  OVERDUE: "En retard",
  CANCELLED: "Annulé",
};

export function InstallmentHistoryCard({
  installments,
  currency,
  onPay,
}: {
  installments: Installment[];
  currency: Currency;
  onPay: (installment: Installment) => void;
}) {
  const [filter, setFilter] = useState<"ALL" | "DUE" | "PAID">("ALL");

  const filtered = useMemo(() => {
    const sorted = [...installments].sort(
      (a, b) => b.periodYear - a.periodYear || b.periodMonth - a.periodMonth
    );
    if (filter === "DUE") return sorted.filter((i) => i.remainingDue > 0 && i.status !== "CANCELLED");
    if (filter === "PAID") return sorted.filter((i) => i.status === "PAID");
    return sorted;
  }, [installments, filter]);

  return (
    <PortalCard
      id="portal-payments"
      icon={CalendarDays}
      title="Historique des Échéances"
      description="Détail des loyers, pénalités et règlements par période."
      action={<Badge tone="info">{installments.length} échéance(s)</Badge>}
    >
      <div className="flex gap-1.5">
        {([
          { id: "ALL", label: "Toutes" },
          { id: "DUE", label: "À régler" },
          { id: "PAID", label: "Soldées" },
        ] as const).map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setFilter(tab.id)}
            className={cn(
              "px-3 py-1.5 rounded-lg text-[11px] font-bold transition",
              filter === tab.id
                ? "bg-emerald-600 text-white"
                : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={CalendarDays}
          title="Aucune échéance dans cette catégorie"
          message="Les échéances apparaîtront ici dès leur génération par le gestionnaire."
        />
      ) : (
        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {filtered.map((i) => (
            <div key={i.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-extrabold text-slate-900 dark:text-white">{i.periodLabel}</span>
                  <Badge tone={installmentTone[i.status]}>{installmentLabel[i.status]}</Badge>
                  {i.penaltyApplied > 0 && <Badge tone="danger">Pénalité {formatCurrency(i.penaltyApplied, currency)}</Badge>}
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Échéance : {i.dueDate} · Payé : {formatCurrency(i.amountPaid, currency)} / {formatCurrency(i.totalDue, currency)}
                </p>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <span
                  className={cn(
                    "text-sm font-black",
                    i.remainingDue > 0 ? "text-rose-600 dark:text-rose-400" : "text-emerald-600 dark:text-emerald-400"
                  )}
                >
                  {formatCurrency(i.remainingDue, currency)}
                </span>
                {i.remainingDue > 0 && i.status !== "CANCELLED" && (
                  <button
                    type="button"
                    onClick={() => onPay(i)}
                    className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] transition"
                  >
                    Payer
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </PortalCard>
  );
}

export function ReceiptsCard({
  receipts,
  currency,
  onOpen,
}: {
  receipts: Receipt[];
  currency: Currency;
  onOpen: (receipt: Receipt) => void;
}) {
  const [query, setQuery] = useState("");
  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    const sorted = [...receipts].sort((a, b) => b.issuedAt.localeCompare(a.issuedAt));
    if (!term) return sorted;
    return sorted.filter((r) =>
      [r.receiptNumber, r.periodLabel, r.unitNumber, r.provider || r.paymentMethod]
        .join(" ")
        .toLowerCase()
        .includes(term)
    );
  }, [receipts, query]);

  return (
    <PortalCard
      id="portal-receipts"
      icon={FileCheck2}
      title="Mes Quittances Certifiées"
      description="Documents officiels avec QR code de vérification publique."
      action={<Badge tone="success">{receipts.length} document(s)</Badge>}
    >
      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Rechercher par numéro, période, lot..."
        className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
      />
      {filtered.length === 0 ? (
        <EmptyState
          icon={FileCheck2}
          title={query ? "Aucune quittance correspondante" : "Aucune quittance émise"}
          message={query ? "Essayez un autre numéro ou une autre période." : "Vos quittances apparaîtront ici après un règlement."}
        />
      ) : (
        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {filtered.map((rcpt) => (
            <div key={rcpt.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-[10px] text-emerald-700 dark:text-emerald-400 font-extrabold px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950">
                    {rcpt.receiptNumber}
                  </span>
                  <span className="text-xs font-extrabold text-slate-900 dark:text-white">{rcpt.periodLabel}</span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Payé le {new Date(rcpt.issuedAt).toLocaleDateString("fr-FR")} · {rcpt.provider || rcpt.paymentMethod} · Lot {rcpt.unitNumber}
                </p>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <span className="text-sm font-black text-slate-900 dark:text-white">
                  {formatCurrency(rcpt.amountPaid, currency)}
                </span>
                <button
                  type="button"
                  onClick={() => onOpen(rcpt)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] transition"
                >
                  <ReceiptText className="w-3.5 h-3.5" />
                  Consulter
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </PortalCard>
  );
}

/* -------------------------------------------------------------------------- */
/* Maintenance & reminders                                                    */
/* -------------------------------------------------------------------------- */

const ticketCategoryLabels: Record<MaintenanceTicket["category"], string> = {
  PLUMBING: "Plomberie",
  ELECTRICITY: "Électricité",
  AC: "Climatisation",
  MASONRY: "Maçonnerie",
  CARPENTRY: "Menuiserie",
  OTHER: "Autre",
};

const ticketStatusTone: Record<MaintenanceTicket["status"], Tone> = {
  OPEN: "warning",
  IN_PROGRESS: "info",
  QUOTED: "info",
  RESOLVED: "success",
};

const ticketPriorityTone: Record<MaintenanceTicket["priority"], Tone> = {
  LOW: "neutral",
  MEDIUM: "info",
  HIGH: "warning",
  URGENT: "danger",
};

export function MaintenanceCard({
  tickets,
  onNewTicket,
}: {
  tickets: MaintenanceTicket[];
  onNewTicket: () => void;
}) {
  const sorted = useMemo(
    () => [...tickets].sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [tickets]
  );

  return (
    <PortalCard
      id="portal-maintenance"
      icon={Wrench}
      title="Suivi de Maintenance"
      description="Signalez un problème et suivez l'intervention du gestionnaire."
      action={
        <button
          type="button"
          onClick={onNewTicket}
          className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-extrabold transition"
        >
          <ClipboardList className="w-3.5 h-3.5" />
          Signaler un problème
        </button>
      }
    >
      {sorted.length === 0 ? (
        <EmptyState
          icon={Wrench}
          title="Aucune intervention enregistrée"
          message="Un problème dans votre logement ? Signalez-le en un clic au gestionnaire."
        />
      ) : (
        <div className="space-y-2">
          {sorted.map((ticket) => (
            <div
              key={ticket.id}
              className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-emerald-300 dark:hover:border-emerald-700 transition"
            >
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-xs font-extrabold text-slate-900 dark:text-white flex-1 min-w-0">{ticket.title}</p>
                <Badge tone={ticketStatusTone[ticket.status]}>
                  {ticket.status === "OPEN" ? "Ouvert" : ticket.status === "IN_PROGRESS" ? "En cours" : ticket.status === "QUOTED" ? "Devis reçu" : "Résolu"}
                </Badge>
                <Badge tone={ticketPriorityTone[ticket.priority]}>{ticket.priority}</Badge>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">{ticket.description}</p>
              <p className="text-[10px] text-slate-400 mt-1.5 flex items-center gap-2 flex-wrap">
                <span>{ticketCategoryLabels[ticket.category]}</span>
                <span>•</span>
                <span>Créé le {new Date(ticket.createdAt).toLocaleDateString("fr-FR")}</span>
                {ticket.vendorName && (
                  <>
                    <span>•</span>
                    <span>Intervenant : {ticket.vendorName}</span>
                  </>
                )}
              </p>
            </div>
          ))}
        </div>
      )}
    </PortalCard>
  );
}

const sequenceLabels: Record<ReminderLog["sequence"], string> = {
  J_MINUS_3: "Rappel J-3",
  DAY_J: "Échéance du jour",
  J_PLUS_3: "Relance J+3",
  J_PLUS_7: "Relance J+7",
  NOTICE_OF_DEFAULT: "Mise en demeure",
};

export function ReminderHistoryCard({ reminders }: { reminders: ReminderLog[] }) {
  const [expanded, setExpanded] = useState<string | null>(null);
  const sorted = useMemo(
    () => [...reminders].sort((a, b) => b.sentAt.localeCompare(a.sentAt)),
    [reminders]
  );

  return (
    <PortalCard
      id="portal-reminders"
      icon={BellRing}
      title="Historique des Relances"
      description="Messages automatiques envoyés au sujet de vos échéances."
      action={<Badge tone="neutral">{sorted.length} message(s)</Badge>}
    >
      {sorted.length === 0 ? (
        <EmptyState
          icon={BellRing}
          title="Aucune relance reçue"
          message="Vous êtes à jour : aucun rappel automatique n'a été généré pour vous."
        />
      ) : (
        <div className="space-y-2">
          {sorted.slice(0, 12).map((log) => (
            <div key={log.id} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
              <div className="flex flex-wrap items-center gap-2">
                <CircleDot className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span className="text-xs font-extrabold text-slate-800 dark:text-slate-200 flex-1 min-w-0">
                  {sequenceLabels[log.sequence]}
                </span>
                <Badge tone={log.channel === "EMAIL" ? "info" : log.channel === "WHATSAPP" ? "success" : "neutral"}>
                  {log.channel === "EMAIL" ? "Email" : log.channel === "WHATSAPP" ? "WhatsApp" : "SMS"}
                </Badge>
                <Badge tone={log.status === "FAILED" ? "danger" : "neutral"}>{log.status}</Badge>
              </div>
              <p className="text-[10px] text-slate-400 mt-1">
                {new Date(log.sentAt).toLocaleString("fr-FR")}
              </p>
              <button
                type="button"
                onClick={() => setExpanded(expanded === log.id ? null : log.id)}
                className="mt-1.5 inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 dark:text-emerald-300 hover:underline"
              >
                {expanded === log.id ? "Masquer le message" : "Lire le message"}
                <ChevronDown className={cn("w-3 h-3 transition-transform", expanded === log.id && "rotate-180")} />
              </button>
              {expanded === log.id && (
                <p className="mt-2 p-2 rounded-lg bg-white dark:bg-slate-900 text-[11px] text-slate-600 dark:text-slate-300 whitespace-pre-wrap border border-slate-200 dark:border-slate-700">
                  {log.messageBody}
                </p>
              )}
            </div>
          ))}
          {sorted.length > 12 && (
            <p className="text-[11px] text-center text-slate-400">
              {sorted.length - 12} message(s) antérieur(s) non affiché(s).
            </p>
          )}
        </div>
      )}
    </PortalCard>
  );
}

export function SupportCard({ organizationPhone }: { organizationPhone?: string }) {
  return (
    <div className="p-5 rounded-2xl bg-gradient-to-r from-slate-900 to-emerald-950 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
      <div className="flex items-start gap-3">
        <Building2 className="w-5 h-5 text-emerald-300 mt-0.5 shrink-0" />
        <div>
          <p className="text-sm font-extrabold">Besoin d&apos;aide ?</p>
          <p className="text-[11px] text-emerald-100 mt-0.5">
            Le gestionnaire du patrimoine est joignable pour toute question sur votre location.
          </p>
        </div>
      </div>
      {organizationPhone && (
        <a
          href={`tel:${organizationPhone}`}
          className="shrink-0 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white text-slate-900 font-extrabold text-xs hover:bg-emerald-50 transition"
        >
          <Phone className="w-3.5 h-3.5" />
          {organizationPhone}
        </a>
      )}
    </div>
  );
}
