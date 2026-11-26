"use client";

import React, { useState } from "react";
import { ReminderLog, Installment, Organization } from "@/types";
import { useApp } from "@/context/AppContext";
import { formatCurrency, cn } from "@/lib/utils";
import { useApiQuery } from "@/lib/api-client";
import { MessageSquare, CheckCircle2, Send, AlertTriangle, Clock, Sparkles, XCircle } from "lucide-react";
import { LazyRelanceModal as RelanceModal } from "@/components/LazyModals";
import type { NotificationStatus } from "@/lib/notification-service";
import { SEQUENCE_LABELS } from "@/lib/reminder-templates";

export default function RelancesPage() {
  const { currency, refreshTrigger, showToast, triggerRefresh } = useApp();
  const [selectedOverdue, setSelectedOverdue] = useState<Installment | null>(null);
  const [isRelanceOpen, setIsRelanceOpen] = useState(false);
  const { data: reminders = [] } = useApiQuery<ReminderLog[]>(
    "reminders",
    "/api/reminders",
    { refreshKey: refreshTrigger }
  );
  const { data: overdues = [] } = useApiQuery<Installment[]>(
    "installments?status=OVERDUE",
    "/api/installments?status=OVERDUE",
    { refreshKey: refreshTrigger }
  );
  const { data: org } = useApiQuery<Organization | null>(
    "organization",
    "/api/organization",
    { refreshKey: refreshTrigger }
  );
  const { data: providers } = useApiQuery<NotificationStatus>(
    "notification-providers-status",
    "/api/settings/notifications/status"
  );

  const handleRemindAll = async () => {
    if (overdues.length === 0) return;

    const channels: ("SMS" | "EMAIL")[] = [];
    if (org?.settings?.smsNotifications !== false && providers?.sms?.configured) channels.push("SMS");
    if (org?.settings?.emailNotifications !== false && providers?.email?.configured) channels.push("EMAIL");

    if (channels.length === 0) {
      showToast(
        "Aucun canal disponible : configurez un fournisseur SMS et/ou email dans Paramètres > Fournisseurs.",
        "error"
      );
      return;
    }

    let sent = 0;
    let failed = 0;
    for (const inst of overdues) {
      for (const channel of channels) {
        try {
          const res = await fetch("/api/reminders", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              installmentId: inst.id,
              channel,
              sequence: "J_PLUS_7",
            }),
          });
          const data = await res.json();
          if (res.ok && data.success) sent += 1;
          else failed += 1;
        } catch {
          failed += 1;
        }
      }
    }

    showToast(
      `${sent} relance(s) envoyée(s) (${channels.join(" + ")}), ${failed} échec(s).`,
      failed === 0 ? "success" : "error"
    );
    if (sent > 0) triggerRefresh();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <MessageSquare className="w-6 h-6 text-emerald-600" />
            <span>Moteur de Relances & Recouvrement</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Séquences SMS et email automatisées pour réduire les impayés.
          </p>
        </div>

        {overdues.length > 0 && (
          <button
            onClick={handleRemindAll}
            className="flex items-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 text-white font-extrabold text-xs px-4 py-2.5 rounded-xl shadow-md transition active:scale-95"
          >
            <Sparkles className="w-4 h-4" />
            <span>Relancer tous les retardataires ({overdues.length})</span>
          </button>
        )}
      </div>

      {/* Grid: Overdues awaiting reminder + History */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Overdue Queue */}
        <div className="lg:col-span-1 p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-500" />
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                File d&apos;attente ({overdues.length})
              </h3>
            </div>
            <span className="text-[10px] font-bold uppercase text-slate-400">À relancer</span>
          </div>

          <div className="space-y-3">
            {overdues.length > 0 ? (
              overdues.map((inst) => (
                <div
                  key={inst.id}
                  className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 space-y-2"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-bold text-xs text-slate-900 dark:text-white">{inst.tenantName}</p>
                      <p className="text-[11px] text-slate-500">{inst.unitNumber} &bull; {inst.tenantPhone}</p>
                    </div>
                    <span className="font-black text-xs text-rose-600 dark:text-rose-400">
                      {formatCurrency(inst.remainingDue, currency)}
                    </span>
                  </div>

                  <button
                    onClick={() => {
                      setSelectedOverdue(inst);
                      setIsRelanceOpen(true);
                    }}
                    className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition"
                  >
                    <Send className="w-3 h-3" />
                    <span>Envoyer Relance Personnalisée</span>
                  </button>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-400 text-center py-6">
                Aucun locataire en retard à relancer.
              </p>
            )}
          </div>
        </div>

        {/* Right: Reminder Logs */}
        <div className="lg:col-span-2 p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-emerald-600" />
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                Historique des Relances Transmises
              </h3>
            </div>
            <span className="text-xs text-slate-500">{reminders.length} relance(s)</span>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {reminders.length > 0 ? (
              reminders.map((rem) => (
                <div key={rem.id} className="py-3.5 space-y-1.5">
                  <div className="flex justify-between items-center text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 dark:text-white">{rem.tenantName}</span>
                      <span className={cn(
                        "px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase",
                        rem.channel === "EMAIL"
                          ? "bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300"
                          : "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                      )}>
                        {rem.channel === "EMAIL" ? "Email" : rem.channel === "SMS" ? "SMS" : "WhatsApp"}
                      </span>
                      {rem.sequence && (
                        <span className="text-[10px] text-slate-400">
                          {SEQUENCE_LABELS[rem.sequence]?.fr || rem.sequence}
                        </span>
                      )}
                      <span className="text-[11px] text-slate-400 font-mono">{rem.tenantPhone}</span>
                    </div>
                    <span className="text-[11px] text-slate-400">
                      {new Date(rem.sentAt).toLocaleString("fr-FR")}
                    </span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-900 text-emerald-400 font-mono text-xs leading-relaxed border border-slate-800">
                    {rem.messageBody}
                  </div>
                  <div className={cn(
                    "flex items-center gap-1.5 text-[10px] font-bold",
                    rem.status === "FAILED"
                      ? "text-rose-600 dark:text-rose-400"
                      : "text-emerald-600 dark:text-emerald-400"
                  )}>
                    {rem.status === "FAILED" ? (
                      <XCircle className="w-3 h-3" />
                    ) : (
                      <CheckCircle2 className="w-3 h-3" />
                    )}
                    <span>
                      {rem.status === "FAILED"
                        ? "Envoi échoué : fournisseur non configuré ou erreur"
                        : "Transmis au fournisseur"}
                      {" · "}
                      {rem.status}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-400 text-center py-10">
                Aucune relance effectuée pour le moment.
              </p>
            )}
          </div>
        </div>
      </div>

      {isRelanceOpen && selectedOverdue && (
        <RelanceModal
          installment={selectedOverdue}
          onClose={() => {
            setIsRelanceOpen(false);
            setSelectedOverdue(null);
          }}
          onSuccess={triggerRefresh}
        />
      )}
    </div>
  );
}
