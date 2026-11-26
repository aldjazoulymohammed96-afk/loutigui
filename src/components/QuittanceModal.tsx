"use client";

import React, { useEffect, useState } from "react";
import { Organization, Receipt } from "@/types";
import { formatCurrency, numberToWordsFrench } from "@/lib/utils";
import { generateQrCodeDataUrl } from "@/lib/qr-generator";
import { useApp } from "@/context/AppContext";
import { useApiQuery } from "@/lib/api-client";
import {
  X,
  Printer,
  Share2,
  CheckCircle2,
  ShieldCheck,
} from "lucide-react";

interface QuittanceModalProps {
  receipt: Receipt | null;
  onClose: () => void;
}

export function QuittanceModal({ receipt, onClose }: QuittanceModalProps) {
  const { refreshTrigger } = useApp();
  const { data: org } = useApiQuery<Organization | null>(
    "organization",
    "/api/organization",
    { refreshKey: refreshTrigger }
  );
  const [qrCodeUrl, setQrCodeUrl] = useState<string>("");

  useEffect(() => {
    if (receipt) {
      const publicVerifyUrl = `${window.location.origin}/verify/${receipt.verificationHash}`;
      generateQrCodeDataUrl(publicVerifyUrl).then(setQrCodeUrl);
    }
  }, [receipt]);

  if (!receipt) return null;

  const isEnglish = org?.settings?.receiptLanguage === "en";
  const showQrCode = org?.settings?.showQrCode ?? true;
  const legalFooter = org?.settings?.receiptFooter?.trim();

  const handlePrint = () => {
    window.print();
  };

  const handleWhatsAppShare = () => {
    const publicVerifyUrl = `${window.location.origin}/verify/${receipt.verificationHash}`;
    const text = encodeURIComponent(
      `Bonjour ${receipt.tenantName},\n\nVoici votre Quittance de Loyer Officielle LOUTIGUI N° ${receipt.receiptNumber} pour la période de ${receipt.periodLabel}.\n\nMontant réglé : ${formatCurrency(receipt.amountPaid)}\nBien : ${receipt.unitNumber} (${receipt.buildingName})\n\nVous pouvez consulter et certifier ce document en ligne ici :\n${publicVerifyUrl}\n\nMerci de votre confiance !`
    );
    window.open(`https://wa.me/${receipt.tenantPhone.replace(/[^0-9]/g, "")}?text=${text}`, "_blank");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white text-slate-900 rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Top Actions (no-print) */}
        <div className="no-print flex items-center justify-between px-6 py-4 bg-slate-900 text-white border-b border-slate-800">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <span className="font-bold text-sm">Quittance Numérique Certifiée</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleWhatsAppShare}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition shadow-sm"
              title="Transmettre directement sur WhatsApp au locataire"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>WhatsApp</span>
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-white text-xs font-bold transition"
              title="Imprimer ou enregistrer en PDF"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Imprimer / PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Official Receipt Body */}
        <div className="p-8 space-y-6 bg-white font-sans text-slate-800 printable-receipt">
          {/* Official Document Header */}
          <div className="flex items-start justify-between border-b-2 border-emerald-700 pb-5">
            <div>
              <div className="flex items-center gap-2">
                {org?.logoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={org.logoUrl}
                    alt={`Logo ${org.name}`}
                    className="w-8 h-8 rounded-lg object-contain border border-slate-200"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-lg bg-emerald-700 flex items-center justify-center text-white font-extrabold text-sm">
                    LT
                  </div>
                )}
                <h1 className="text-xl font-black tracking-wider text-emerald-900 uppercase">
                  {receipt.organizationName}
                </h1>
              </div>
              <p className="text-xs text-slate-500 mt-1">{receipt.organizationAddress}</p>
              <p className="text-xs text-slate-500">Tél: {receipt.organizationPhone}</p>
            </div>

            <div className="text-right">
              <span className="inline-block px-3 py-1 rounded bg-emerald-100 text-emerald-900 font-extrabold text-xs uppercase tracking-wide">
                {isEnglish ? "Rent Receipt" : "Quittance de Loyer"}
              </span>
              <p className="text-xs font-mono font-bold text-slate-700 mt-1">
                N° : <span className="text-emerald-800">{receipt.receiptNumber}</span>
              </p>
              <p className="text-[11px] text-slate-500">
                Émise le : {new Date(receipt.issuedAt).toLocaleDateString("fr-FR")}
              </p>
            </div>
          </div>

          {/* Parties involved */}
          <div className="grid grid-cols-2 gap-6 p-4 rounded-xl bg-slate-50 border border-slate-200">
            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                Bailleur / Gestionnaire
              </p>
              <p className="font-bold text-sm text-slate-800">{receipt.organizationName}</p>
              <p className="text-xs text-slate-600">Représentant légal mandaté</p>
            </div>
            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                Locataire Titulaire
              </p>
              <p className="font-bold text-sm text-slate-800">{receipt.tenantName}</p>
              <p className="text-xs text-slate-600">Contact : {receipt.tenantPhone}</p>
            </div>
          </div>

          {/* Rented Object Details */}
          <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-1 text-xs">
            <p className="font-bold text-slate-500 uppercase tracking-wider text-[11px]">
              {isEnglish ? "Leased Property" : "Désignation du Bien Loué"}
            </p>
            <div className="flex justify-between items-center text-sm pt-1">
              <span className="font-semibold text-slate-800">{receipt.unitNumber}</span>
              <span className="text-slate-600">{receipt.buildingName}</span>
            </div>
            <p className="text-xs text-slate-500">
              {isEnglish ? "Period" : "Période concernée"} :{" "}
              <strong className="text-slate-800 font-semibold">{receipt.periodLabel}</strong>
            </p>
          </div>

          {/* Breakdown Table */}
          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <table className="w-full text-xs">
              <thead className="bg-slate-100 text-slate-700 border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-4 text-left font-bold uppercase tracking-wider">
                    {isEnglish ? "Description" : "Désignation"}
                  </th>
                  <th className="py-2.5 px-4 text-right font-bold uppercase tracking-wider">
                    {isEnglish ? "Amount" : "Montant"}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <tr>
                  <td className="py-2.5 px-4 text-slate-700">
                    {isEnglish ? "Monthly rent" : "Loyer mensuel principal"}
                  </td>
                  <td className="py-2.5 px-4 text-right font-semibold text-slate-800">
                    {formatCurrency(receipt.rentAmount)}
                  </td>
                </tr>
                <tr>
                  <td className="py-2.5 px-4 text-slate-700">
                    {isEnglish ? "Flat service charges" : "Charges locatives forfaitaires"}
                  </td>
                  <td className="py-2.5 px-4 text-right font-semibold text-slate-800">
                    {formatCurrency(receipt.chargesAmount)}
                  </td>
                </tr>
                <tr className="bg-emerald-50/60 font-bold text-emerald-950">
                  <td className="py-3 px-4 text-sm font-extrabold">
                    {isEnglish ? "TOTAL PAID" : "TOTAL VERSÉ (RÈGLEMENT REÇU)"}
                  </td>
                  <td className="py-3 px-4 text-right text-sm font-extrabold text-emerald-800">
                    {formatCurrency(receipt.amountPaid)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Legal declaration in words */}
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs leading-relaxed text-slate-700">
            <p>
              Je soussigné, gestionnaire du bien susmentionné, déclare avoir reçu de{" "}
              <strong>{receipt.tenantName}</strong> la somme de :
            </p>
            <p className="font-extrabold text-emerald-900 text-sm mt-1 uppercase">
              {numberToWordsFrench(receipt.amountPaid)}
            </p>
            <p className="text-[11px] text-slate-500 mt-1">
              Mode de paiement : <strong>{receipt.paymentMethod} {receipt.provider ? `(${receipt.provider})` : ""}</strong>
              {receipt.transactionRef && <> &bull; Réf: <span className="font-mono">{receipt.transactionRef}</span></>}
            </p>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Solde restant dû pour cette période :{" "}
              <strong className={receipt.remainingDue > 0 ? "text-amber-700" : "text-emerald-700"}>
                {formatCurrency(receipt.remainingDue)}
              </strong>
            </p>
          </div>

          {/* Footer with Seal & QR Code */}
          <div className="flex items-center justify-between pt-3 border-t border-slate-200">
            {/* Dynamic Verification QR */}
            <div className="flex items-center gap-3">
              {showQrCode && qrCodeUrl && (
                // Data URL générée localement : next/image ne s'applique pas.
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={qrCodeUrl}
                  alt="QR Code d'authenticité"
                  className="w-20 h-20 border border-slate-300 rounded-lg p-0.5"
                />
              )}
              <div className="space-y-0.5">
                <div className="flex items-center gap-1 text-emerald-800 font-extrabold text-xs">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{isEnglish ? "OFFICIAL VERIFIED DOCUMENT" : "DOCUMENT OFFICIEL VÉRIFIÉ"}</span>
                </div>
                <p className="text-[10px] text-slate-500 max-w-[200px] leading-tight">
                  {showQrCode
                    ? isEnglish
                      ? "Scan this QR code to verify this receipt on the LOUTIGUI public registry."
                      : "Scannez ce QR code pour certifier l'authenticité de cette quittance sur le registre public LOUTIGUI."
                    : isEnglish
                      ? "Verify this receipt with its hash on the LOUTIGUI public registry."
                      : "Vérifiez cette quittance avec son hash sur le registre public LOUTIGUI."}
                </p>
                <p className="text-[9px] font-mono text-slate-400">
                  Hash: {receipt.verificationHash.slice(0, 16)}...
                </p>
              </div>
            </div>

            {/* Electronic Stamp & Seal */}
            <div className="text-right">
              <div className="inline-block p-2.5 border-2 border-emerald-700 rounded-lg bg-emerald-50/50 text-emerald-900 text-center transform -rotate-1">
                <p className="text-[9px] font-black uppercase tracking-wider">CERTIFIÉ CONFORME</p>
                <p className="text-[10px] font-bold">LOUTIGUI DIGITAL TRUST</p>
                <p className="text-[8px] text-emerald-700 font-mono">
                  {new Date(receipt.issuedAt).toISOString().split("T")[0]}
                </p>
              </div>
            </div>
          </div>

          {legalFooter && (
            <p className="mt-3 pt-2 border-t border-slate-200 text-[10px] text-slate-500 italic leading-relaxed">
              {legalFooter}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
