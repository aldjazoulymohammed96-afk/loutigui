"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { AuthThemeToggle } from "@/components/AuthThemeToggle";
import { UserRole } from "@/types";
import {
  Building2,
  ArrowRight,
  AlertCircle,
} from "lucide-react";

const inputClass =
  "w-full rounded-xl border border-[var(--lp-border)] bg-[var(--lp-bg-inset)] px-3.5 py-2.5 text-[var(--lp-text)] placeholder:text-[var(--lp-text-subtle)] focus:outline-none focus:ring-2 focus:ring-emerald-500";

const labelClass = "mb-1 block font-bold text-[var(--lp-text)]";

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

  const profileButton = (
    value: "OWNER" | "DIASPORA" | "AGENCY",
    nextRole: UserRole,
    title: string,
    subtitle: string
  ) => {
    const active = profile === value;
    return (
      <button
        type="button"
        onClick={() => {
          setProfile(value);
          setRole(nextRole);
        }}
        className={`rounded-xl border p-2.5 text-center transition ${
          active
            ? "border-[var(--lp-accent-solid)] bg-[var(--lp-accent-soft)] font-bold text-[var(--lp-accent-text)]"
            : "border-[var(--lp-border)] text-[var(--lp-text-muted)] hover:bg-[var(--lp-hover-bg)]"
        }`}
      >
        <p className="text-xs font-bold">{title}</p>
        <p className="text-[10px] text-[var(--lp-text-subtle)]">{subtitle}</p>
      </button>
    );
  };

  return (
    <div className="auth-page relative flex min-h-screen flex-col items-center justify-center bg-[var(--lp-bg)] p-4 text-[var(--lp-text)]">
      <AuthThemeToggle />
      <div className="w-full max-w-lg space-y-6 rounded-3xl border border-[var(--lp-border)] bg-[var(--lp-bg-elevated)] p-6 shadow-[var(--lp-window-shadow)] sm:p-8">
        {/* Brand */}
        <div className="space-y-1 text-center">
          <Link href="/" className="mb-2 inline-flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 text-white shadow-md">
              <Building2 className="h-5 w-5" />
            </div>
            <span className="text-2xl font-extrabold tracking-tight text-[var(--lp-text)]">
              LOUTIGUI
            </span>
          </Link>
          <h1 className="text-xl font-bold text-[var(--lp-text)]">
            Créer votre Compte Gratuit
          </h1>
          <p className="text-xs text-[var(--lp-text-muted)]">
            Rejoignez les meilleurs gestionnaires et propriétaires d&apos;Afrique
          </p>
        </div>

        {error && (
          <div className="flex items-start gap-2.5 rounded-xl border border-[var(--lp-error-border)] bg-[var(--lp-error-bg)] p-3.5 text-xs text-[var(--lp-error-text)]">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className={labelClass}>Nom et Prénom ou Raison Sociale</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Kouamé Konan ou Cabinet Immo Horizon"
              className={inputClass}
            />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className={labelClass}>Numéro WhatsApp (avec indicatif)</label>
              <input
                type="text"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+2250700000000"
                className={inputClass}
              />
            </div>

            <div>
              <label className={labelClass}>Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="contact@domaine.ci"
                className={inputClass}
              />
            </div>
          </div>

          <div>
            <label className={labelClass}>Mot de passe</label>
            <input
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="8 caractères minimum, avec chiffre"
              className={inputClass}
            />
          </div>

          {/* Profile Role Selector */}
          <div>
            <label className="mb-1.5 block font-bold text-[var(--lp-text)]">
              Votre Profil de Gestion
            </label>
            <div className="grid grid-cols-3 gap-2">
              {profileButton("OWNER", "OWNER", "Propriétaire", "Gère en direct")}
              {profileButton("DIASPORA", "OWNER", "Diaspora", "À l'étranger")}
              {profileButton("AGENCY", "AGENCY_ADMIN", "Agence", "Gestion de tiers")}
            </div>
          </div>

          {/* Clean App Option */}
          <div className="space-y-1 rounded-xl border border-[var(--lp-border)] bg-[var(--lp-bg-inset)] p-3">
            <label className="flex cursor-pointer items-start gap-2.5">
              <input
                type="checkbox"
                checked={startEmpty}
                onChange={(e) => setStartEmpty(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded text-emerald-500 focus:ring-emerald-500"
              />
              <div>
                <p className="text-xs font-bold text-[var(--lp-text)]">
                  Commencer avec une application 100% vierge
                </p>
                <p className="text-[11px] leading-tight text-[var(--lp-text-muted)]">
                  Aucune donnée factice. Vous remplirez vos biens et locataires manuellement et
                  progressivement.
                </p>
              </div>
            </label>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--lp-accent-gradient)] py-3.5 text-sm font-extrabold text-[var(--lp-accent-on)] shadow-[var(--lp-accent-shadow)] transition hover:opacity-90 active:scale-95 disabled:opacity-60"
          >
            {isLoading ? (
              <span>Création du compte...</span>
            ) : (
              <>
                <span>Créer mon Compte &amp; Configurer</span>
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </form>

        <p className="text-center text-xs text-[var(--lp-text-muted)]">
          Vous avez déjà un compte ?{" "}
          <Link
            href="/login"
            className="font-bold text-[var(--lp-accent-text)] hover:underline"
          >
            Se connecter
          </Link>
        </p>
      </div>
    </div>
  );
}
