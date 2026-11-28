"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Settings, ShieldCheck } from "lucide-react";
import { Organization } from "@/types";
import { useApp } from "@/context/AppContext";
import { readApiJson, useApiQuery } from "@/lib/api-client";
import {
  AccountSettingsCard,
  BillingRulesCard,
  DataExportCard,
  IdentitySettingsCard,
  NotificationProvidersCard,
  OrgSettingsForm,
  ReceiptSettingsCard,
  ReminderSettingsCard,
  SaveBar,
  SettingsSectionNav,
  SubscriptionSettingsCard,
  UpdateSetting,
} from "@/components/settings/SettingsComponents";

const DEFAULT_FORM: OrgSettingsForm = {
  name: "",
  phone: "",
  email: "",
  address: "",
  countryCode: "CI",
  logoUrl: "",
  defaultCurrency: "XOF",
  paymentDueDay: 5,
  lateFeePercentage: 5,
  gracePeriodDays: 5,
  autoReminders: true,
  reminderDaysBefore: 3,
  emailNotifications: true,
  smsNotifications: true,
  whatsappNotifications: true,
  dailyDigest: false,
  receiptFooter: "",
  showQrCode: true,
  receiptLanguage: "fr",
};

export default function ParametresPage() {
  const { showToast, triggerRefresh, refreshTrigger, setCurrency } = useApp();
  const { data: org } = useApiQuery<Organization | null>(
    "organization",
    "/api/organization",
    { refreshKey: refreshTrigger }
  );

  const [form, setForm] = useState<OrgSettingsForm>(DEFAULT_FORM);
  const [isSaving, setIsSaving] = useState(false);
  const initialRef = useRef<OrgSettingsForm | null>(null);

  // Seed once from the cached query; refetches must not overwrite edits.
  useEffect(() => {
    if (!org || initialRef.current) return;
    const next: OrgSettingsForm = {
      name: org.name || "",
      phone: org.phone || "",
      email: org.email || "",
      address: org.address || "",
      countryCode: org.countryCode || "CI",
      logoUrl: org.logoUrl || "",
      defaultCurrency: org.defaultCurrency || "XOF",
      paymentDueDay: org.settings?.paymentDueDay ?? 5,
      lateFeePercentage: org.settings?.lateFeePercentage ?? 5,
      gracePeriodDays: org.settings?.gracePeriodDays ?? 5,
      autoReminders: org.settings?.autoReminders ?? true,
      reminderDaysBefore: org.settings?.reminderDaysBefore ?? 3,
      emailNotifications: org.settings?.emailNotifications ?? true,
      smsNotifications: org.settings?.smsNotifications ?? true,
      whatsappNotifications: org.settings?.whatsappNotifications ?? true,
      dailyDigest: org.settings?.dailyDigest ?? false,
      receiptFooter: org.settings?.receiptFooter || "",
      showQrCode: org.settings?.showQrCode ?? true,
      receiptLanguage: org.settings?.receiptLanguage || "fr",
    };
    initialRef.current = next;
    setForm(next);
  }, [org]);

  const update = useCallback<UpdateSetting>((key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  }, []);

  const isDirty = useMemo(() => {
    const initial = initialRef.current;
    if (!initial) return false;
    return (Object.keys(form) as (keyof OrgSettingsForm)[]).some(
      (key) => form[key] !== initial[key]
    );
  }, [form]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const res = await fetch("/api/organization", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          phone: form.phone,
          email: form.email,
          address: form.address,
          countryCode: form.countryCode,
          logoUrl: form.logoUrl,
          defaultCurrency: form.defaultCurrency,
          settings: {
            lateFeePercentage: Number(form.lateFeePercentage),
            gracePeriodDays: Number(form.gracePeriodDays),
            autoReminders: form.autoReminders,
            paymentDueDay: Number(form.paymentDueDay),
            reminderDaysBefore: Number(form.reminderDaysBefore),
            emailNotifications: form.emailNotifications,
            smsNotifications: form.smsNotifications,
            whatsappNotifications: form.whatsappNotifications,
            dailyDigest: form.dailyDigest,
            receiptFooter: form.receiptFooter,
            showQrCode: form.showQrCode,
            receiptLanguage: form.receiptLanguage,
          },
        }),
      });
      const data = await readApiJson(res);
      if (data.success) {
        initialRef.current = form;
        setCurrency(form.defaultCurrency);
        triggerRefresh();
        showToast("Paramètres enregistrés avec succès !", "success");
      } else {
        showToast(data.error || "Erreur lors de l'enregistrement", "error");
      }
    } catch {
      showToast("Erreur réseau lors de l'enregistrement", "error");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-28 lg:pb-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Settings className="w-6 h-6 text-emerald-600" />
            <span>Paramètres de l&apos;Organisation</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Identité, règles financières, notifications, compte, abonnement et sauvegarde.
          </p>
        </div>

        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-bold">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Formule {org?.subscriptionPlan || "PRO"} Active</span>
        </div>
      </div>

      <SettingsSectionNav />

      <form onSubmit={handleSave} className="space-y-6 scroll-mt-24">
        <IdentitySettingsCard
          id="settings-identity"
          form={form}
          update={update}
        />
        <BillingRulesCard
          id="settings-billing"
          form={form}
          update={update}
        />
        <ReminderSettingsCard
          id="settings-reminders"
          form={form}
          update={update}
        />
        <NotificationProvidersCard id="settings-providers" />
        <ReceiptSettingsCard
          id="settings-receipts"
          form={form}
          update={update}
        />
        <AccountSettingsCard id="settings-account" />
        <SubscriptionSettingsCard id="settings-subscription" />
        <DataExportCard id="settings-export" />

        <SaveBar isDirty={isDirty} isSaving={isSaving} />
      </form>
    </div>
  );
}
