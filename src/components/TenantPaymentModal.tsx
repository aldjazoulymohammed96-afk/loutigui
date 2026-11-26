"use client";

import React, { useState } from "react";
import { CreditCard, Loader2, ShieldCheck, X } from "lucide-react";
import { Currency, Installment, MobileMoneyProvider, Receipt } from "@/types";
import { useApp } from "@/context/AppContext";
import { formatCurrency } from "@/lib/utils";

interface TenantPaymentModalProps {
  installment: Installment;
  currency: Currency;
  onClose: () => void;
  onSuccess: (receipt: Receipt | null) => void;
}

const providers: { id: MobileMoneyProvider; label: string }[] = [
  { id: "WAVE", label: "Wave CI" },
  { id: "ORANGE_MONEY", label: "Orange Money" },
  { id: "MTN_MOMO", label: "MTN MoMo" },
];

export function TenantPaymentModal({
  installment,
  currency,
  onClose,
}: TenantPaymentModalProps) {
  const { showToast } = useApp();
  const [provider, setProvider] = useState<MobileMoneyProvider>("WAVE");
  const [isProcessing, setIsProcessing] = useState(false);

  const startPayment = async () => {
    setIsProcessing(true);
    try {
      const res = await fetch("/api/payments/intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          installmentId: installment.id,
          amount: installment.remainingDue,
          provider,
        }),
      });
      const data = await res.json();

      if (res.ok && data.success && data.data?.checkoutUrl) {
        // Redirect to the provider's hosted checkout. The payment is only
        // confirmed later by the signed webhook.
        window.location.href = data.data.checkoutUrl;
        return;
      }

      showToast(
        data.error ||
          (res.status === 503
            ? "Le paiement en ligne n'est pas encore activé."
            : "Impossible d'initier le paiement."),
        res.status === 503 ? "warning" : "error"
      );
    } catch {
      showToast("Erreur de connexion au service de paiement.", "error");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-2">
            <CreditCard className="w-5 h-5 text-emerald-600 mt-0.5 shrink-0" />
            <div>
              <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                Paiement Mobile Money
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                Règlement du loyer de <strong>{installment.periodLabel}</strong> · Lot{" "}
                <strong>{installment.unitNumber}</strong>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white transition"
            aria-label="Fermer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 text-white text-center space-y-1">
          <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wide">Montant à régler</p>
          <p className="text-2xl font-black text-emerald-400">
            {formatCurrency(installment.remainingDue, currency)}
          </p>
          <p className="text-[10px] text-slate-500">
            Total dû {formatCurrency(installment.totalDue, currency)} · déjà réglé{" "}
            {formatCurrency(installment.amountPaid, currency)}
          </p>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
            Sélectionnez votre compte Mobile Money :
          </label>
          <div className="grid grid-cols-3 gap-2">
            {providers.map((op) => (
              <button
                key={op.id}
                type="button"
                onClick={() => setProvider(op.id)}
                className={`py-2 px-2 rounded-xl border text-[11px] font-bold transition ${
                  provider === op.id
                    ? "bg-emerald-600 text-white border-transparent"
                    : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                }`}
              >
                {op.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2 p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 text-[11px]">
          <ShieldCheck className="w-4 h-4 shrink-0" />
          <span>
            Vous serez redirigé vers la page sécurisée de l&apos;opérateur. La quittance est émise
            automatiquement dès confirmation du paiement.
          </span>
        </div>

        <div className="pt-1 flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300"
          >
            Annuler
          </button>
          <button
            type="button"
            disabled={isProcessing}
            onClick={startPayment}
            className="flex-[2] py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-md transition active:scale-95 disabled:opacity-60"
          >
            {isProcessing ? (
              <span className="inline-flex items-center gap-1.5">
                <Loader2 className="w-4 h-4 animate-spin" />
                Redirection...
              </span>
            ) : (
              "Payer maintenant"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
