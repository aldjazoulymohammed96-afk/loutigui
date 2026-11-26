"use client";

import React from "react";
import Link from "next/link";
import { Sparkles, AlertTriangle, ShieldCheck, ArrowRight, Clock } from "lucide-react";
import { SubscriptionInfo } from "@/types";
import { useApp } from "@/context/AppContext";
import { useApiQuery } from "@/lib/api-client";

export default function TrialBanner() {
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

  if (isLoading || !subInfo) return null;

  // Active paid plan: subtle discreet status
  if (subInfo.status === "ACTIVE") {
    return (
      <div className="bg-emerald-500/10 border-b border-emerald-500/20 px-4 py-2 text-xs flex items-center justify-between text-emerald-800">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>
            Abonnement <strong>LOUTIGUI {subInfo.plan}</strong> actif • {subInfo.daysRemaining} jour(s) restant(s)
          </span>
        </div>
        <Link
          href="/abonnement"
          className="text-emerald-700 hover:text-emerald-900 font-semibold underline text-xs"
        >
          Gérer l&apos;abonnement
        </Link>
      </div>
    );
  }

  // Expired: prominent warning
  if (subInfo.status === "EXPIRED" || subInfo.isExpired) {
    return (
      <div className="bg-rose-500/15 border-b border-rose-500/30 px-4 py-2.5 text-xs text-rose-900 flex items-center justify-between animate-pulse">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0" />
          <span className="font-semibold">
            Votre période d&apos;essai de 7 jours est expirée. Veuillez activer votre abonnement pour continuer à gérer vos biens.
          </span>
        </div>
        <Link
          href="/abonnement"
          className="inline-flex items-center gap-1.5 px-3 py-1 bg-rose-600 text-white rounded-lg font-bold text-xs shadow-sm hover:bg-rose-700 transition"
        >
          Activer maintenant <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    );
  }

  // Active 7-day Trial
  const isUrgent = subInfo.daysRemaining <= 2;

  return (
    <div
      className={`border-b px-4 py-2 text-xs flex items-center justify-between transition ${
        isUrgent
          ? "bg-amber-500/15 border-amber-500/30 text-amber-900"
          : "bg-primary-500/10 border-primary-500/20 text-primary-900"
      }`}
    >
      <div className="flex items-center gap-2">
        {isUrgent ? (
          <Clock className="w-4 h-4 text-amber-600 flex-shrink-0 animate-bounce" />
        ) : (
          <Sparkles className="w-4 h-4 text-primary-600 flex-shrink-0" />
        )}
        <span>
          Période d&apos;essai gratuit : <strong>{subInfo.daysRemaining} jour(s) restant(s)</strong> sur vos 7 jours
          offerts.
        </span>
      </div>
      <div className="flex items-center gap-3">
        <Link
          href="/abonnement"
          className={`inline-flex items-center gap-1 px-3 py-1 rounded-lg font-semibold text-xs shadow-sm transition ${
            isUrgent
              ? "bg-amber-600 hover:bg-amber-700 text-white"
              : "bg-primary-600 hover:bg-primary-700 text-white"
          }`}
        >
          Choisir mon forfait <ArrowRight className="w-3 h-3" />
        </Link>
      </div>
    </div>
  );
}
