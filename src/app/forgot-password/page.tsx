"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Building2, Mail, ArrowRight, AlertCircle, CheckCircle2 } from "lucide-react";

export default function ForgotPasswordPage() {
  const [identifier, setIdentifier] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setMessage(data.message);
      } else {
        setError(data.error || "Impossible de traiter la demande.");
      }
    } catch {
      setError("Erreur de connexion au serveur.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
        <div className="text-center space-y-1">
          <Link href="/" className="inline-flex items-center gap-2 mb-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center text-white shadow-md">
              <Building2 className="w-5 h-5" />
            </div>
            <span className="font-extrabold text-2xl tracking-tight text-white">LOUTIGUI</span>
          </Link>
          <h1 className="text-xl font-bold text-white">Mot de passe oublié</h1>
          <p className="text-xs text-slate-400">
            Saisissez l&apos;email ou le téléphone de votre compte. Si un email est associé, un lien de
            réinitialisation valable une heure vous sera envoyé.
          </p>
        </div>

        {message && (
          <div className="p-3.5 rounded-xl bg-emerald-950/60 border border-emerald-800 flex items-start gap-2.5 text-emerald-200 text-xs">
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{message}</span>
          </div>
        )}
        {error && (
          <div className="p-3.5 rounded-xl bg-rose-950/60 border border-rose-800 flex items-start gap-2.5 text-rose-200 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="font-bold text-slate-300 block mb-1">Email ou téléphone</label>
            <div className="relative">
              <input
                type="text"
                required
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="email@domaine.ci ou +2250700000000"
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-800 bg-slate-950 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-sm shadow-lg shadow-emerald-500/20 transition active:scale-95 disabled:opacity-60"
          >
            {isLoading ? "Envoi en cours..." : "Envoyer le lien"}
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <p className="text-center text-xs text-slate-400">
          <Link href="/login" className="text-emerald-400 hover:underline font-bold">
            Retour à la connexion
          </Link>
        </p>
      </div>
    </div>
  );
}
