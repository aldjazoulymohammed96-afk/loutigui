"use client";

import React, { useMemo, useState } from "react";
import { Receipt } from "@/types";
import { useApp } from "@/context/AppContext";
import { formatCurrency } from "@/lib/utils";
import { useApiQuery } from "@/lib/api-client";
import { FileCheck2, Search, ExternalLink, ShieldCheck } from "lucide-react";
import { LazyQuittanceModal as QuittanceModal } from "@/components/LazyModals";

export default function QuittancesPage() {
  const { currency, refreshTrigger } = useApp();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedReceipt, setSelectedReceipt] = useState<Receipt | null>(null);
  const { data: receipts = [] } = useApiQuery<Receipt[]>("receipts", "/api/receipts", {
    refreshKey: refreshTrigger,
  });

  const filtered = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return receipts;
    return receipts.filter(
      (r) =>
        r.receiptNumber.toLowerCase().includes(term) ||
        r.tenantName.toLowerCase().includes(term) ||
        r.unitNumber.toLowerCase().includes(term) ||
        r.buildingName.toLowerCase().includes(term)
    );
  }, [receipts, searchTerm]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <FileCheck2 className="w-6 h-6 text-emerald-600" />
            <span>Registre des Quittances Officielles</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Numérotation séquentielle inviolable et QR code de certification publique.
          </p>
        </div>

        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-bold">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>{receipts.length} Quittances Certifiées</span>
        </div>
      </div>

      {/* Search Input */}
      <div className="relative max-w-md">
        <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Rechercher par N° de quittance, locataire, lot..."
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-sm"
        />
      </div>

      {/* Receipts Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 font-bold uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">N° Quittance</th>
                <th className="py-3 px-4">Locataire</th>
                <th className="py-3 px-4">Bien & Immeuble</th>
                <th className="py-3 px-4">Période</th>
                <th className="py-3 px-4 text-right">Montant Réglé</th>
                <th className="py-3 px-4">Mode</th>
                <th className="py-3 px-4">Émise le</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filtered.length > 0 ? (
                filtered.map((rcpt) => (
                  <tr
                    key={rcpt.id}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition cursor-pointer"
                    onClick={() => setSelectedReceipt(rcpt)}
                  >
                    <td className="py-3.5 px-4 font-mono font-extrabold text-emerald-700 dark:text-emerald-400">
                      {rcpt.receiptNumber}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">
                      {rcpt.tenantName}
                    </td>
                    <td className="py-3.5 px-4 text-slate-500">
                      {rcpt.unitNumber} ({rcpt.buildingName})
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-700 dark:text-slate-300">
                      {rcpt.periodLabel}
                    </td>
                    <td className="py-3.5 px-4 text-right font-extrabold text-slate-900 dark:text-white">
                      {formatCurrency(rcpt.amountPaid, currency)}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                        {rcpt.provider || rcpt.paymentMethod}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-500">
                      {new Date(rcpt.issuedAt).toLocaleDateString("fr-FR")}
                    </td>
                    <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => setSelectedReceipt(rcpt)}
                        className="flex items-center gap-1 ml-auto px-2.5 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 text-emerald-700 dark:text-emerald-300 font-bold text-[11px] transition"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>Consulter</span>
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    Aucune quittance trouvée.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selectedReceipt && (
        <QuittanceModal
          receipt={selectedReceipt}
          onClose={() => setSelectedReceipt(null)}
        />
      )}
    </div>
  );
}
