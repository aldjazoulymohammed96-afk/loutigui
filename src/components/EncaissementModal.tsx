"use client";

import React, { useState, useEffect } from "react";
import { Installment, PaymentMethod, MobileMoneyProvider, Receipt } from "@/types";
import { useApp } from "@/context/AppContext";
import { formatCurrency } from "@/lib/utils";
import { readApiJson, fetchQueryData } from "@/lib/api-client";
import {
  X,
  CreditCard,
  Banknote,
  Smartphone,
  AlertCircle,
  ArrowRight,
  Sparkles,
} from "lucide-react";

interface EncaissementModalProps {
  initialInstallment?: Installment | null;
  onClose: () => void;
  onSuccess: (receipt: Receipt) => void;
}

export function EncaissementModal({
  initialInstallment,
  onClose,
  onSuccess,
}: EncaissementModalProps) {
  const { isOnline, addOfflinePayment, showToast, triggerRefresh } = useApp();

  // Ignore malformed props (e.g. a click event forwarded by mistake): they
  // used to display "NaN FCFA" and send a request without installmentId.
  const safeInitial =
    initialInstallment && typeof initialInstallment.id === "string"
      ? initialInstallment
      : null;

  const [installments, setInstallments] = useState<Installment[]>([]);
  const [selectedInstallmentId, setSelectedInstallmentId] = useState<string>(
    safeInitial?.id || ""
  );
  const [amount, setAmount] = useState<number>(Number(safeInitial?.remainingDue) || 0);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("MOBILE_MONEY");
  const [provider, setProvider] = useState<MobileMoneyProvider>("WAVE");
  const [notes, setNotes] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [listLoading, setListLoading] = useState<boolean>(!safeInitial);
  const [error, setError] = useState<string | null>(null);

  // Fetch pending installments if not provided (reuses the shared cache).
  useEffect(() => {
    if (safeInitial) return;
    let cancelled = false;
    setListLoading(true);
    fetchQueryData<Installment[]>("installments?status=ALL", "/api/installments?status=ALL")
      .then((all) => {
        if (cancelled) return;
        const pending = all.filter(
          (i) => i.status === "OVERDUE" || i.status === "PARTIAL" || i.status === "UPCOMING"
        );
        setInstallments(pending);
        if (pending.length > 0) {
          setSelectedInstallmentId((prev) => prev || pending[0].id);
          setAmount((prev) => prev || Number(pending[0].remainingDue) || 0);
        }
      })
      .catch(() => {
        if (!cancelled) setError("Impossible de charger les échéances en attente.");
      })
      .finally(() => {
        if (!cancelled) setListLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [safeInitial]);

  // A preselected installment comes from the "Encaissement express" action.
  useEffect(() => {
    if (!safeInitial) return;
    setSelectedInstallmentId(safeInitial.id);
    setAmount(Number(safeInitial.remainingDue) || 0);
  }, [safeInitial]);

  const currentInstallment = safeInitial || installments.find((i) => i.id === selectedInstallmentId);

  // When installment selection changes, update amount
  const handleSelectInstallment = (id: string) => {
    setSelectedInstallmentId(id);
    const found = installments.find((i) => i.id === id);
    if (found) {
      setAmount(Number(found.remainingDue) || 0);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentInstallment?.id) {
      setError("Veuillez sélectionner une échéance de loyer en attente de règlement.");
      return;
    }
    if (!Number.isFinite(amount) || amount <= 0) {
      setError("Le montant doit être supérieur à 0.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const payload = {
      installmentId: currentInstallment.id,
      amount,
      paymentMethod,
      provider: paymentMethod === "MOBILE_MONEY" ? provider : undefined,
      notes: notes || undefined,
      externalTransactionRef: `${provider || paymentMethod}-${Date.now().toString().slice(-6)}`,
    };

    if (!isOnline) {
      // Offline mode handling
      addOfflinePayment(payload);
      setIsSubmitting(false);
      onClose();
      return;
    }

    try {
      const res = await fetch("/api/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await readApiJson(res);
      if (!data.success) {
        throw new Error(data.error || "Erreur lors de l'encaissement");
      }

      showToast("Loyer encaissé avec succès ! Quittance officielle générée.", "success");
      triggerRefresh();
      onSuccess(data.data.receipt);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white">
              <CreditCard className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-bold text-base text-slate-900 dark:text-white">
                Encaissement Express (3 Touches)
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Enregistrez le règlement et éditez la quittance instantanée
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 flex items-center gap-2 text-rose-700 dark:text-rose-300 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* 1. Target Installment */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              1. Échéance de Loyer à Encaisser
            </label>
            {safeInitial ? (
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-1">
                <div className="flex justify-between items-center text-sm font-bold text-slate-900 dark:text-white">
                  <span>{safeInitial.tenantName}</span>
                  <span className="text-emerald-600 dark:text-emerald-400">
                    Dû : {formatCurrency(Number(safeInitial.remainingDue) || 0)}
                  </span>
                </div>
                <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400">
                  <span>{safeInitial.unitNumber} ({safeInitial.buildingName})</span>
                  <span>Période : {safeInitial.periodLabel}</span>
                </div>
              </div>
            ) : installments.length > 0 ? (
              <select
                value={selectedInstallmentId}
                onChange={(e) => handleSelectInstallment(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              >
                {installments.map((inst) => (
                  <option key={inst.id} value={inst.id}>
                    {inst.tenantName} - {inst.unitNumber} ({inst.periodLabel}) - Reste : {formatCurrency(Number(inst.remainingDue) || 0)}
                  </option>
                ))}
              </select>
            ) : listLoading ? (
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs text-slate-500">
                Chargement des échéances en attente…
              </div>
            ) : (
              <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-xs text-amber-800 dark:text-amber-300">
                Aucune échéance en attente de règlement. Créez d&apos;abord un bail ou une échéance de loyer.
              </div>
            )}
          </div>

          {/* 2. Amount */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                2. Montant Reçu (FCFA)
              </label>
              {currentInstallment && (
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setAmount(Number(currentInstallment.remainingDue) || 0)}
                    className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline"
                  >
                    Totalité ({formatCurrency(Number(currentInstallment.remainingDue) || 0)})
                  </button>
                  <button
                    type="button"
                    onClick={() => setAmount(Math.round((Number(currentInstallment.remainingDue) || 0) / 2))}
                    className="text-[11px] font-bold text-slate-500 hover:underline"
                  >
                    50%
                  </button>
                </div>
              )}
            </div>
            <div className="relative">
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                min={1000}
                max={5000000}
                step={1000}
                required
                className="w-full pl-4 pr-16 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-extrabold text-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                FCFA
              </span>
            </div>
          </div>

          {/* 3. Payment Method */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              3. Canal de Règlement
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setPaymentMethod("MOBILE_MONEY")}
                className={`flex flex-col items-center justify-center p-3 rounded-xl border text-xs font-bold transition ${
                  paymentMethod === "MOBILE_MONEY"
                    ? "border-emerald-600 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 shadow-sm"
                    : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
                }`}
              >
                <Smartphone className="w-5 h-5 mb-1 text-emerald-600" />
                <span>Mobile Money</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod("CASH")}
                className={`flex flex-col items-center justify-center p-3 rounded-xl border text-xs font-bold transition ${
                  paymentMethod === "CASH"
                    ? "border-emerald-600 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 shadow-sm"
                    : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
                }`}
              >
                <Banknote className="w-5 h-5 mb-1 text-amber-600" />
                <span>Espèces</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod("BANK_TRANSFER")}
                className={`flex flex-col items-center justify-center p-3 rounded-xl border text-xs font-bold transition ${
                  paymentMethod === "BANK_TRANSFER"
                    ? "border-emerald-600 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 shadow-sm"
                    : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
                }`}
              >
                <CreditCard className="w-5 h-5 mb-1 text-blue-600" />
                <span>Virement / Chq</span>
              </button>
            </div>

            {/* Operator sub-selection for Mobile Money */}
            {paymentMethod === "MOBILE_MONEY" && (
              <div className="pt-2">
                <div className="grid grid-cols-4 gap-1.5">
                  {(["WAVE", "ORANGE_MONEY", "MTN_MOMO", "MOOV"] as MobileMoneyProvider[]).map((op) => (
                    <button
                      key={op}
                      type="button"
                      onClick={() => setProvider(op)}
                      className={`px-2 py-1.5 rounded-lg border text-[11px] font-bold transition ${
                        provider === op
                          ? "bg-slate-900 text-white dark:bg-emerald-600 border-transparent shadow-sm"
                          : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                      }`}
                    >
                      {op === "WAVE" && "Wave CI"}
                      {op === "ORANGE_MONEY" && "Orange MoMo"}
                      {op === "MTN_MOMO" && "MTN MoMo"}
                      {op === "MOOV" && "Moov Money"}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Optional notes */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Note ou référence de reçu (optionnel)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ex: Reçu par Wave, confirmé à 11h20"
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Submit CTA */}
          <button
            type="submit"
            disabled={isSubmitting || !currentInstallment?.id}
            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white font-extrabold text-sm py-3.5 rounded-xl shadow-lg shadow-emerald-700/25 active:scale-[0.99] transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <span>Génération de la quittance en cours...</span>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Valider et Émettre la Quittance</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
