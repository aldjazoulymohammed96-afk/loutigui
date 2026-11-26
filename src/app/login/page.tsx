"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { AuthThemeToggle } from "@/components/AuthThemeToggle";
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
    <div className="auth-page relative flex min-h-screen flex-col items-center justify-center bg-[var(--lp-bg)] p-4 text-[var(--lp-text)]">
      <AuthThemeToggle />
      <div className="w-full max-w-md space-y-6 rounded-3xl border border-[var(--lp-border)] bg-[var(--lp-bg-elevated)] p-6 shadow-[var(--lp-window-shadow)] sm:p-8">
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
            Connexion à votre Espace
          </h1>
          <p className="text-xs text-[var(--lp-text-muted)]">
            Gestion locative, encaissements et quittances sécurisées
          </p>
        </div>

        {error ? (
          <div className="flex items-start gap-2.5 rounded-xl border border-[var(--lp-error-border)] bg-[var(--lp-error-bg)] p-3.5 text-xs text-[var(--lp-error-text)]">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        ) : null}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="mb-1 block font-bold text-[var(--lp-text)]">
              Numéro de Téléphone (WhatsApp) ou Email
            </label>
            <div className="relative">
              <input
                type="text"
                required
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="+2250700000000 ou email@domaine.ci"
                className="w-full rounded-xl border border-[var(--lp-border)] bg-[var(--lp-bg-inset)] py-3 pl-10 pr-4 text-[var(--lp-text)] placeholder:text-[var(--lp-text-subtle)] focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--lp-text-subtle)]">
                {identifier.includes("@") ? (
                  <Mail className="h-4 w-4" />
                ) : (
                  <Phone className="h-4 w-4" />
                )}
              </div>
            </div>
          </div>

          <div>
            <div className="mb-1 flex items-center justify-between">
              <label className="font-bold text-[var(--lp-text)]">Mot de passe</label>
              <Link
                href="/forgot-password"
                className="text-[var(--lp-accent-text)] hover:underline"
              >
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
                className="w-full rounded-xl border border-[var(--lp-border)] bg-[var(--lp-bg-inset)] py-3 pl-10 pr-4 text-[var(--lp-text)] placeholder:text-[var(--lp-text-subtle)] focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--lp-text-subtle)]" />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--lp-accent-solid)] py-3.5 text-sm font-extrabold text-[var(--lp-accent-on)] shadow-[var(--lp-accent-shadow)] transition hover:bg-[var(--lp-accent-solid-hover)] active:scale-95 disabled:opacity-60"
          >
            {isLoading ? <span>Connexion en cours...</span> : <span>Se Connecter</span>}
            <ArrowRight className="h-4 w-4" />
          </button>
        </form>

        <p className="text-center text-xs text-[var(--lp-text-muted)]">
          Pas encore de compte ?{" "}
          <Link
            href="/signup"
            className="font-bold text-[var(--lp-accent-text)] hover:underline"
          >
            S&apos;inscrire gratuitement
          </Link>
        </p>
      </div>
    </div>
  );
}
