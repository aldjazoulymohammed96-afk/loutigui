"use client";

import React from "react";
import { Lease, Tenant, Unit, Organization } from "@/types";
import { formatCurrency, numberToWordsFrench } from "@/lib/utils";
import { X, Printer, ShieldCheck } from "lucide-react";

interface ContratBailModalProps {
  lease: Lease;
  tenant: Tenant;
  unit: Unit;
  organization: Organization;
  onClose: () => void;
}

export function ContratBailModal({
  lease,
  tenant,
  unit,
  organization,
  onClose,
}: ContratBailModalProps) {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-white text-slate-900 rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Top Actions (no-print) */}
        <div className="no-print flex items-center justify-between px-6 py-4 bg-slate-900 text-white border-b border-slate-800">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <span className="font-bold text-sm">Contrat de Bail Conforme à la Législation</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition shadow-sm"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Imprimer / Exporter PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Official Contract Body */}
        <div className="p-8 sm:p-12 space-y-6 bg-white font-serif text-slate-800 text-xs leading-relaxed printable-receipt">
          {/* Header */}
          <div className="text-center border-b-2 border-slate-900 pb-5 space-y-1">
            <p className="text-[10px] uppercase font-bold tracking-widest text-slate-500">
              RÉPUBLIQUE DE CÔTE D&apos;IVOIRE
            </p>
            <h1 className="text-xl sm:text-2xl font-black uppercase tracking-wider text-slate-900 font-sans">
              CONTRAT DE BAIL À USAGE D&apos;HABITATION
            </h1>
            <p className="text-[11px] text-slate-600 italic">
              Conforme à la Loi n° 2019-576 du 26 juin 2019 portant Code de la Construction et de l&apos;Habitat
            </p>
          </div>

          {/* Section 1: Parties */}
          <div className="space-y-3">
            <h2 className="font-sans font-bold text-xs uppercase tracking-wider text-emerald-900 bg-emerald-50 p-1.5 rounded">
              ENTRE LES SOUSSIGNÉS :
            </h2>
            <div className="pl-3 space-y-2">
              <p>
                <strong>LE BAILLEUR (ou son représentant mandaté) :</strong><br />
                <strong>{organization.name}</strong>, domicilié à {organization.address}.<br />
                Téléphone : {organization.phone} &bull; Email : {organization.email}
              </p>
              <p className="italic text-slate-500 text-right">D&apos;une part,</p>
              <p>
                <strong>ET LE PRENEUR (LOCATAIRE) :</strong><br />
                M./Mme <strong>{tenant.firstName} {tenant.lastName}</strong>, titulaire de la pièce d&apos;identité{" "}
                <strong>{tenant.identityType} N° {tenant.identityNumber}</strong>.<br />
                Profession : {tenant.profession || "Non spécifiée"} (Employeur : {tenant.employer || "Non spécifié"}).<br />
                Téléphone : {tenant.phone}
              </p>
              <p className="italic text-slate-500 text-right">D&apos;autre part.</p>
            </div>
          </div>

          {/* Section 2: Objet & Destination */}
          <div className="space-y-2">
            <h2 className="font-sans font-bold text-xs uppercase tracking-wider text-emerald-900 bg-emerald-50 p-1.5 rounded">
              ARTICLE 1 – DÉSIGNATION DES LIEUX ET DESTINATION
            </h2>
            <p className="pl-3">
              Le Bailleur donne en location au Preneur le bien suivant :<br />
              <strong>Lot / Unité :</strong> {unit.unitNumber} &bull; <strong>Résidence :</strong> {unit.buildingName}<br />
              <strong>Consistance :</strong> {unit.roomsCount} pièces principales, surface approximative de {unit.surfaceM2} m².<br />
              <strong>Compteurs :</strong> Électricité (CIE) : {unit.electricityMeter || "En cours"} &bull; Eau (SODECI) : {unit.waterMeter || "En cours"}.<br />
              Les locaux sont destinés exclusivement à l&apos;usage d&apos;habitation paisible par le Preneur et sa famille.
            </p>
          </div>

          {/* Section 3: Durée */}
          <div className="space-y-2">
            <h2 className="font-sans font-bold text-xs uppercase tracking-wider text-emerald-900 bg-emerald-50 p-1.5 rounded">
              ARTICLE 2 – DURÉE DU BAIL
            </h2>
            <p className="pl-3">
              Le présent contrat prend effet à compter du <strong>{lease.startDate}</strong> pour une durée ferme d&apos;une (1) année, renouvelable par tacite reconduction sauf préavis écrit de trois (3) mois notifié par l&apos;une ou l&apos;autre des parties.
            </p>
          </div>

          {/* Section 4: Loyer & Charges */}
          <div className="space-y-2">
            <h2 className="font-sans font-bold text-xs uppercase tracking-wider text-emerald-900 bg-emerald-50 p-1.5 rounded">
              ARTICLE 3 – CONDITIONS FINANCIÈRES & MODALITÉS DE RÈGLEMENT
            </h2>
            <div className="pl-3 space-y-1.5">
              <p>
                Le loyer mensuel est fixé à la somme de :<br />
                <strong>{formatCurrency(lease.rentAmount)}</strong> hors charges (soit <em>{numberToWordsFrench(lease.rentAmount)}</em>).<br />
                Charges locatives forfaitaires : <strong>{formatCurrency(lease.chargesAmount)}</strong>.<br />
                <strong>TOTAL MENSUEL EXIGIBLE : {formatCurrency(lease.rentAmount + lease.chargesAmount)}</strong>.
              </p>
              <p>
                Le loyer est payable d&apos;avance au plus tard le <strong>{lease.paymentDueDay}</strong> de chaque mois par Mobile Money (Wave, Orange Money), virement bancaire ou espèces contre quittance officielle délivrée par le système LOUTIGUI.
              </p>
              <p>
                Tout retard de paiement au-delà d&apos;un délai de grâce de {lease.gracePeriodDays} jours entraînera l&apos;application de plein droit d&apos;une pénalité de retard de {lease.lateFeePercentage}%.
              </p>
            </div>
          </div>

          {/* Section 5: Dépôt de garantie */}
          <div className="space-y-2">
            <h2 className="font-sans font-bold text-xs uppercase tracking-wider text-emerald-900 bg-emerald-50 p-1.5 rounded">
              ARTICLE 4 – DÉPÔT DE GARANTIE (CAUTION)
            </h2>
            <p className="pl-3">
              À titre de garantie de l&apos;exécution de ses obligations, le Preneur verse ce jour la somme de{" "}
              <strong>{formatCurrency(lease.depositAmount)}</strong>, correspondant à deux (2) mois de loyer hors charges, conformément au plafond légal en vigueur en Côte d&apos;Ivoire. Ce montant sera restitué en fin de bail après état des lieux de sortie contradictoire et déduction des réparations locatives éventuelles.
            </p>
          </div>

          {/* Signatures */}
          <div className="pt-8 border-t border-slate-300 grid grid-cols-2 gap-8 text-center">
            <div>
              <p className="font-sans font-bold text-xs uppercase">POUR LE BAILLEUR</p>
              <p className="text-[10px] text-slate-500 italic mt-0.5">Signature & Cachet de l&apos;Agence</p>
              <div className="h-24 flex items-center justify-center">
                <div className="p-2 border border-emerald-600 rounded text-emerald-800 text-[10px] font-bold uppercase transform -rotate-1">
                  LOUTIGUI GESTION IMMOBILIÈRE<br />
                  APPROUVÉ & SIGNÉ ÉLECTRONIQUEMENT
                </div>
              </div>
            </div>

            <div>
              <p className="font-sans font-bold text-xs uppercase">POUR LE PRENEUR (LOCATAIRE)</p>
              <p className="text-[10px] text-slate-500 italic mt-0.5">Signature précédée de la mention &quot;Lu et approuvé&quot;</p>
              <div className="h-24 flex items-center justify-center">
                <p className="text-[11px] font-serif italic text-slate-400">
                  {tenant.firstName} {tenant.lastName}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
