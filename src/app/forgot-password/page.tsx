"use client";

import React, { useState } from "react";
import Link from "next/link";
import { AuthThemeToggle } from "@/components/AuthThemeToggle";
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
    <main className="auth-page relative flex min-h-screen flex-col items-center justify-center bg-[var(--lp-bg)] p-4 text-[var(--lp-text)]">
      <AuthThemeToggle />
      <div className="w-full max-w-md space-y-6 rounded-3xl border border-[var(--lp-border)] bg-[var(--lp-bg-elevated)] p-6 shadow-[var(--lp-window-shadow)] sm:p-8">
        <div className="space-y-1 text-center">
          <Link href="/" className="mb-2 inline-flex items-center gap-2">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 text-white shadow-md">
              <Building2 className="h-5 w-5" />
            </span>
            <span className="text-2xl font-extrabold tracking-tight text-[var(--lp-text)]">
              LOUTIGUI
            </span>
          </Link>
          <h1 className="text-xl font-bold text-[var(--lp-text)]">Mot de passe oublié</h1>
          <p className="text-xs leading-5 text-[var(--lp-text-muted)]">
            Saisissez l&apos;email ou le téléphone de votre compte. Si un email est associé, un lien
            de réinitialisation valable une heure vous sera envoyé.
          </p>
        </div>

        {message ? (
          <div className="flex items-start gap-2.5 rounded-xl border border-[var(--lp-success-border)] bg-[var(--lp-success-bg)] p-3.5 text-xs text-[var(--lp-success-text)]">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{message}</span>
          </div>
        ) : null}
        {error ? (
          <div className="flex items-start gap-2.5 rounded-xl border border-[var(--lp-error-border)] bg-[var(--lp-error-bg)] p-3.5 text-xs text-[var(--lp-error-text)]">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        ) : null}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label htmlFor="forgot-identifier" className="mb-1 block font-bold text-[var(--lp-text)]">
              Email ou téléphone
            </label>
            <div className="relative">
              <input
                id="forgot-identifier"
                autoComplete="username"
                type="text"
                required
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="email@domaine.ci ou +2250700000000"
                className="w-full rounded-xl border border-[var(--lp-border)] bg-[var(--lp-bg-inset)] py-3 pl-10 pr-4 text-[var(--lp-text)] placeholder:text-[var(--lp-text-subtle)] focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--lp-text-subtle)]" />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--lp-accent-solid)] py-3.5 text-sm font-extrabold text-[var(--lp-accent-on)] shadow-[var(--lp-accent-shadow)] transition hover:bg-[var(--lp-accent-solid-hover)] active:scale-95 disabled:opacity-60"
          >
            {isLoading ? "Envoi en cours..." : "Envoyer le lien"}
            <ArrowRight className="h-4 w-4" />
          </button>
        </form>

        <p className="text-center text-xs text-[var(--lp-text-muted)]">
          <Link
            href="/login"
            className="font-bold text-[var(--lp-accent-text)] hover:underline"
          >
            Retour à la connexion
          </Link>
        </p>
      </div>
    </main>
  );
}
