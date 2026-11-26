"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Currency } from "@/types";
import {
  Building2,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  Calendar,
  ArrowRight,
} from "lucide-react";

export default function OnboardingPage() {
  const router = useRouter();
  const { organization, completeOnboarding } = useAuth();

  const [step, setStep] = useState<number>(1);
  const [orgName, setOrgName] = useState(organization?.name || "Mon Patrimoine Immobilier");
  const [countryCode, setCountryCode] = useState(organization?.countryCode || "CI");
  const [defaultCurrency, setDefaultCurrency] = useState<Currency>("XOF");
  const [managementType, setManagementType] = useState<"OWNER" | "AGENCY" | "DIASPORA">("OWNER");
  const [paymentDueDay, setPaymentDueDay] = useState<number>(5);
  const [gracePeriodDays, setGracePeriodDays] = useState<number>(5);
  const [lateFeePercentage, setLateFeePercentage] = useState<number>(5);
  const [startEmpty] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const handleFinish = async () => {
    setIsSubmitting(true);
    try {
      const success = await completeOnboarding({
        orgName,
        countryCode,
        defaultCurrency,
        managementType,
        paymentDueDay,
        gracePeriodDays,
        lateFeePercentage,
        startEmpty,
      });

      if (success) {
        router.push("/");
      }
    } catch {
      console.error("Onboarding error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
        {/* Top Header */}
        <div className="text-center space-y-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold uppercase tracking-wider mb-1">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Configuration de votre Espace</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black">
            Personnalisez vos Règles de Gestion
          </h1>
          <p className="text-xs text-slate-400">
            Étape {step} sur 2 &bull; Répondez à ces questions pour adapter LOUTIGUI à vos besoins
          </p>
        </div>

        {/* Progress bar */}
        <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-300"
            style={{ width: `${(step / 2) * 100}%` }}
          />
        </div>

        {/* Step 1: Profil & Patrimoine */}
        {step === 1 && (
          <div className="space-y-4 animate-in fade-in duration-200 text-xs">
            <h2 className="font-extrabold text-sm text-emerald-400 flex items-center gap-2">
              <Building2 className="w-4 h-4" />
              <span>1. Identité de votre Patrimoine / Agence</span>
            </h2>

            <div>
              <label className="font-bold text-slate-300 block mb-1">
                Nom de votre compte de gestion
              </label>
              <input
                type="text"
                required
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
                placeholder="Ex: Patrimoine Konan ou SCI Résidences Lagune"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-800 bg-slate-950 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-bold text-slate-300 block mb-1">
                  Pays Principal
                </label>
                <select
                  value={countryCode}
                  onChange={(e) => setCountryCode(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-800 bg-slate-950 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="CI">Côte d&apos;Ivoire (FCFA)</option>
                  <option value="SN">Sénégal</option>
                  <option value="BF">Burkina Faso</option>
                  <option value="ML">Mali</option>
                  <option value="TG">Togo</option>
                  <option value="BJ">Bénin</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-300 block mb-1">
                  Devise d&apos;Affichage
                </label>
                <select
                  value={defaultCurrency}
                  onChange={(e) => setDefaultCurrency(e.target.value as Currency)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-800 bg-slate-950 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="XOF">FCFA (XOF)</option>
                  <option value="EUR">Euro (€ - Diaspora)</option>
                  <option value="USD">Dollar ($ - Diaspora)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="font-bold text-slate-300 block mb-1.5">
                Type de gestion principale
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: "OWNER", label: "Mes propres biens", desc: "Bailleur direct" },
                  { id: "DIASPORA", label: "Investisseur Diaspora", desc: "Gestion à distance" },
                  { id: "AGENCY", label: "Gestionnaire / Agence", desc: "Pour des tiers" },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() =>
                      setManagementType(item.id as "OWNER" | "DIASPORA" | "AGENCY")
                    }
                    className={`p-3 rounded-xl border text-center transition ${
                      managementType === item.id
                        ? "border-emerald-500 bg-emerald-500/10 text-emerald-400 font-bold"
                        : "border-slate-800 text-slate-400 hover:bg-slate-800"
                    }`}
                  >
                    <p className="font-bold text-xs">{item.label}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">{item.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-3 flex justify-end">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition"
              >
                <span>Continuer</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Règles Financières */}
        {step === 2 && (
          <div className="space-y-4 animate-in fade-in duration-200 text-xs">
            <h2 className="font-extrabold text-sm text-emerald-400 flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              <span>2. Règles d&apos;Échéance & Délais Légaux</span>
            </h2>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-bold text-slate-300 block mb-1">
                  Jour d&apos;exigibilité mensuel
                </label>
                <div className="flex items-center gap-2">
                  <span className="text-slate-400">Le</span>
                  <input
                    type="number"
                    min={1}
                    max={28}
                    value={paymentDueDay}
                    onChange={(e) => setPaymentDueDay(Number(e.target.value))}
                    className="w-20 px-3 py-2 rounded-xl border border-slate-800 bg-slate-950 text-white text-center font-bold"
                  />
                  <span className="text-slate-400">du mois</span>
                </div>
                <p className="text-[10px] text-slate-400 mt-1">Par défaut : le 5 de chaque mois</p>
              </div>

              <div>
                <label className="font-bold text-slate-300 block mb-1">
                  Délai de grâce légal (jours)
                </label>
                <input
                  type="number"
                  min={0}
                  max={15}
                  value={gracePeriodDays}
                  onChange={(e) => setGracePeriodDays(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-800 bg-slate-950 text-white font-bold"
                />
                <p className="text-[10px] text-slate-400 mt-1">Avant déclaration de retard formel</p>
              </div>
            </div>

            <div>
              <label className="font-bold text-slate-300 block mb-1">
                Pénalité de retard légale (%)
              </label>
              <input
                type="number"
                min={0}
                max={20}
                value={lateFeePercentage}
                onChange={(e) => setLateFeePercentage(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl border border-slate-800 bg-slate-950 text-white font-bold"
              />
              <p className="text-[10px] text-slate-400 mt-1">
                Appliqué automatiquement au solde en cas de défaut persistant
              </p>
            </div>

            <div className="pt-3 flex justify-between">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="flex items-center gap-1 px-4 py-2 rounded-xl border border-slate-800 text-slate-300 hover:bg-slate-800 font-bold text-xs transition"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Retour</span>
              </button>

              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleFinish}
                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs shadow-xl transition active:scale-95"
              >
                {isSubmitting ? (
                  <span>Initialisation de votre espace...</span>
                ) : (
                  <>
                    <span>Accéder à mon Application</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
