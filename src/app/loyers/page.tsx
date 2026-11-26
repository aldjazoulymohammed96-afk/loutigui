"use client";

import React, { useMemo, useState } from "react";
import { Installment, Receipt } from "@/types";
import { useApp } from "@/context/AppContext";
import { formatCurrency } from "@/lib/utils";
import { fetchQueryData, useApiQuery } from "@/lib/api-client";
import { ReceiptText, Search, CreditCard, MessageSquare, FileCheck2 } from "lucide-react";
import {
  LazyEncaissementModal as EncaissementModal,
  LazyQuittanceModal as QuittanceModal,
  LazyRelanceModal as RelanceModal,
} from "@/components/LazyModals";

export default function LoyersPage() {
  const { currency, refreshTrigger } = useApp();
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const { data: installments = [] } = useApiQuery<Installment[]>(
    `installments?status=${statusFilter}`,
    `/api/installments?status=${statusFilter}`,
    { refreshKey: refreshTrigger }
  );

  // Modals
  const [selectedInstallment, setSelectedInstallment] = useState<Installment | null>(null);
  const [isEncaissementOpen, setIsEncaissementOpen] = useState(false);
  const [relanceInstallment, setRelanceInstallment] = useState<Installment | null>(null);
  const [isRelanceOpen, setIsRelanceOpen] = useState(false);
  const [viewReceipt, setViewReceipt] = useState<Receipt | null>(null);

  const filtered = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return installments;
    return installments.filter(
      (i) =>
        i.tenantName.toLowerCase().includes(term) ||
        i.unitNumber.toLowerCase().includes(term) ||
        i.buildingName.toLowerCase().includes(term) ||
        i.periodLabel.toLowerCase().includes(term)
    );
  }, [installments, searchTerm]);

  const handleOpenReceipt = async (receiptId?: string) => {
    if (!receiptId) return;
    try {
      setViewReceipt(
        await fetchQueryData<Receipt>(`receipt-${receiptId}`, `/api/receipts/${receiptId}`)
      );
    } catch {}
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <ReceiptText className="w-6 h-6 text-emerald-600" />
            <span>Échéancier des Loyers</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Suivez les échéances, enregistrez les règlements et gérez les relances.
          </p>
        </div>

        <button
          onClick={() => {
            setSelectedInstallment(null);
            setIsEncaissementOpen(true);
          }}
          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-md transition active:scale-95"
        >
          <CreditCard className="w-4 h-4" />
          <span>Nouvel Encaissement Express</span>
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Rechercher par locataire, lot, immeuble..."
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        {/* Status Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          {[
            { key: "ALL", label: "Tous" },
            { key: "OVERDUE", label: "En Retard" },
            { key: "PARTIAL", label: "Partiels" },
            { key: "PAID", label: "Payés" },
            { key: "UPCOMING", label: "À Venir" },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setStatusFilter(tab.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap ${
                statusFilter === tab.key
                  ? "bg-slate-900 text-white dark:bg-emerald-600 shadow-sm"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Installments Table / Cards */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 font-bold uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Locataire & Lot</th>
                <th className="py-3 px-4">Période</th>
                <th className="py-3 px-4">Échéance</th>
                <th className="py-3 px-4 text-right">Loyer Total</th>
                <th className="py-3 px-4 text-right">Payé</th>
                <th className="py-3 px-4 text-right">Reste Dû</th>
                <th className="py-3 px-4 text-center">Statut</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filtered.length > 0 ? (
                filtered.map((inst) => {
                  let statusBadge = (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                      Payé
                    </span>
                  );
                  if (inst.status === "OVERDUE") {
                    statusBadge = (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 animate-pulse">
                        En retard
                      </span>
                    );
                  } else if (inst.status === "PARTIAL") {
                    statusBadge = (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                        Partiel
                      </span>
                    );
                  } else if (inst.status === "UPCOMING") {
                    statusBadge = (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                        À venir
                      </span>
                    );
                  }

                  return (
                    <tr
                      key={inst.id}
                      className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition"
                    >
                      <td className="py-3.5 px-4">
                        <p className="font-bold text-slate-900 dark:text-white">{inst.tenantName}</p>
                        <p className="text-[11px] text-slate-500">
                          {inst.unitNumber} &bull; {inst.buildingName}
                        </p>
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-slate-700 dark:text-slate-300">
                        {inst.periodLabel}
                      </td>
                      <td className="py-3.5 px-4 text-slate-500">{inst.dueDate}</td>
                      <td className="py-3.5 px-4 text-right font-semibold text-slate-900 dark:text-white">
                        {formatCurrency(inst.totalDue, currency)}
                      </td>
                      <td className="py-3.5 px-4 text-right font-semibold text-emerald-600 dark:text-emerald-400">
                        {formatCurrency(inst.amountPaid, currency)}
                      </td>
                      <td className="py-3.5 px-4 text-right font-extrabold text-rose-600 dark:text-rose-400">
                        {formatCurrency(inst.remainingDue, currency)}
                      </td>
                      <td className="py-3.5 px-4 text-center">{statusBadge}</td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {inst.remainingDue > 0 ? (
                            <>
                              <button
                                onClick={() => {
                                  setRelanceInstallment(inst);
                                  setIsRelanceOpen(true);
                                }}
                                className="p-1.5 rounded-lg border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-emerald-50 hover:text-emerald-700 transition"
                                title="Relancer via WhatsApp ou SMS"
                              >
                                <MessageSquare className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => {
                                  setSelectedInstallment(inst);
                                  setIsEncaissementOpen(true);
                                }}
                                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] shadow-sm transition active:scale-95"
                                title="Encaisser"
                              >
                                <CreditCard className="w-3 h-3" />
                                <span>Encaisser</span>
                              </button>
                            </>
                          ) : (
                            <button
                              onClick={() => handleOpenReceipt(inst.receiptId)}
                              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-emerald-700 dark:text-emerald-300 font-bold text-[11px] transition"
                              title="Voir la quittance officielle"
                            >
                              <FileCheck2 className="w-3.5 h-3.5" />
                              <span>Quittance</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <p className="font-bold text-sm text-slate-700 dark:text-slate-300">
                      Aucune échéance de loyer trouvée
                    </p>
                    <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                      Les échéances mensuelles se génèrent automatiquement dès que vous attribuez un contrat de bail à un lot.
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals */}
      {isEncaissementOpen && (
        <EncaissementModal
          initialInstallment={selectedInstallment}
          onClose={() => {
            setIsEncaissementOpen(false);
            setSelectedInstallment(null);
          }}
          onSuccess={(rcpt) => {
            setIsEncaissementOpen(false);
            setSelectedInstallment(null);
            setViewReceipt(rcpt);
          }}
        />
      )}

      {viewReceipt && (
        <QuittanceModal
          receipt={viewReceipt}
          onClose={() => setViewReceipt(null)}
        />
      )}

      {isRelanceOpen && relanceInstallment && (
        <RelanceModal
          installment={relanceInstallment}
          onClose={() => {
            setIsRelanceOpen(false);
            setRelanceInstallment(null);
          }}
          onSuccess={() => {}}
        />
      )}
    </div>
  );
}
