"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { formatCurrency } from "@/lib/utils";
import {
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Lock,
} from "lucide-react";

interface VerifiedReceipt {
  receiptNumber: string;
  verificationHash: string;
  issuedAt: string;
  tenantName: string;
  unitNumber: string;
  buildingName: string;
  periodLabel: string;
  amountPaid: number;
  paymentMethod: string;
  provider?: string;
  transactionRef?: string;
  organizationName: string;
  status: string;
}

export default function VerifyReceiptPage() {
  const params = useParams();
  const hash = params.hash as string;

  const [data, setData] = useState<VerifiedReceipt | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!hash) return;
    fetch(`/api/verify/${hash}`)
      .then((res) => res.json())
      .then((res) => {
        if (res.success) {
          setData(res.data);
        } else {
          setError(res.error || "Quittance introuvable ou falsifiée");
        }
      })
      .catch(() => setError("Erreur de connexion au serveur de vérification"))
      .finally(() => setLoading(false));
  }, [hash]);

  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-lg bg-slate-950 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
        {/* Brand */}
        <div className="text-center space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold uppercase tracking-wider">
            <Lock className="w-3.5 h-3.5" />
            <span>Registre Public d&apos;Authenticité & Certification</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white mt-2">
            Vérification d&apos;Authenticité LOUTIGUI
          </h1>
          <p className="text-xs text-slate-400">
            Contrôle d&apos;inviolabilité de quittance de loyer officielle
          </p>
        </div>

        {loading ? (
          <div className="py-12 text-center text-slate-400 text-sm animate-pulse">
            Vérification de l&apos;empreinte cryptographique en cours...
          </div>
        ) : error ? (
          <div className="p-5 rounded-2xl bg-rose-950/60 border border-rose-700 text-rose-200 text-center space-y-2">
            <AlertCircle className="w-10 h-10 text-rose-400 mx-auto" />
            <h3 className="font-extrabold text-base">Document Non Certifié</h3>
            <p className="text-xs text-rose-300">{error}</p>
          </div>
        ) : data ? (
          <div className="space-y-5">
            {/* Success Shield */}
            <div className="p-4 rounded-2xl bg-emerald-950/50 border border-emerald-500/40 text-emerald-200 flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-7 h-7" />
              </div>
              <div>
                <div className="flex items-center gap-1.5 font-extrabold text-sm text-emerald-300">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>DOCUMENT OFFICIEL CONFORME</span>
                </div>
                <p className="text-xs text-emerald-400/80 mt-0.5">
                  Cette quittance a bien été émise et signée numériquement sur la plateforme LOUTIGUI.
                </p>
              </div>
            </div>

            {/* Document Attributes */}
            <div className="divide-y divide-slate-800 bg-slate-900/60 rounded-2xl border border-slate-800 p-4 text-xs space-y-2.5">
              <div className="flex justify-between items-center pb-2">
                <span className="text-slate-400">N° de Quittance :</span>
                <span className="font-mono font-black text-sm text-emerald-400">
                  {data.receiptNumber}
                </span>
              </div>

              <div className="flex justify-between items-center py-2">
                <span className="text-slate-400">Locataire Déclaré :</span>
                <span className="font-bold text-white text-sm">{data.tenantName}</span>
              </div>

              <div className="flex justify-between items-center py-2">
                <span className="text-slate-400">Bien & Résidence :</span>
                <span className="font-semibold text-slate-200">
                  {data.unitNumber} ({data.buildingName})
                </span>
              </div>

              <div className="flex justify-between items-center py-2">
                <span className="text-slate-400">Période Quittancée :</span>
                <span className="font-semibold text-slate-200">{data.periodLabel}</span>
              </div>

              <div className="flex justify-between items-center py-2">
                <span className="text-slate-400">Montant Encaissé :</span>
                <span className="font-black text-emerald-400 text-base">
                  {formatCurrency(data.amountPaid)}
                </span>
              </div>

              <div className="flex justify-between items-center py-2">
                <span className="text-slate-400">Mode de Règlement :</span>
                <span className="font-semibold text-slate-200">
                  {data.paymentMethod} {data.provider ? `(${data.provider})` : ""}
                </span>
              </div>

              <div className="flex justify-between items-center pt-2">
                <span className="text-slate-400">Date d&apos;Émission :</span>
                <span className="font-semibold text-slate-200">
                  {new Date(data.issuedAt).toLocaleString("fr-FR")}
                </span>
              </div>
            </div>

            {/* Cryptographic Footprint */}
            <div className="text-center space-y-1">
              <p className="text-[10px] uppercase font-bold text-slate-500">
                Référence de vérification
              </p>
              <p className="font-mono text-[10px] text-slate-400 bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-800 break-all select-all">
                {data.verificationHash}
              </p>
            </div>
          </div>
        ) : null}

        {/* Footer */}
        <div className="pt-4 border-t border-slate-800 text-center">
          <p className="text-[11px] text-slate-500">
            Plateforme SaaS LOUTIGUI &bull; Conforme à la législation immobilière
          </p>
        </div>
      </div>
    </div>
  );
}
