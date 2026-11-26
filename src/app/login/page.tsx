"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
  Building2,
  Lock,
  Phone,
  Mail,
  ArrowRight,
  AlertCircle,
} from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const { login, isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!isAuthLoading && isAuthenticated) {
      router.replace("/");
    }
  }, [isAuthLoading, isAuthenticated, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const success = await login(identifier, password);
      if (success) {
        router.push("/");
      } else {
        setError("Identifiant ou mot de passe incorrect.");
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
        {/* Brand */}
        <div className="text-center space-y-1">
          <Link href="/" className="inline-flex items-center gap-2 mb-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center text-white shadow-md">
              <Building2 className="w-5 h-5" />
            </div>
            <span className="font-extrabold text-2xl tracking-tight text-white">LOUTIGUI</span>
          </Link>
          <h1 className="text-xl font-bold text-white">Connexion à votre Espace</h1>
          <p className="text-xs text-slate-400">
            Gestion locative, encaissements et quittances sécurisées
          </p>
        </div>

        {error ? <div className="p-3.5 rounded-xl bg-rose-950/60 border border-rose-800 flex items-start gap-2.5 text-rose-200 text-xs"><AlertCircle className="w-4 h-4 shrink-0 mt-0.5" /><span>{error}</span></div> : null}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="font-bold text-slate-300 block mb-1">
              Numéro de Téléphone (WhatsApp) ou Email
            </label>
            <div className="relative">
              <input
                type="text"
                required
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="+2250700000000 ou email@domaine.ci"
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-800 bg-slate-950 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500">
                {identifier.includes("@") ? <Mail className="w-4 h-4" /> : <Phone className="w-4 h-4" />}
              </div>
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="font-bold text-slate-300">Mot de passe</label>
              <Link href="/forgot-password" className="text-emerald-400 hover:underline">
                Mot de passe oublié ?
              </Link>
            </div>
            <div className="relative">
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Votre mot de passe"
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-800 bg-slate-950 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-sm shadow-lg shadow-emerald-500/20 transition active:scale-95"
          >
            {isLoading ? <span>Connexion en cours...</span> : <span>Se Connecter</span>}
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <p className="text-center text-xs text-slate-400">
          Pas encore de compte ?{" "}
          <Link href="/signup" className="text-emerald-400 hover:underline font-bold">
            S&apos;inscrire gratuitement
          </Link>
        </p>
      </div>
    </div>
  );
}
