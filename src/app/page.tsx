"use client";

import React, { useState } from "react";
import Link from "next/link";
import { DashboardStats, Installment, Receipt } from "@/types";
import { useApp } from "@/context/AppContext";
import { useAuth } from "@/context/AuthContext";
import { formatCurrency } from "@/lib/utils";
import { fetchQueryData, useApiQuery } from "@/lib/api-client";
import {
  TrendingUp,
  AlertTriangle,
  Building,
  Users,
  CheckCircle2,
  CreditCard,
  MessageSquare,
  FileCheck2,
  PlusCircle,
  ExternalLink,
  ChevronRight,
} from "lucide-react";
import {
  LazyEncaissementModal as EncaissementModal,
  LazyQuittanceModal as QuittanceModal,
  LazyRelanceModal as RelanceModal,
  LazyOnboardingWizard as OnboardingWizard,
} from "@/components/LazyModals";

export default function DashboardPage() {
  const { currency, refreshTrigger } = useApp();
  const { organization } = useAuth();
  const { data: stats } = useApiQuery<DashboardStats>(
    `dashboard-stats?currency=${currency}`,
    `/api/dashboard/stats?currency=${currency}`,
    { refreshKey: refreshTrigger }
  );

  // Modal states
  const [encaissementInstallment, setEncaissementInstallment] = useState<Installment | null>(null);
  const [isEncaissementOpen, setIsEncaissementOpen] = useState(false);
  const [relanceInstallment, setRelanceInstallment] = useState<Installment | null>(null);
  const [isRelanceOpen, setIsRelanceOpen] = useState(false);
  const [viewReceipt, setViewReceipt] = useState<Receipt | null>(null);
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);

  const handleOpenReceiptForPayment = async (receiptId?: string) => {
    if (!receiptId) return;
    try {
      const receipt = await fetchQueryData<Receipt>(
        `receipt-${receiptId}`,
        `/api/receipts/${receiptId}`
      );
      setViewReceipt(receipt);
    } catch {}
  };

  // If the app has 0 units and 0 tenants configured yet
  if (stats && stats.totalUnits === 0 && stats.activeTenantsCount === 0) {
    return (
      <div className="space-y-6">
        {/* Welcome Banner */}
        <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-emerald-800 via-teal-900 to-slate-900 text-white shadow-xl space-y-3">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold uppercase tracking-wider border border-emerald-500/30">
              Prêt &bull; Remplissage Manuel
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black">
            Bienvenue dans votre espace {organization?.name || "LOUTIGUI"} !
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
            Suivez ces 4 étapes pour enregistrer vos premiers biens, vos locataires et commencer à encaisser à votre rythme.
          </p>
        </div>

        {/* 4-Step Progressive Manual Walkthrough */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Step 1: Add Property */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border-2 border-emerald-500 shadow-sm flex flex-col justify-between space-y-4">
            <div className="space-y-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 font-black flex items-center justify-center text-sm">
                1
              </div>
              <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
                Ajouter mon Premier Bien
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Créez votre première villa, immeuble ou lot (ex: Appartement à Cocody ou boutique).
              </p>
            </div>
            <Link
              href="/patrimoine"
              className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Créer un Bien</span>
            </Link>
          </div>

          {/* Step 2: Add Tenant */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between space-y-4">
            <div className="space-y-2">
              <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-black flex items-center justify-center text-sm">
                2
              </div>
              <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
                Créer une Fiche Locataire
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Enregistrez le nom, numéro WhatsApp et pièce d&apos;identité de votre occupant.
              </p>
            </div>
            <Link
              href="/locataires"
              className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs transition"
            >
              <span>Ajouter Locataire</span>
            </Link>
          </div>

          {/* Step 3: Fast Wizard */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between space-y-4">
            <div className="space-y-2">
              <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-black flex items-center justify-center text-sm">
                3
              </div>
              <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
                Assistant 5 Minutes
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Utilisez le guide pas-à-pas pour associer en un clic un bien, un locataire et son premier loyer.
              </p>
            </div>
            <button
              onClick={() => setIsOnboardingOpen(true)}
              className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 font-bold text-xs transition"
            >
              <span>Lancer le Guide</span>
            </button>
          </div>

          {/* Step 4: First Receipt */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between space-y-4">
            <div className="space-y-2">
              <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-black flex items-center justify-center text-sm">
                4
              </div>
              <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
                Émettre la 1ère Quittance
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Validez le premier versement par Wave, Orange ou espèces et partagez la quittance QR Code.
              </p>
            </div>
            <div className="py-2.5 text-center text-xs text-slate-400 font-semibold">
              Actif dès le premier bail
            </div>
          </div>
        </div>

        <OnboardingWizard
          isOpen={isOnboardingOpen}
          onClose={() => setIsOnboardingOpen(false)}
          onOpenEncaissement={() => {
            setEncaissementInstallment(null);
            setIsEncaissementOpen(true);
          }}
        />
      </div>
    );
  }

  // Regular Dashboard with Active Data
  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 p-5 rounded-2xl bg-gradient-to-r from-emerald-800 via-teal-900 to-slate-900 text-white shadow-xl shadow-emerald-950/20">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-extrabold uppercase tracking-wide border border-emerald-500/30">
              Espace Gestionnaire &bull; {organization?.name || "Abidjan CI"}
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black mt-1">
            Tableau de Bord Financier – {stats?.currentMonthLabel || "Novembre 2026"}
          </h1>
          <p className="text-xs text-slate-300 mt-0.5">
            Suivi temps réel des encaissements, relances et quittances certifiées avec QR Code.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsOnboardingOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition border border-white/20"
          >
            <span>Guide Rapide</span>
          </button>
          <button
            onClick={() => {
              setEncaissementInstallment(null);
              setIsEncaissementOpen(true);
            }}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-extrabold shadow-md transition active:scale-95"
          >
            <CreditCard className="w-3.5 h-3.5" />
            <span>Encaisser un loyer</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Loyers Encaissés */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-start mb-2">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Loyers Encaissés
              </span>
              <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl font-black text-slate-900 dark:text-white">
              {stats ? formatCurrency(stats.collectedRent, currency) : formatCurrency(0, currency)}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Sur {stats ? formatCurrency(stats.expectedRent, currency) : formatCurrency(0, currency)} attendus
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
            <div className="flex justify-between items-center text-xs mb-1 font-semibold">
              <span className="text-slate-600 dark:text-slate-400">Taux de Recouvrement</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-extrabold">
                {stats?.collectionRate ?? 0}%
              </span>
            </div>
            <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all duration-500"
                style={{ width: `${Math.min(100, stats?.collectionRate ?? 0)}%` }}
              />
            </div>
          </div>
        </div>

        {/* 2. Loyers Impayés */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-start mb-2">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Impayés & Retards
              </span>
              <div className="w-8 h-8 rounded-lg bg-rose-100 dark:bg-rose-950 text-rose-600 dark:text-rose-400 flex items-center justify-center">
                <AlertTriangle className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl font-black text-rose-600 dark:text-rose-400">
              {stats ? formatCurrency(stats.overdueRent, currency) : formatCurrency(0, currency)}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {stats?.urgentOverdues.length ?? 0} dossier(s) en attente de règlement
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-600 dark:text-rose-400">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" />
              Action recommandée : relance WhatsApp
            </span>
          </div>
        </div>

        {/* 3. Taux d'Occupation */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-start mb-2">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Occupation Patrimoine
              </span>
              <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                <Building className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl font-black text-slate-900 dark:text-white">
              {stats?.occupancyRate ?? 0}%
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {stats?.occupiedUnits ?? 0} lots occupés sur {stats?.totalUnits ?? 0}
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
              {stats ? stats.totalUnits - stats.occupiedUnits : 0} lot(s) disponible(s) à louer
            </span>
          </div>
        </div>

        {/* 4. Locataires Actifs & Incidents */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-start mb-2">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Locataires & Tickets
              </span>
              <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                <Users className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl font-black text-slate-900 dark:text-white">
              {stats?.activeTenantsCount ?? 0} Locataires
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Tous rattachés à des baux certifiés
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center text-xs">
            <span className="text-slate-500 dark:text-slate-400">Maintenance en cours</span>
            <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 font-bold text-[11px]">
              {stats?.pendingTicketsCount ?? 0} ticket(s)
            </span>
          </div>
        </div>
      </div>

      {/* Main Grid: Urgent Overdues + Recent Receipts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 spans): Urgent Overdues & Actions */}
        <div className="lg:col-span-2 space-y-6">
          {/* Overdues Alert Card */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-rose-500" />
                <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                  Échéances en Souffrance & Retards ({stats?.urgentOverdues.length || 0})
                </h3>
              </div>
              <span className="text-xs text-slate-500">Règle des 3 touches : Encaisser / Relancer</span>
            </div>

            {stats?.urgentOverdues && stats.urgentOverdues.length > 0 ? (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {stats.urgentOverdues.map((inst) => (
                  <div
                    key={inst.id}
                    className="py-3.5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/40 px-2 rounded-xl transition"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-slate-900 dark:text-white">
                          {inst.tenantName}
                        </span>
                        <span
                          className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                            inst.status === "OVERDUE"
                              ? "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300"
                              : "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                          }`}
                        >
                          {inst.status === "OVERDUE" ? "En Retard" : "Paiement Partiel"}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        {inst.unitNumber} &bull; {inst.buildingName} &bull; Échéance : {inst.dueDate}
                      </p>
                    </div>

                    <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
                      <div className="text-left sm:text-right">
                        <p className="text-xs text-slate-400">Reste à payer</p>
                        <p className="font-black text-sm text-rose-600 dark:text-rose-400">
                          {formatCurrency(inst.remainingDue, currency)}
                        </p>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => {
                            setRelanceInstallment(inst);
                            setIsRelanceOpen(true);
                          }}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-300 text-xs font-bold transition"
                          title="Envoyer une relance WhatsApp ou SMS"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                          <span>Relancer</span>
                        </button>

                        <button
                          onClick={() => {
                            setEncaissementInstallment(inst);
                            setIsEncaissementOpen(true);
                          }}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition active:scale-95"
                          title="Encaisser immédiatement"
                        >
                          <CreditCard className="w-3.5 h-3.5" />
                          <span>Encaisser</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center text-slate-400">
                <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
                <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                  Tous les loyers de la période sont à jour !
                </p>
                <p className="text-xs text-slate-500">Aucun impayé constaté.</p>
              </div>
            )}
          </div>

          {/* Aging Balance Overview */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
            <h3 className="font-extrabold text-sm text-slate-900 dark:text-white uppercase tracking-wider">
              Balance Âgée des Impayés
            </h3>
            <div className="grid grid-cols-4 gap-2 text-center">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                <span className="text-[10px] font-bold text-slate-500 uppercase">0 - 30 Jours</span>
                <p className="font-black text-sm text-rose-600 dark:text-rose-400 mt-1">
                  {stats ? formatCurrency(stats.agingBalance.under30Days, currency) : formatCurrency(0, currency)}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                <span className="text-[10px] font-bold text-slate-500 uppercase">30 - 60 Jours</span>
                <p className="font-black text-sm text-slate-400 mt-1">0 FCFA</p>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                <span className="text-[10px] font-bold text-slate-500 uppercase">60 - 90 Jours</span>
                <p className="font-black text-sm text-slate-400 mt-1">0 FCFA</p>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                <span className="text-[10px] font-bold text-slate-500 uppercase">&gt; 90 Jours</span>
                <p className="font-black text-sm text-slate-400 mt-1">0 FCFA</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column (1 span): Recent Quittances & Mobile Money Feed */}
        <div className="space-y-6">
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <FileCheck2 className="w-5 h-5 text-emerald-600" />
                <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                  Derniers Règlements
                </h3>
              </div>
              <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                Quittances QR
              </span>
            </div>

            <div className="space-y-3">
              {stats?.recentPayments && stats.recentPayments.length > 0 ? (
                stats.recentPayments.map((pay) => (
                  <div
                    key={pay.id}
                    className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 hover:border-emerald-300 transition"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-extrabold text-slate-900 dark:text-white">
                            {formatCurrency(pay.amount, currency)}
                          </span>
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                            {pay.provider || pay.paymentMethod}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                          Réf : {pay.receiptNumber || pay.externalTransactionRef}
                        </p>
                      </div>

                      {pay.receiptId && (
                        <button
                          onClick={() => handleOpenReceiptForPayment(pay.receiptId)}
                          className="flex items-center gap-1 text-[11px] font-bold text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 underline"
                        >
                          <span>Voir Quittance</span>
                          <ExternalLink className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-400 text-center py-4">Aucun paiement récent.</p>
              )}
            </div>

            <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
              <Link
                href="/quittances"
                className="w-full flex items-center justify-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline py-1"
              >
                <span>Accéder au registre complet des quittances</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* Quick Property & Tenant Shortcuts */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
              <span className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <Building className="w-4 h-4 text-emerald-600" />
                <span>État du Parc Immobilier</span>
              </span>
              <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                {stats?.totalUnits || 0} lot{(stats?.totalUnits || 0) > 1 ? "s" : ""}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                <span className="text-[10px] text-slate-400 block font-bold uppercase">Lots Occupés</span>
                <span className="text-base font-extrabold text-emerald-600 dark:text-emerald-400">
                  {stats?.occupiedUnits || 0}
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                <span className="text-[10px] text-slate-400 block font-bold uppercase">Lots Vacants</span>
                <span className="text-base font-extrabold text-amber-600 dark:text-amber-400">
                  {stats ? stats.totalUnits - stats.occupiedUnits : 0}
                </span>
              </div>
            </div>

            <div className="pt-2 flex flex-col gap-2">
              <Link
                href="/patrimoine"
                className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 font-bold text-xs hover:bg-emerald-100 transition"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>Gérer les Biens & Lots</span>
              </Link>
              <Link
                href="/locataires"
                className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                <Users className="w-3.5 h-3.5 text-slate-500" />
                <span>Gérer les Locataires ({stats?.activeTenantsCount || 0})</span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      {isEncaissementOpen && (
        <EncaissementModal
          initialInstallment={encaissementInstallment}
          onClose={() => {
            setIsEncaissementOpen(false);
            setEncaissementInstallment(null);
          }}
          onSuccess={(rcpt) => {
            setIsEncaissementOpen(false);
            setEncaissementInstallment(null);
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

      <OnboardingWizard
        isOpen={isOnboardingOpen}
        onClose={() => setIsOnboardingOpen(false)}
        onOpenEncaissement={() => {
          setEncaissementInstallment(null);
          setIsEncaissementOpen(true);
        }}
      />
    </div>
  );
}
