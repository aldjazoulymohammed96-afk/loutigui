"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { UserRole } from "@/types";
import {
  Building2,
  ArrowRight,
  AlertCircle,
} from "lucide-react";

export default function SignupPage() {
  const router = useRouter();
  const { register } = useAuth();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("+225 ");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<UserRole>("OWNER");
  const [profile, setProfile] = useState<"OWNER" | "DIASPORA" | "AGENCY">("OWNER");
  const [startEmpty, setStartEmpty] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const result = await register({
        name,
        phone,
        email,
        password,
        role,
        startEmpty,
      });

      if (result.ok) {
        // Redirect to configuration onboarding questionnaire
        router.push("/onboarding");
      } else {
        setError(result.error || "Une erreur est survenue lors de l'inscription.");
      }
    } catch {
      setError("Erreur de connexion au serveur.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
        {/* Brand */}
        <div className="text-center space-y-1">
          <Link href="/" className="inline-flex items-center gap-2 mb-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center text-white shadow-md">
              <Building2 className="w-5 h-5" />
            </div>
            <span className="font-extrabold text-2xl tracking-tight text-white">LOUTIGUI</span>
          </Link>
          <h1 className="text-xl font-bold text-white">Créer votre Compte Gratuit</h1>
          <p className="text-xs text-slate-400">
            Rejoignez les meilleurs gestionnaires et propriétaires d&apos;Afrique
          </p>
        </div>

        {error && (
          <div className="p-3.5 rounded-xl bg-rose-950/60 border border-rose-800 flex items-start gap-2.5 text-rose-200 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="font-bold text-slate-300 block mb-1">
              Nom et Prénom ou Raison Sociale
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Kouamé Konan ou Cabinet Immo Horizon"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-800 bg-slate-950 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-slate-300 block mb-1">
                Numéro WhatsApp (avec indicatif)
              </label>
              <input
                type="text"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+2250700000000"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-800 bg-slate-950 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="font-bold text-slate-300 block mb-1">
                Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="contact@domaine.ci"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-800 bg-slate-950 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="font-bold text-slate-300 block mb-1">
              Mot de passe
            </label>
            <input
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="8 caractères minimum, avec chiffre"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-800 bg-slate-950 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Profile Role Selector */}
          <div>
            <label className="font-bold text-slate-300 block mb-1.5">
              Votre Profil de Gestion
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => {
                  setProfile("OWNER");
                  setRole("OWNER");
                }}
                className={`p-2.5 rounded-xl border text-center transition ${
                  profile === "OWNER"
                    ? "border-emerald-500 bg-emerald-500/10 text-emerald-400 font-bold"
                    : "border-slate-800 text-slate-400 hover:bg-slate-800"
                }`}
              >
                <p className="font-bold text-xs">Propriétaire</p>
                <p className="text-[10px] text-slate-400">Gère en direct</p>
              </button>

              <button
                type="button"
                onClick={() => {
                  setProfile("DIASPORA");
                  setRole("OWNER");
                }}
                className={`p-2.5 rounded-xl border text-center transition ${
                  profile === "DIASPORA"
                    ? "border-emerald-500 bg-emerald-500/10 text-emerald-400 font-bold"
                    : "border-slate-800 text-slate-400 hover:bg-slate-800"
                }`}
              >
                <p className="font-bold text-xs">Diaspora</p>
                <p className="text-[10px] text-slate-400">À l&apos;étranger</p>
              </button>

              <button
                type="button"
                onClick={() => {
                  setProfile("AGENCY");
                  setRole("AGENCY_ADMIN");
                }}
                className={`p-2.5 rounded-xl border text-center transition ${
                  profile === "AGENCY"
                    ? "border-emerald-500 bg-emerald-500/10 text-emerald-400 font-bold"
                    : "border-slate-800 text-slate-400 hover:bg-slate-800"
                }`}
              >
                <p className="font-bold text-xs">Agence</p>
                <p className="text-[10px] text-slate-400">Gestion de tiers</p>
              </button>
            </div>
          </div>

          {/* Clean App Option */}
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
            <label className="flex items-start gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={startEmpty}
                onChange={(e) => setStartEmpty(e.target.checked)}
                className="w-4 h-4 mt-0.5 text-emerald-500 rounded focus:ring-emerald-500"
              />
              <div>
                <p className="font-bold text-white text-xs">
                  Commencer avec une application 100% vierge
                </p>
                <p className="text-[11px] text-slate-400 leading-tight">
                  Aucune donnée factice. Vous remplirez vos biens et locataires manuellement et progressivement.
                </p>
              </div>
            </label>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-sm shadow-xl shadow-emerald-500/25 transition active:scale-95"
          >
            {isLoading ? (
              <span>Création du compte...</span>
            ) : (
              <>
                <span>Créer mon Compte & Configurer</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <p className="text-center text-xs text-slate-400">
          Vous avez déjà un compte ?{" "}
          <Link href="/login" className="text-emerald-400 hover:underline font-bold">
            Se connecter
          </Link>
        </p>
      </div>
    </div>
  );
}
