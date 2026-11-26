"use client";

import React, { useState } from "react";
import { Check, ShieldCheck, Lock, Loader2, ArrowRight } from "lucide-react";
import { SubscriptionInfo, SubscriptionPlanType } from "@/types";
import { useApp } from "@/context/AppContext";
import { useApiQuery } from "@/lib/api-client";

interface PlanItem {
  id: SubscriptionPlanType;
  name: string;
  price: string;
  period: string;
  desc: string;
  features: string[];
  recommended?: boolean;
}

const PLANS: PlanItem[] = [
  {
    id: "STARTER",
    name: "Starter",
    price: "10 000 FCFA",
    period: "/ mois",
    desc: "Idéal pour les bailleurs particuliers gérant jusqu'à 10 lots.",
    features: [
      "Jusqu'à 10 lots gérés",
      "Encaissement Mobile Money",
      "Quittances certifiées avec QR Code",
      "Suivi des impayés & alertes",
    ],
  },
  {
    id: "PRO",
    name: "Pro",
    price: "25 000 FCFA",
    period: "/ mois",
    desc: "Recommandé pour les propriétaires exigeants et petits gestionnaires.",
    features: [
      "Jusqu'à 35 lots gérés",
      "Tout le forfait Starter inclus",
      "Relances WhatsApp automatiques",
      "Générateur de baux de location conformes",
      "Gestion des tickets & pannes",
    ],
    recommended: true,
  },
  {
    id: "AGENCE",
    name: "Agence",
    price: "50 000 FCFA",
    period: "/ mois",
    desc: "Pour les agences immobilières et cabinets de gestion structurés.",
    features: [
      "Lots et immeubles illimités",
      "Accès multi-utilisateurs & agents",
      "Rapports financiers & exports Excel",
      "Rapprochement bancaire & Mobile Money",
      "Support prioritaire dédié",
    ],
  },
];

export default function SubscriptionPaywallModal() {
  const { refreshTrigger } = useApp();
  const { data: subInfo, isLoading } = useApiQuery<SubscriptionInfo | null>(
    "subscription-status",
    "/api/subscription/status",
    {
      select: (json) =>
        (json as { subscription?: SubscriptionInfo }).subscription ?? null,
      refreshKey: refreshTrigger,
    }
  );
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlanType>("PRO");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (isLoading || !subInfo || subInfo.status !== "EXPIRED") {
    return null;
  }

  const handleCheckout = async (planId: SubscriptionPlanType) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/subscription/create-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: planId }),
      });

      const data = await res.json();
      if (data.success && data.checkoutUrl) {
        // Redirect to SasPay checkout page
        window.location.href = data.checkoutUrl;
      } else {
        setError(data.error || "Impossible d'initier la session de paiement.");
        setLoading(false);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur de connexion.");
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-8">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-primary-950 to-slate-900 text-white p-6 sm:p-8 text-center relative overflow-hidden">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-semibold uppercase tracking-wider mb-3">
            <Lock className="w-3.5 h-3.5" /> Période d&apos;essai terminée
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Continuez à piloter votre patrimoine sans interruption
          </h2>
          <p className="mt-2 text-sm text-slate-300 max-w-2xl mx-auto">
            Vos 7 jours d&apos;essai gratuit sont arrivés à échéance. Choisissez un forfait pour débloquer l&apos;accès immédiat à vos quittances certifiées et votre gestion locative.
          </p>

          {/* Payment Badges */}
          <div className="mt-5 flex flex-wrap items-center justify-center gap-2 text-xs text-slate-300">
            <span>Paiement sécurisé via SasPay par :</span>
            <span className="px-2 py-0.5 rounded bg-white/10 font-medium text-white">Wave</span>
            <span className="px-2 py-0.5 rounded bg-white/10 font-medium text-white">Orange Money</span>
            <span className="px-2 py-0.5 rounded bg-white/10 font-medium text-white">MTN Money</span>
            <span className="px-2 py-0.5 rounded bg-white/10 font-medium text-white">Moov Money</span>
          </div>
        </div>

        {/* Plan Cards */}
        <div className="p-6 sm:p-8">
          {error && (
            <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {PLANS.map((plan) => {
              const isSelected = selectedPlan === plan.id;
              return (
                <div
                  key={plan.id}
                  onClick={() => setSelectedPlan(plan.id)}
                  className={`cursor-pointer rounded-xl p-5 border-2 transition-all relative flex flex-col justify-between ${
                    isSelected
                      ? "border-primary-600 bg-primary-50/30 shadow-lg scale-[1.02]"
                      : "border-slate-200 hover:border-slate-300 bg-white"
                  }`}
                >
                  {plan.recommended && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 bg-primary-600 text-white rounded-full text-[11px] font-bold tracking-wide shadow-sm">
                      Recommandé
                    </span>
                  )}

                  <div>
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold text-slate-900 text-lg">{plan.name}</h3>
                      <div
                        className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                          isSelected
                            ? "border-primary-600 bg-primary-600 text-white"
                            : "border-slate-300"
                        }`}
                      >
                        {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </div>
                    </div>

                    <div className="mt-3 flex items-baseline gap-1">
                      <span className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                        {plan.price}
                      </span>
                      <span className="text-xs text-slate-500 font-medium">{plan.period}</span>
                    </div>

                    <p className="mt-2 text-xs text-slate-600 leading-relaxed">{plan.desc}</p>

                    <ul className="mt-4 space-y-2 border-t border-slate-100 pt-4 text-xs text-slate-700">
                      {plan.features.map((feat, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <Check className="w-4 h-4 text-primary-600 flex-shrink-0 mt-0.5" />
                          <span>{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <button
                    type="button"
                    disabled={loading}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCheckout(plan.id);
                    }}
                    className={`mt-6 w-full py-2.5 px-4 rounded-xl font-bold text-xs sm:text-sm transition flex items-center justify-center gap-2 ${
                      isSelected
                        ? "bg-primary-600 hover:bg-primary-700 text-white shadow-md shadow-primary-600/20"
                        : "bg-slate-100 hover:bg-slate-200 text-slate-800"
                    }`}
                  >
                    {loading && selectedPlan === plan.id ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Connexion SasPay...
                      </>
                    ) : (
                      <>
                        Payer avec SasPay <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              );
            })}
          </div>

          {/* Footer */}
          <div className="mt-8 pt-6 border-t border-slate-100 flex items-center justify-center gap-2 text-xs text-slate-500">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Passerelle SasPay certifiée • Chiffrement SSL 256 bits</span>
          </div>
        </div>
      </div>
    </div>
  );
}
