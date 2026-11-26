"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, XCircle, Clock, ArrowRight, ShieldCheck, RefreshCw } from "lucide-react";

function CallbackContent() {
  const searchParams = useSearchParams();

  const sessionId = searchParams.get("session_id") || searchParams.get("id");
  const plan = searchParams.get("plan") || "PRO";

  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");

  const verifyPayment = async () => {
    if (!sessionId) {
      setLoading(false);
      setSuccess(false);
      setMessage(
        "Session de paiement introuvable. Veuillez relancer votre paiement depuis la page des forfaits."
      );
      return;
    }

    setLoading(true);
    try {
      const url = `/api/subscription/verify?session_id=${encodeURIComponent(sessionId)}&plan=${encodeURIComponent(plan)}`;

      const res = await fetch(url);
      const data = await res.json();

      if (data.success && data.activated) {
        setSuccess(true);
        setMessage(`Votre abonnement LOUTIGUI ${plan} est désormais actif pour 30 jours !`);
      } else if (data.pending) {
        setPending(true);
        setMessage("Paiement en cours de traitement par l'opérateur Mobile Money. Veuillez patienter...");
      } else {
        setSuccess(false);
        setMessage(data.message || data.error || "Le règlement n'a pas pu être validé.");
      }
    } catch (err) {
      setSuccess(false);
      setMessage(err instanceof Error ? err.message : "Erreur de connexion lors de la vérification.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      if (!cancelled) await verifyPayment();
    };
    run();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId, plan]);

  return (
    <div className="max-w-xl mx-auto px-4 py-16">
      <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-xl text-center space-y-6">
        {loading && (
          <div className="space-y-4">
            <RefreshCw className="w-12 h-12 text-primary-600 animate-spin mx-auto" />
            <h2 className="text-xl font-bold text-slate-900">Vérification de votre règlement...</h2>
            <p className="text-xs text-slate-500">
              Interrogation sécurisée des serveurs SasPay et de l&apos;opérateur Mobile Money.
            </p>
          </div>
        )}

        {!loading && success && (
          <div className="space-y-4">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold">
              <ShieldCheck className="w-4 h-4" /> Paiement Confirmé avec Succès
            </div>
            <h2 className="text-2xl font-black text-slate-900">Félicitations !</h2>
            <p className="text-sm text-slate-600">{message}</p>
            <div className="pt-4 flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href="/"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-primary-600 text-white font-bold text-sm shadow-md hover:bg-primary-700 transition"
              >
                Accéder au Tableau de Bord <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/abonnement"
                className="inline-flex items-center justify-center px-4 py-3 rounded-xl border border-slate-200 text-slate-700 font-semibold text-sm hover:bg-slate-50 transition"
              >
                Détails du forfait
              </Link>
            </div>
          </div>
        )}

        {!loading && pending && (
          <div className="space-y-4">
            <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto">
              <Clock className="w-10 h-10" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900">En cours de traitement</h2>
            <p className="text-sm text-slate-600">{message}</p>
            <div className="pt-4">
              <button
                onClick={verifyPayment}
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-amber-600 text-white font-bold text-sm shadow hover:bg-amber-700 transition"
              >
                <RefreshCw className="w-4 h-4" /> Réessayer la vérification
              </button>
            </div>
          </div>
        )}

        {!loading && !success && !pending && (
          <div className="space-y-4">
            <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto">
              <XCircle className="w-10 h-10" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900">Paiement non finalisé</h2>
            <p className="text-sm text-slate-600">{message}</p>
            <div className="pt-4 flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href="/abonnement"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-primary-600 text-white font-bold text-sm shadow hover:bg-primary-700 transition"
              >
                Retourner aux forfaits <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function AbonnementCallbackPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-sm text-slate-500">Chargement...</div>}>
      <CallbackContent />
    </Suspense>
  );
}
