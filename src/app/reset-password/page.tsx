"use client";

import React, { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { AuthThemeToggle } from "@/components/AuthThemeToggle";
import { Building2, Lock, ArrowRight, AlertCircle, CheckCircle2 } from "lucide-react";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password !== confirm) {
      setError("Les deux mots de passe ne correspondent pas.");
      return;
    }
    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, newPassword: password }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSuccess(true);
        setTimeout(() => router.push("/login"), 1500);
      } else {
        setError(data.error || "Impossible de réinitialiser le mot de passe.");
      }
    } catch {
      setError("Erreur de connexion au serveur.");
    } finally {
      setIsLoading(false);
    }
  };

  const inputClass =
    "w-full rounded-xl border border-[var(--lp-border)] bg-[var(--lp-bg-inset)] py-3 pl-10 pr-4 text-[var(--lp-text)] placeholder:text-[var(--lp-text-subtle)] focus:outline-none focus:ring-2 focus:ring-emerald-500";

  return (
    <div className="auth-page relative flex min-h-screen flex-col items-center justify-center bg-[var(--lp-bg)] p-4 text-[var(--lp-text)]">
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
          <h1 className="text-xl font-bold text-[var(--lp-text)]">Nouveau mot de passe</h1>
          <p className="text-xs text-[var(--lp-text-muted)]">
            8 caractères minimum, avec au moins une lettre et un chiffre.
          </p>
        </div>

        {!token ? (
          <div className="rounded-xl border border-[var(--lp-error-border)] bg-[var(--lp-error-bg)] p-3.5 text-xs text-[var(--lp-error-text)]">
            Lien invalide : aucun jeton de réinitialisation n&apos;a été fourni.
          </div>
        ) : null}
        {error ? (
          <div className="flex items-start gap-2.5 rounded-xl border border-[var(--lp-error-border)] bg-[var(--lp-error-bg)] p-3.5 text-xs text-[var(--lp-error-text)]">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        ) : null}
        {success ? (
          <div className="flex items-start gap-2.5 rounded-xl border border-[var(--lp-success-border)] bg-[var(--lp-success-bg)] p-3.5 text-xs text-[var(--lp-success-text)]">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
            <span>Mot de passe mis à jour. Redirection vers la connexion…</span>
          </div>
        ) : null}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="mb-1 block font-bold text-[var(--lp-text)]">
              Nouveau mot de passe
            </label>
            <div className="relative">
              <input
                type="password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={inputClass}
              />
              <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--lp-text-subtle)]" />
            </div>
          </div>
          <div>
            <label className="mb-1 block font-bold text-[var(--lp-text)]">Confirmation</label>
            <div className="relative">
              <input
                type="password"
                required
                minLength={8}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                className={inputClass}
              />
              <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--lp-text-subtle)]" />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading || !token || success}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--lp-accent-solid)] py-3.5 text-sm font-extrabold text-[var(--lp-accent-on)] shadow-[var(--lp-accent-shadow)] transition hover:bg-[var(--lp-accent-solid-hover)] active:scale-95 disabled:opacity-60"
          >
            {isLoading ? "Mise à jour..." : "Définir le mot de passe"}
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
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="auth-page flex min-h-screen items-center justify-center bg-[var(--lp-bg)]">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
        </div>
      }
    >
      <AuthThemeToggle />
      <ResetPasswordForm />
    </Suspense>
  );
}
