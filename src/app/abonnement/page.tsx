"use client";

import React, { useState } from "react";
import Image from "next/image";
import {
  Check,
  ShieldCheck,
  Clock,
  AlertTriangle,
  Loader2,
  ArrowRight,
  CreditCard,
} from "lucide-react";
import { SubscriptionInfo, SubscriptionPlanType } from "@/types";
import { useApiQuery } from "@/lib/api-client";

interface PlanConfig {
  id: SubscriptionPlanType;
  name: string;
  price: string;
  period: string;
  badge?: string;
  description: string;
  features: string[];
  highlight?: boolean;
}

const PLANS: PlanConfig[] = [
  {
    id: "STARTER",
    name: "Starter",
    price: "10 000 FCFA",
    period: "/ mois",
    description: "Parfait pour les bailleurs particuliers gérant jusqu'à 10 logements.",
    features: [
      "Jusqu'à 10 lots gérés",
      "Encaissement Mobile Money (Orange, Wave, MTN, Moov)",
      "Quittances certifiées avec QR Code d'authenticité",
      "Calcul des retards & pénalités d'échéances",
      "Support par WhatsApp en direct",
    ],
  },
  {
    id: "PRO",
    name: "Pro",
    price: "25 000 FCFA",
    period: "/ mois",
    badge: "Le plus populaire",
    highlight: true,
    description: "Pour les propriétaires exigeants et gestionnaires semi-professionnels.",
    features: [
      "Jusqu'à 35 lots gérés",
      "Tout le forfait Starter inclus",
      "Relances WhatsApp automatiques programmées",
      "Générateur de baux de location conformes",
      "Gestion des tickets d'incidents & artisans",
      "Assistance prioritaire 7j/7",
    ],
  },
  {
    id: "AGENCE",
    name: "Agence",
    price: "50 000 FCFA",
    period: "/ mois",
    badge: "Agences & Cabinets",
    description: "Pour les agences immobilières et cabinets de gestion de parcs étendus.",
    features: [
      "Lots et immeubles illimités",
      "Accès multi-utilisateurs & agents de terrain",
      "Rapports financiers détaillés & exports Excel",
      "Rapprochement bancaire et Mobile Money automatisé",
      "Gestionnaire de compte dédié",
    ],
  },
];

export default function AbonnementPage() {
  const { data: subInfo } = useApiQuery<SubscriptionInfo | null>(
    "subscription-status",
    "/api/subscription/status",
    { select: (json) => (json as { subscription?: SubscriptionInfo }).subscription ?? null }
  );
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handlePay = async (planId: SubscriptionPlanType) => {
    setCheckoutLoading(planId);
    setError(null);
    try {
      const res = await fetch("/api/subscription/create-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: planId }),
      });

      const data = await res.json();
      if (data.success && data.checkoutUrl) {
        window.location.assign(data.checkoutUrl);
      } else {
        setError(data.error || "Impossible d'initier le paiement SasPay.");
        setCheckoutLoading(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur de connexion.");
      setCheckoutLoading(null);
    }
  };

  return (
    <div className="space-y-8">
        {/* Status Card */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-slate-900">Gestion de l&apos;Abonnement</h1>
                {subInfo?.status === "ACTIVE" && (
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5" /> Forfait {subInfo.plan} Actif
                  </span>
                )}
                {subInfo?.status === "TRIAL" && (
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" /> Période d&apos;essai ({subInfo.daysRemaining}j restants)
                  </span>
                )}
                {subInfo?.status === "EXPIRED" && (
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-200 flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5" /> Essai Expiré
                  </span>
                )}
              </div>
              <p className="mt-2 text-sm text-slate-600 max-w-2xl">
                {subInfo?.status === "ACTIVE"
                  ? `Votre abonnement LOUTIGUI ${subInfo.plan} est actif. Vous avez accès à l'ensemble des fonctionnalités associées.`
                  : subInfo?.status === "TRIAL"
                  ? `Vous êtes actuellement dans vos 7 jours d'essai gratuit. Il vous reste ${subInfo?.daysRemaining} jour(s) pour tester toutes les fonctionnalités sans engagement.`
                  : "Votre période d'essai gratuit de 7 jours est arrivée à échéance. Veuillez activer l'un des forfaits ci-dessous pour débloquer votre accès."}
              </p>
            </div>

            {/* Payment security info */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex items-center gap-4 text-xs text-slate-600">
              <div className="w-10 h-10 rounded-lg bg-primary-100 text-primary-600 flex items-center justify-center flex-shrink-0">
                <CreditCard className="w-5 h-5" />
              </div>
              <div>
                <div className="font-semibold text-slate-900">SasPay Passerelle Sécurisée</div>
                <div>Orange Money • Wave • MTN • Moov</div>
              </div>
            </div>
          </div>
        </div>

        {error && (
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm">
            {error}
          </div>
        )}

        {/* Payment Methods Banner */}
        <div className="bg-slate-900 text-white rounded-2xl p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-md">
          <div className="space-y-1 text-center md:text-left">
            <h2 className="text-lg font-bold">Paiement 100% Mobile Money en Côte d&apos;Ivoire</h2>
            <p className="text-xs text-slate-300">
              Réglez votre abonnement en 3 touches avec votre compte habituel sans carte bancaire requise.
            </p>
          </div>
          <div className="flex items-center gap-3 bg-white/10 p-2 rounded-xl backdrop-blur-sm">
            <div className="relative w-12 h-8 rounded-lg overflow-hidden border border-white/20 bg-white">
              <Image
                src="/images/payments/orange-money.png"
                alt="Orange Money"
                fill
                className="object-contain p-1"
              />
            </div>
            <div className="relative w-12 h-8 rounded-lg overflow-hidden border border-white/20 bg-white">
              <Image
                src="/images/payments/wave.png"
                alt="Wave"
                fill
                className="object-contain p-1"
              />
            </div>
            <div className="relative w-12 h-8 rounded-lg overflow-hidden border border-white/20 bg-white">
              <Image
                src="/images/payments/mtn-money.png"
                alt="MTN Money"
                fill
                className="object-contain p-1"
              />
            </div>
            <div className="relative w-12 h-8 rounded-lg overflow-hidden border border-white/20 bg-white">
              <Image
                src="/images/payments/moov-money.png"
                alt="Moov Money"
                fill
                className="object-contain p-1"
              />
            </div>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {PLANS.map((plan) => {
            const isCurrent = subInfo?.status === "ACTIVE" && subInfo.plan === plan.id;
            return (
              <div
                key={plan.id}
                className={`bg-white rounded-2xl border transition-all duration-300 flex flex-col justify-between relative overflow-hidden ${
                  plan.highlight
                    ? "border-primary-600 shadow-xl shadow-primary-500/10 scale-[1.02]"
                    : "border-slate-200 hover:border-slate-300 shadow-sm"
                }`}
              >
                {plan.badge && (
                  <div className="bg-primary-600 text-white text-center py-1 text-xs font-bold uppercase tracking-wider">
                    {plan.badge}
                  </div>
                )}

                <div className="p-6 sm:p-8 space-y-6">
                  <div>
                    <h3 className="text-xl font-bold text-slate-900">{plan.name}</h3>
                    <p className="mt-1 text-xs text-slate-500 min-h-[32px]">{plan.description}</p>
                  </div>

                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl sm:text-4xl font-extrabold text-slate-900">
                      {plan.price}
                    </span>
                    <span className="text-xs text-slate-500 font-medium">{plan.period}</span>
                  </div>

                  <ul className="space-y-3 border-t border-slate-100 pt-6 text-xs sm:text-sm text-slate-700">
                    {plan.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-2.5">
                        <Check className="w-4 h-4 text-primary-600 flex-shrink-0 mt-0.5" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="p-6 sm:p-8 bg-slate-50/50 border-t border-slate-100">
                  <button
                    type="button"
                    disabled={checkoutLoading !== null}
                    onClick={() => handlePay(plan.id)}
                    className={`w-full py-3 px-4 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 shadow-sm ${
                      plan.highlight
                        ? "bg-primary-600 hover:bg-primary-700 text-white shadow-primary-600/25"
                        : "bg-slate-900 hover:bg-slate-800 text-white"
                    }`}
                  >
                    {checkoutLoading === plan.id ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Ouverture SasPay...
                      </>
                    ) : isCurrent ? (
                      <>Renouveler ce forfait</>
                    ) : (
                      <>
                        Choisir {plan.name} <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                  <p className="mt-2 text-center text-[11px] text-slate-500">
                    Paiement mensuel sans engagement • SasPay
                  </p>
                </div>
              </div>
            );
          })}
        </div>
    </div>
  );
}
