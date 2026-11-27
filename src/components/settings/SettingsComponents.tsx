"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import {
  AlertCircle,
  BellRing,
  Building2,
  CalendarDays,
  Check,
  Coins,
  Database,
  Download,
  FileSpreadsheet,
  FileText,
  Image as ImageIcon,
  Loader2,
  LockKeyhole,
  Mail,
  MapPin,
  RadioTower,
  ServerCog,
  ShieldCheck,
  Smartphone,
  UserRound,
  ExternalLink,
  CreditCard,
} from "lucide-react";
import { Currency, SubscriptionInfo } from "@/types";
import { useAuth } from "@/context/AuthContext";
import { useApp } from "@/context/AppContext";
import { useApiQuery } from "@/lib/api-client";
import { cn, formatCurrency } from "@/lib/utils";
import type { NotificationStatus } from "@/lib/notification-service";

export interface OrgSettingsForm {
  name: string;
  phone: string;
  email: string;
  address: string;
  countryCode: string;
  logoUrl: string;
  defaultCurrency: Currency;
  paymentDueDay: number;
  lateFeePercentage: number;
  gracePeriodDays: number;
  autoReminders: boolean;
  reminderDaysBefore: number;
  emailNotifications: boolean;
  smsNotifications: boolean;
  whatsappNotifications: boolean;
  dailyDigest: boolean;
  receiptFooter: string;
  showQrCode: boolean;
  receiptLanguage: "fr" | "en";
}

export type UpdateSetting = <K extends keyof OrgSettingsForm>(
  key: K,
  value: OrgSettingsForm[K]
) => void;

const inputClass =
  "w-full mt-1.5 px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500";

/* -------------------------------------------------------------------------- */
/* Shared primitives                                                          */
/* -------------------------------------------------------------------------- */

export function SettingsCard({
  id,
  icon: Icon,
  title,
  description,
  badge,
  children,
  className,
}: {
  id?: string;
  icon: LucideIcon;
  title: string;
  description?: string;
  badge?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      id={id}
      className={cn(
        "p-6 rounded-2xl scroll-mt-28 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4",
        className
      )}
    >
      <div className="flex items-start justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
        <div className="flex items-start gap-2">
          <Icon className="w-5 h-5 text-emerald-600 mt-0.5 shrink-0" />
          <div>
            <h2 className="font-extrabold text-sm text-slate-900 dark:text-white">{title}</h2>
            {description && (
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{description}</p>
            )}
          </div>
        </div>
        {badge && (
          <span className="shrink-0 px-2 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-[10px] font-extrabold uppercase tracking-wide">
            {badge}
          </span>
        )}
      </div>
      {children}
    </section>
  );
}

export function Field({
  label,
  htmlFor,
  hint,
  children,
  className,
}: {
  label: string;
  htmlFor?: string;
  hint?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <label
        htmlFor={htmlFor}
        className="font-bold text-slate-700 dark:text-slate-300 text-xs"
      >
        {label}
      </label>
      {children}
      {hint && <p className="text-[11px] text-slate-400 mt-1">{hint}</p>}
    </div>
  );
}

export function ToggleSwitch({
  checked,
  onChange,
  label,
  description,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  description?: string;
}) {
  return (
    <div className="flex items-start justify-between gap-4 py-2">
      <div>
        <p className="text-xs font-bold text-slate-800 dark:text-slate-200">{label}</p>
        {description && (
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{description}</p>
        )}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={() => onChange(!checked)}
        className={cn(
          "relative shrink-0 w-11 h-6 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900",
          checked ? "bg-emerald-600" : "bg-slate-300 dark:bg-slate-700"
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform",
            checked && "translate-x-5"
          )}
        />
      </button>
    </div>
  );
}

export function SaveBar({ isDirty, isSaving }: { isDirty: boolean; isSaving: boolean }) {
  return (
    <div className="sticky bottom-20 lg:bottom-3 z-30 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 rounded-2xl bg-white/95 dark:bg-slate-900/95 backdrop-blur border border-slate-200 dark:border-slate-700 shadow-xl">
      <div className="flex items-center gap-2 text-xs">
        <span
          className={cn(
            "w-2 h-2 rounded-full",
            isDirty ? "bg-amber-500" : "bg-emerald-500"
          )}
        />
        <span className="font-bold text-slate-700 dark:text-slate-200">
          {isDirty ? "Modifications non enregistrées" : "Tout est à jour"}
        </span>
      </div>
      <button
        type="submit"
        disabled={isSaving || !isDirty}
        className="flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 dark:disabled:bg-slate-700 disabled:text-slate-500 text-white font-extrabold text-xs shadow-lg transition active:scale-95"
      >
        {isSaving ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Check className="w-4 h-4" />
        )}
        <span>{isSaving ? "Enregistrement..." : "Enregistrer les modifications"}</span>
      </button>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Organization settings cards                                                */
/* -------------------------------------------------------------------------- */

export function IdentitySettingsCard({
  form,
  update,
  id,
}: {
  form: OrgSettingsForm;
  update: UpdateSetting;
  id?: string;
}) {
  return (
    <SettingsCard
      id={id}
      icon={Building2}
      title="Identité & Image de marque"
      description="Ces informations apparaissent sur les quittances et les relances."
      badge="Public"
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Raison Sociale / Nom du Gestionnaire" htmlFor="org-name">
          <input
            id="org-name"
            type="text"
            required
            value={form.name}
            onChange={(e) => update("name", e.target.value)}
            className={inputClass}
          />
        </Field>

        <Field label="Pays d'Implantation" htmlFor="org-country">
          <select
            id="org-country"
            value={form.countryCode}
            onChange={(e) => update("countryCode", e.target.value)}
            className={inputClass}
          >
            <option value="CI">Côte d&apos;Ivoire (FCFA)</option>
            <option value="SN">Sénégal</option>
            <option value="BF">Burkina Faso</option>
            <option value="ML">Mali</option>
            <option value="TG">Togo</option>
            <option value="BJ">Bénin</option>
          </select>
        </Field>

        <Field label="Téléphone WhatsApp Officiel" htmlFor="org-phone">
          <input
            id="org-phone"
            type="text"
            required
            value={form.phone}
            onChange={(e) => update("phone", e.target.value)}
            className={inputClass}
          />
        </Field>

        <Field label="Email de Contact" htmlFor="org-email">
          <input
            id="org-email"
            type="email"
            required
            value={form.email}
            onChange={(e) => update("email", e.target.value)}
            className={inputClass}
          />
        </Field>

        <Field label="Adresse du Siège" htmlFor="org-address" className="sm:col-span-2">
          <div className="relative">
            <MapPin className="w-3.5 h-3.5 absolute left-3 top-5 text-slate-400" />
            <input
              id="org-address"
              type="text"
              required
              value={form.address}
              onChange={(e) => update("address", e.target.value)}
              className={cn(inputClass, "pl-9")}
            />
          </div>
        </Field>

        <Field
          label="Logo de l'organisation (URL)"
          htmlFor="org-logo"
          hint="Format PNG ou JPG, 400×400 px recommandé. Laissez vide pour utiliser le monogramme."
          className="sm:col-span-2"
        >
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 shrink-0 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 flex items-center justify-center overflow-hidden">
              {form.logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={form.logoUrl} alt="Aperçu du logo" className="w-full h-full object-contain" />
              ) : (
                <ImageIcon className="w-5 h-5 text-slate-400" />
              )}
            </div>
            <input
              id="org-logo"
              type="url"
              placeholder="https://exemple.fr/logo.png"
              value={form.logoUrl}
              onChange={(e) => update("logoUrl", e.target.value)}
              className={cn(inputClass, "mt-0")}
            />
          </div>
        </Field>
      </div>
    </SettingsCard>
  );
}

export function BillingRulesCard({
  form,
  update,
  id,
}: {
  form: OrgSettingsForm;
  update: UpdateSetting;
  id?: string;
}) {
  return (
    <SettingsCard
      id={id}
      icon={Coins}
      title="Règles de Facturation & Recouvrement"
      description="Jour d'échéance, délai de grâce et pénalités appliqués automatiquement."
      badge="Finance"
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field
          label="Devise de référence"
          htmlFor="org-currency"
          hint="Sert de devise par défaut à l'ensemble de l'interface."
        >
          <select
            id="org-currency"
            value={form.defaultCurrency}
            onChange={(e) => update("defaultCurrency", e.target.value as Currency)}
            className={inputClass}
          >
            <option value="XOF">FCFA (XOF)</option>
            <option value="EUR">Euro (EUR)</option>
            <option value="USD">Dollar US (USD)</option>
          </select>
        </Field>

        <Field
          label="Jour d'échéance mensuel"
          htmlFor="due-day"
          hint="Les Loyers sont exigibles ce jour de chaque mois (1 au 28)."
        >
          <input
            id="due-day"
            type="number"
            min={1}
            max={28}
            value={form.paymentDueDay}
            onChange={(e) => update("paymentDueDay", Number(e.target.value))}
            className={inputClass}
          />
        </Field>

        <Field
          label="Délai de grâce (jours)"
          htmlFor="grace-days"
          hint="Nombre de jours après l'échéance avant pénalités."
        >
          <input
            id="grace-days"
            type="number"
            min={0}
            max={30}
            value={form.gracePeriodDays}
            onChange={(e) => update("gracePeriodDays", Number(e.target.value))}
            className={inputClass}
          />
        </Field>

        <Field
          label="Taux de pénalité (%)"
          htmlFor="late-fee"
          hint="Appliqué au solde restant dû lors des mises en demeure."
        >
          <input
            id="late-fee"
            type="number"
            min={0}
            max={20}
            step={0.5}
            value={form.lateFeePercentage}
            onChange={(e) => update("lateFeePercentage", Number(e.target.value))}
            className={inputClass}
          />
        </Field>
      </div>
    </SettingsCard>
  );
}

export function ReminderSettingsCard({
  form,
  update,
  id,
}: {
  form: OrgSettingsForm;
  update: UpdateSetting;
  id?: string;
}) {
  return (
    <SettingsCard
      id={id}
      icon={BellRing}
      title="Notifications & Relances Automatiques"
      description="Choisissez quand et comment vos locataires sont sollicités."
      badge="Communication"
    >
      <div className="divide-y divide-slate-100 dark:divide-slate-800">
        <ToggleSwitch
          checked={form.autoReminders}
          onChange={(v) => update("autoReminders", v)}
          label="Séquence de relance automatique"
          description="J-3, Jour J, J+3, J+7 et mise en demeure J+15 via /api/cron/reminders."
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-3">
          <Field
            label="Anticipation (jours avant échéance)"
            htmlFor="reminder-lead"
            hint="0 = relance le jour même de l'échéance."
          >
            <input
              id="reminder-lead"
              type="number"
              min={0}
              max={14}
              value={form.reminderDaysBefore}
              onChange={(e) => update("reminderDaysBefore", Number(e.target.value))}
              className={inputClass}
            />
          </Field>
        </div>
        <ToggleSwitch
          checked={form.emailNotifications}
          onChange={(v) => update("emailNotifications", v)}
          label="Relances par email"
          description="Envois réels via Resend, Brevo ou SendGrid vers l'adresse du locataire."
        />
        <ToggleSwitch
          checked={form.smsNotifications}
          onChange={(v) => update("smsNotifications", v)}
          label="Relances par SMS"
          description="Envoi direct au numéro du locataire."
        />
        <ToggleSwitch
          checked={form.whatsappNotifications}
          onChange={(v) => update("whatsappNotifications", v)}
          label="Relances par WhatsApp"
          description="Génération du lien wa.me avec message pré-rempli."
        />
        <ToggleSwitch
          checked={form.dailyDigest}
          onChange={(v) => update("dailyDigest", v)}
          label="Rapport quotidien"
          description="Synthèse réelle envoyée chaque matin à l'email de l'organisation."
        />
      </div>
    </SettingsCard>
  );
}

export function NotificationProvidersCard({ id }: { id?: string }) {
  const { data: status } = useApiQuery<NotificationStatus>(
    "notification-providers-status",
    "/api/settings/notifications/status"
  );

  const rows = [
    {
      key: "sms" as const,
      icon: Smartphone,
      title: "SMS",
      detail: status?.sms
        ? `${status.sms.provider} · ${status.sms.configured ? "connecté" : "non configuré"}`
        : "Vérification...",
      missing: status?.sms?.missing ?? [],
    },
    {
      key: "email" as const,
      icon: Mail,
      title: "Email",
      detail: status?.email
        ? `${status.email.provider} · ${status.email.configured ? "connecté" : "non configuré"}`
        : "Vérification...",
      missing: status?.email?.missing ?? [],
    },
    {
      key: "payments" as const,
      icon: CreditCard,
      title: "Paiement en ligne",
      detail: status?.payments
        ? `${status.payments.provider} · ${status.payments.configured ? "connecté" : "non configuré"}`
        : "Vérification...",
      missing: status?.payments?.missing ?? [],
    },
  ];

  return (
    <SettingsCard
      id={id}
      icon={RadioTower}
      title="Fournisseurs de Relance"
      description="État réel des connexions SMS, email et paiement en ligne utilisées par la plateforme."
      badge="Infrastructure"
    >
      <div className="space-y-2">
        {rows.map((row) => {
          const configured = status?.[row.key]?.configured;
          return (
            <div
              key={row.key}
              className="flex items-start gap-3 p-3 rounded-xl border border-slate-200 dark:border-slate-700"
            >
              <div className="w-9 h-9 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
                <row.icon className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-xs font-extrabold text-slate-900 dark:text-white">{row.title}</p>
                  <BadgeInline ok={configured === true} />
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{row.detail}</p>
                {configured === false && row.missing.length > 0 && (
                  <p className="text-[10px] text-amber-700 dark:text-amber-300 mt-1">
                    Variables manquantes : <code className="font-mono">{row.missing.join(", ")}</code>
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex items-start gap-2 p-3 rounded-xl bg-sky-50 dark:bg-sky-950/30 border border-sky-200 dark:border-sky-800 text-[11px] text-sky-800 dark:text-sky-300">
        <ServerCog className="w-4 h-4 shrink-0 mt-0.5" />
        <span>
          Les identifiants restent sur le serveur dans <code className="font-mono">.env.local</code> (voir{" "}
          <code className="font-mono">.env.example</code>). Aucun envoi simulé : une passerelle non configurée
          échoue explicitement et la tentative est journalisée. Le cron quotidien{" "}
          <code className="font-mono">/api/cron/reminders</code> applique les séquences J-3 / J / J+3 / J+7 / J+15.
          Aucun paiement n&apos;est jamais confirmé localement : seul un webhook signé active une quittance.
        </span>
      </div>
    </SettingsCard>
  );
}

function BadgeInline({ ok }: { ok: boolean }) {
  return (
    <span
      className={cn(
        "px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide",
        ok
          ? "bg-emerald-600 text-white"
          : "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300"
      )}
    >
      {ok ? "Connecté" : "Non configuré"}
    </span>
  );
}

export function ReceiptSettingsCard({
  form,
  update,
  id,
}: {
  form: OrgSettingsForm;
  update: UpdateSetting;
  id?: string;
}) {
  return (
    <SettingsCard
      id={id}
      icon={FileText}
      title="Quittances & Documents"
      description="Personnalisation des quittances certifiées émises par le SaaS."
      badge="Documents"
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Langue des quittances" htmlFor="receipt-lang">
          <select
            id="receipt-lang"
            value={form.receiptLanguage}
            onChange={(e) => update("receiptLanguage", e.target.value as "fr" | "en")}
            className={inputClass}
          >
            <option value="fr">Français</option>
            <option value="en">English</option>
          </select>
        </Field>
        <div className="flex items-center">
          <ToggleSwitch
            checked={form.showQrCode}
            onChange={(v) => update("showQrCode", v)}
            label="Afficher le QR code de vérification"
          />
        </div>
        <Field
          label="Mentions légales / Pied de page"
          htmlFor="receipt-footer"
          hint="Ajouté en bas de chaque quittance (ex: numéro d'agrément, conditions de paiement)."
          className="sm:col-span-2"
        >
          <textarea
            id="receipt-footer"
            rows={3}
            value={form.receiptFooter}
            onChange={(e) => update("receiptFooter", e.target.value)}
            placeholder="Ex : Tout paiement doit être effectué sur le compte ..."
            className={cn(inputClass, "resize-y")}
          />
        </Field>
      </div>
    </SettingsCard>
  );
}

/* -------------------------------------------------------------------------- */
/* Standalone cards (not part of the organization form)                       */
/* -------------------------------------------------------------------------- */

export function AccountSettingsCard({ id }: { id?: string }) {
  const { user, updateUser } = useAuth();
  const { showToast, triggerRefresh } = useApp();
  const [profile, setProfile] = useState({ name: "", phone: "", email: "" });
  const [password, setPassword] = useState({ current: "", next: "", confirm: "" });
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  useEffect(() => {
    if (!user) return;
    setProfile({ name: user.name, phone: user.phone, email: user.email || "" });
    // Only re-seed when the account changes, never after a local edit.
  }, [user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!user) return null;

  const saveProfile = async () => {
    setSavingProfile(true);
    try {
      const res = await fetch(`/api/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profile),
      });
      const data = await res.json();
      if (data.success) {
        updateUser(data.data);
        triggerRefresh();
        showToast("Profil mis à jour avec succès", "success");
      } else {
        showToast(data.error || "Impossible de mettre à jour le profil", "error");
      }
    } catch {
      showToast("Erreur réseau lors de la mise à jour du profil", "error");
    } finally {
      setSavingProfile(false);
    }
  };

  const savePassword = async () => {
    if (password.next !== password.confirm) {
      showToast("Les deux nouveaux mots de passe ne correspondent pas", "error");
      return;
    }
    setSavingPassword(true);
    try {
      const res = await fetch("/api/auth/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: password.current,
          newPassword: password.next,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setPassword({ current: "", next: "", confirm: "" });
        showToast("Mot de passe modifié avec succès", "success");
      } else {
        showToast(data.error || "Impossible de modifier le mot de passe", "error");
      }
    } catch {
      showToast("Erreur réseau lors de la modification du mot de passe", "error");
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <SettingsCard
      id={id}
      icon={UserRound}
      title="Mon Compte & Sécurité"
      description="Vos informations personnelles et l'accès à votre espace."
      badge="Compte"
    >
      <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
        <div className="w-11 h-11 rounded-full bg-gradient-to-br from-emerald-500 to-teal-700 text-white flex items-center justify-center font-black text-sm shrink-0">
          {user.name.slice(0, 2).toUpperCase()}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-extrabold text-slate-900 dark:text-white truncate">{user.name}</p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
            {user.email || user.phone} · {user.role}
          </p>
        </div>
        <ShieldCheck className="w-5 h-5 text-emerald-600 ml-auto shrink-0" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Field label="Nom complet" htmlFor="profile-name">
          <input
            id="profile-name"
            value={profile.name}
            onChange={(e) => setProfile((p) => ({ ...p, name: e.target.value }))}
            className={cn(inputClass, "mt-0")}
          />
        </Field>
        <Field label="Téléphone" htmlFor="profile-phone">
          <input
            id="profile-phone"
            value={profile.phone}
            onChange={(e) => setProfile((p) => ({ ...p, phone: e.target.value }))}
            className={cn(inputClass, "mt-0")}
          />
        </Field>
        <Field label="Email" htmlFor="profile-email">
          <input
            id="profile-email"
            type="email"
            value={profile.email}
            onChange={(e) => setProfile((p) => ({ ...p, email: e.target.value }))}
            className={cn(inputClass, "mt-0")}
          />
        </Field>
      </div>
      <div className="flex justify-end">
        <button
          type="button"
          onClick={saveProfile}
          disabled={savingProfile}
          className="px-4 py-2 rounded-xl border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 font-extrabold text-xs hover:bg-emerald-50 dark:hover:bg-emerald-950/40 disabled:opacity-50"
        >
          {savingProfile ? "Enregistrement..." : "Mettre à jour mon profil"}
        </button>
      </div>

      <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
        <div className="flex items-center gap-2">
          <LockKeyhole className="w-4 h-4 text-emerald-600" />
          <p className="font-extrabold text-xs text-slate-800 dark:text-slate-200">
            Modifier le mot de passe
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Field label="Mot de passe actuel" htmlFor="pwd-current">
            <input
              id="pwd-current"
              type="password"
              autoComplete="current-password"
              value={password.current}
              onChange={(e) => setPassword((p) => ({ ...p, current: e.target.value }))}
              className={cn(inputClass, "mt-0")}
            />
          </Field>
          <Field label="Nouveau mot de passe" htmlFor="pwd-next" hint="8 caractères minimum.">
            <input
              id="pwd-next"
              type="password"
              autoComplete="new-password"
              value={password.next}
              onChange={(e) => setPassword((p) => ({ ...p, next: e.target.value }))}
              className={cn(inputClass, "mt-0")}
            />
          </Field>
          <Field label="Confirmer" htmlFor="pwd-confirm">
            <input
              id="pwd-confirm"
              type="password"
              autoComplete="new-password"
              value={password.confirm}
              onChange={(e) => setPassword((p) => ({ ...p, confirm: e.target.value }))}
              className={cn(inputClass, "mt-0")}
            />
          </Field>
        </div>
        <div className="flex justify-end">
          <button
            type="button"
            onClick={savePassword}
            disabled={savingPassword || !password.current || !password.next}
            className="px-4 py-2 rounded-xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-extrabold text-xs hover:bg-slate-700 dark:hover:bg-white disabled:opacity-50"
          >
            {savingPassword ? "Modification..." : "Changer le mot de passe"}
          </button>
        </div>
      </div>
    </SettingsCard>
  );
}

export function SubscriptionSettingsCard({ id }: { id?: string }) {
  const { refreshTrigger } = useApp();
  const { data: sub } = useApiQuery<SubscriptionInfo | null>(
    "subscription-status",
    "/api/subscription/status",
    {
      select: (json) =>
        (json as { subscription?: SubscriptionInfo }).subscription ?? null,
      refreshKey: refreshTrigger,
    }
  );

  const plan = sub?.plan || "STARTER";
  const isTrial = !!sub?.isTrial;
  const label = sub?.isExpired
    ? "Expiré"
    : sub?.status === "ACTIVE"
      ? "Actif"
      : "Période d'essai";
  const progress =
    isTrial && sub?.daysRemaining !== undefined
      ? Math.max(0, Math.min(100, (sub.daysRemaining / 7) * 100))
      : sub?.isExpired
        ? 0
        : 100;

  return (
    <SettingsCard
      id={id}
      icon={CreditCard}
      title="Abonnement & Facturation"
      description="Gérez votre formule, vos moyens de paiement et vos factures."
      badge={plan}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/40 dark:to-teal-950/30 border border-emerald-200 dark:border-emerald-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-lg font-black text-slate-900 dark:text-white">Formule {plan}</span>
            <span
              className={cn(
                "px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase",
                sub?.isExpired
                  ? "bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300"
                  : "bg-emerald-600 text-white"
              )}
            >
              {label}
            </span>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
            {isTrial
              ? `${sub?.daysRemaining ?? 0} jour(s) restant(s) sur votre période d'essai.`
              : sub?.isExpired
                ? "Votre abonnement a expiré. Réactivez-le pour continuer à émettre des quittances."
                : "Votre abonnement est actif. Merci de votre confiance."}
          </p>
        </div>
        <Link
          href="/abonnement"
          className="shrink-0 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold"
        >
          Gérer mon abonnement
          <ExternalLink className="w-3.5 h-3.5" />
        </Link>
      </div>
      <div className="h-2 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
        <div
          className="h-full rounded-full bg-emerald-500 transition-all"
          style={{ width: `${progress}%` }}
        />
      </div>
      <div className="flex flex-wrap items-center gap-4 text-[11px] text-slate-500 dark:text-slate-400">
        <span className="flex items-center gap-1.5">
          <CalendarDays className="w-3.5 h-3.5" />
          Début : {sub?.trialStartDate ? new Date(sub.trialStartDate).toLocaleDateString("fr-FR") : "—"}
        </span>
        <span className="flex items-center gap-1.5">
          <CalendarDays className="w-3.5 h-3.5" />
          Fin :{" "}
          {sub?.trialEndDate
            ? new Date(sub.trialEndDate).toLocaleDateString("fr-FR")
            : sub?.subscriptionExpiresAt
              ? new Date(sub.subscriptionExpiresAt).toLocaleDateString("fr-FR")
              : "—"}
        </span>
        <span className="flex items-center gap-1.5">
          <Coins className="w-3.5 h-3.5" />
          Tarif de référence : {formatCurrency(plan === "AGENCE" ? 30000 : plan === "PRO" ? 20000 : 10000)}
        </span>
      </div>
    </SettingsCard>
  );
}

export function DataExportCard({ id }: { id?: string }) {
  const exports = [
    {
      href: "/api/export?format=json",
      icon: Download,
      title: "Sauvegarde complète (JSON)",
      description: "Toutes vos données : biens, locataires, paiements, quittances. Sans mots de passe.",
    },
    {
      href: "/api/export?format=receipts",
      icon: FileSpreadsheet,
      title: "Registre des quittances (CSV)",
      description: "Compatible Excel, avec numéros, montants et hash de vérification.",
    },
    {
      href: "/api/export?format=installments",
      icon: FileText,
      title: "Échéancier des loyers (CSV)",
      description: "Statuts, restes dus et périodes pour votre comptabilité.",
    },
  ];

  return (
    <SettingsCard
      id={id}
      icon={Database}
      title="Données & Sauvegarde"
      description="Exportez vos données à tout moment, sans dépendance propriétaire."
      badge="Conformité"
    >
      <div className="space-y-2">
        {exports.map((item) => (
          <a
            key={item.href}
            href={item.href}
            className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-emerald-300 dark:hover:border-emerald-700 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/20 transition group"
          >
            <div className="w-9 h-9 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0 group-hover:bg-emerald-100 dark:group-hover:bg-emerald-900/40">
              <item.icon className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-extrabold text-slate-900 dark:text-white">{item.title}</p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">{item.description}</p>
            </div>
            <Download className="w-4 h-4 text-slate-400 group-hover:text-emerald-600 shrink-0" />
          </a>
        ))}
      </div>
      <div className="flex items-start gap-2 p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-[11px] text-amber-800 dark:text-amber-300">
        <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
        <span>
          Conservez ces exports dans un emplacement sécurisé. Les fichiers générés contiennent des
          données personnelles de vos locataires.
        </span>
      </div>
    </SettingsCard>
  );
}

export function SettingsSectionNav() {
  const sections = [
    { id: "settings-identity", label: "Identité" },
    { id: "settings-billing", label: "Facturation" },
    { id: "settings-reminders", label: "Notifications" },
    { id: "settings-providers", label: "Fournisseurs" },
    { id: "settings-receipts", label: "Quittances" },
    { id: "settings-account", label: "Compte" },
    { id: "settings-subscription", label: "Abonnement" },
    { id: "settings-export", label: "Données" },
  ];

  return (
    <nav
      aria-label="Sections des paramètres"
      className="flex gap-2 overflow-x-auto pb-1"
    >
      {sections.map((section) => (
        <button
          key={section.id}
          type="button"
          onClick={() =>
            document
              .getElementById(section.id)
              ?.scrollIntoView({ behavior: "smooth", block: "start" })
          }
          className="shrink-0 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-[11px] font-bold text-slate-600 dark:text-slate-300 hover:border-emerald-300 hover:text-emerald-700 dark:hover:text-emerald-300 transition"
        >
          {section.label}
        </button>
      ))}
    </nav>
  );
}
