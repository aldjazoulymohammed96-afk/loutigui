"use client";

import React, { useState } from "react";
import { useApp } from "@/context/AppContext";
import {
  Sparkles,
  CheckCircle2,
  ChevronRight,
  CreditCard,
  X,
} from "lucide-react";

export function OnboardingWizard({
  isOpen,
  onClose,
  onOpenEncaissement,
}: {
  isOpen: boolean;
  onClose: () => void;
  onOpenEncaissement: () => void;
}) {
  const { showToast, triggerRefresh } = useApp();
  const [step, setStep] = useState<number>(1);
  const [bldName, setBldName] = useState("Résidence La Paix");
  const [bldCity] = useState("Abidjan");
  const [bldNeighborhood, setBldNeighborhood] = useState("Cocody Angré");
  const [unitNumber, setUnitNumber] = useState("Appartement 202");
  const [rentAmount, setRentAmount] = useState(250000);
  const [tenantName, setTenantName] = useState("Moussa Koné");
  const [tenantPhone, setTenantPhone] = useState("+2250700112233");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleCreateStep2 = async () => {
    setIsSubmitting(true);
    try {
      // 1. Create building
      const bRes = await fetch("/api/properties", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create_building",
          name: bldName,
          city: bldCity,
          neighborhood: bldNeighborhood,
          address: `${bldNeighborhood}, Abidjan`,
          country: "Côte d'Ivoire",
          totalUnits: 1,
        }),
      });
      const bData = await bRes.json();
      const bldId = bData.data.id;

      // 2. Create unit
      const uRes = await fetch("/api/properties", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create_unit",
          buildingId: bldId,
          buildingName: bldName,
          unitNumber,
          type: "APARTMENT",
          surfaceM2: 75,
          roomsCount: 3,
          rentAmount: Number(rentAmount),
          chargesAmount: 20000,
          depositAmount: Number(rentAmount) * 2,
          status: "OCCUPIED",
        }),
      });
      const uData = await uRes.json();
      const unitId = uData.data.id;

      // 3. Create tenant
      const [firstName, ...rest] = tenantName.split(" ");
      const lastName = rest.join(" ") || "Client";
      const tRes = await fetch("/api/tenants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName,
          lastName,
          phone: tenantPhone,
          identityType: "CNI",
          identityNumber: "CI009944112",
        }),
      });
      const tData = await tRes.json();
      const tenantId = tData.data.id;

      // 4. Create lease (automatically creates the first installment)
      await fetch("/api/leases", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          unitId,
          tenantId,
          leaseType: "RESIDENTIAL",
          startDate: new Date().toISOString().split("T")[0],
          rentAmount: Number(rentAmount),
          chargesAmount: 20000,
          depositAmount: Number(rentAmount) * 2,
        }),
      });

      showToast("Premier bien et locataire créés avec succès !", "success");
      triggerRefresh();
      setStep(3);
    } catch {
      showToast("Erreur lors de la configuration initiale", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
        {/* Top Header */}
        <div className="p-6 bg-gradient-to-br from-emerald-600 to-teal-800 text-white flex justify-between items-start">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="w-5 h-5 text-amber-300" />
              <span className="text-xs font-bold uppercase tracking-wider bg-white/20 px-2 py-0.5 rounded-full">
                Prise en main express (&lt; 10 min)
              </span>
            </div>
            <h2 className="text-xl font-extrabold">Bienvenue sur LOUTIGUI</h2>
            <p className="text-xs text-emerald-100 mt-1">
              Configurez votre premier lot et générez votre première quittance en 3 clics.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Wizard Steps indicator */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 px-6 py-3 bg-slate-50 dark:bg-slate-800/40 text-xs">
          <div className={`flex items-center gap-1.5 font-bold ${step >= 1 ? "text-emerald-600" : "text-slate-400"}`}>
            <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center text-[10px]">1</span>
            <span>Présentation</span>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-300 mx-2" />
          <div className={`flex items-center gap-1.5 font-bold ${step >= 2 ? "text-emerald-600" : "text-slate-400"}`}>
            <span className="w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-[10px]">2</span>
            <span>Premier Bien</span>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-300 mx-2" />
          <div className={`flex items-center gap-1.5 font-bold ${step >= 3 ? "text-emerald-600" : "text-slate-400"}`}>
            <span className="w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-[10px]">3</span>
            <span>1ère Quittance</span>
          </div>
        </div>

        {/* Content depending on step */}
        <div className="p-6">
          {step === 1 && (
            <div className="space-y-4">
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                LOUTIGUI est le système d&apos;exploitation moderne de la gestion locative en Côte d&apos;Ivoire et en Afrique.
              </p>
              <div className="space-y-2.5">
                <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white">Encaissement Mobile Money & Espèces</h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">Rapprochement Wave, Orange Money et espèces avec règle des 3 touches.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white">Quittances avec QR Code Certifié</h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">Émission instantanée, transmission WhatsApp en un clic et vérification publique.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white">Relances Automatisées Multi-Canal</h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">WhatsApp Business et SMS avec escalade progressive des rappels.</p>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setStep(2)}
                className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs py-3 rounded-xl shadow-md transition"
              >
                <span>Démarrer la configuration</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                Ajout de votre premier bien & locataire
              </h3>
              <div className="space-y-3 text-xs">
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300">Nom de la Résidence / Immeuble</label>
                  <input
                    type="text"
                    value={bldName}
                    onChange={(e) => setBldName(e.target.value)}
                    className="w-full mt-1 px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="font-semibold text-slate-700 dark:text-slate-300">Quartier (Abidjan)</label>
                    <input
                      type="text"
                      value={bldNeighborhood}
                      onChange={(e) => setBldNeighborhood(e.target.value)}
                      className="w-full mt-1 px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-slate-700 dark:text-slate-300">Désignation du Lot</label>
                    <input
                      type="text"
                      value={unitNumber}
                      onChange={(e) => setUnitNumber(e.target.value)}
                      className="w-full mt-1 px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    />
                  </div>
                </div>
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300">Loyer Mensuel (FCFA)</label>
                  <input
                    type="number"
                    value={rentAmount}
                    onChange={(e) => setRentAmount(Number(e.target.value))}
                    step={5000}
                    className="w-full mt-1 px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="font-semibold text-slate-700 dark:text-slate-300">Nom du Locataire</label>
                    <input
                      type="text"
                      value={tenantName}
                      onChange={(e) => setTenantName(e.target.value)}
                      className="w-full mt-1 px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-slate-700 dark:text-slate-300">Téléphone (WhatsApp)</label>
                    <input
                      type="text"
                      value={tenantPhone}
                      onChange={(e) => setTenantPhone(e.target.value)}
                      className="w-full mt-1 px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    />
                  </div>
                </div>
              </div>

              <button
                onClick={handleCreateStep2}
                disabled={isSubmitting}
                className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs py-3 rounded-xl shadow-md transition"
              >
                <span>{isSubmitting ? "Création en cours..." : "Créer le Bien & le Contrat"}</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4 text-center py-2">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <div>
                <h3 className="font-black text-lg text-slate-900 dark:text-white">
                  Félicitations ! Votre lot est actif.
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
                  Le contrat et l&apos;échéancier ont été générés automatiquement pour {tenantName}.
                </p>
              </div>
              <div className="pt-2 flex flex-col gap-2">
                <button
                  onClick={() => {
                    onClose();
                    onOpenEncaissement();
                  }}
                  className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white font-extrabold text-xs py-3.5 rounded-xl shadow-lg transition"
                >
                  <CreditCard className="w-4 h-4" />
                  <span>Encaisser le premier loyer maintenant</span>
                </button>
                <button
                  onClick={onClose}
                  className="text-xs text-slate-500 hover:text-slate-800 dark:hover:text-white py-1"
                >
                  Aller au Tableau de Bord
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
