"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Installment, Organization } from "@/types";
import { useApp } from "@/context/AppContext";
import { useApiQuery } from "@/lib/api-client";
import { formatCurrency } from "@/lib/utils";
import {
  X,
  MessageSquare,
  Send,
  Smartphone,
  Mail,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import type { NotificationStatus } from "@/lib/notification-service";
import {
  buildReminderContent,
  REMINDER_SEQUENCES,
  SEQUENCE_LABELS,
  ReminderSequence,
} from "@/lib/reminder-templates";

interface RelanceModalProps {
  installment: Installment;
  onClose: () => void;
  onSuccess: () => void;
}

type SendChannel = "SMS" | "EMAIL";

export function RelanceModal({ installment, onClose, onSuccess }: RelanceModalProps) {
  const { showToast, refreshTrigger } = useApp();
  const { data: org } = useApiQuery<Organization | null>(
    "organization",
    "/api/organization",
    { refreshKey: refreshTrigger }
  );
  const { data: providers } = useApiQuery<NotificationStatus>(
    "notification-providers-status",
    "/api/settings/notifications/status"
  );

  const smsEnabled = org?.settings?.smsNotifications ?? true;
  const emailEnabled = org?.settings?.emailNotifications ?? true;
  const whatsappEnabled = org?.settings?.whatsappNotifications ?? true;
  const smsReady = smsEnabled && !!providers?.sms?.configured;
  const emailReady = emailEnabled && !!providers?.email?.configured;

  const [channel, setChannel] = useState<SendChannel>("SMS");
  const [sequence, setSequence] = useState<ReminderSequence>("J_PLUS_7");
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    if (channel === "SMS" && !smsReady && emailReady) setChannel("EMAIL");
    if (channel === "EMAIL" && !emailReady && smsReady) setChannel("SMS");
  }, [channel, smsReady, emailReady]);

  const content = useMemo(() => {
    const appUrl =
      typeof window !== "undefined"
        ? window.location.origin
        : process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3001";
    return buildReminderContent({
      sequence,
      tenantName: installment.tenantName,
      amount: installment.remainingDue,
      currency: org?.defaultCurrency || "XOF",
      periodLabel: installment.periodLabel,
      unitNumber: installment.unitNumber,
      organizationName: org?.name || "LOUTIGUI",
      organizationPhone: org?.phone,
      reminderDaysBefore: org?.settings?.reminderDaysBefore ?? 3,
      language: org?.settings?.receiptLanguage === "en" ? "en" : "fr",
      appUrl,
    });
  }, [sequence, installment, org]);

  const channelReady = channel === "SMS" ? smsReady : emailReady;

  const openWhatsapp = () => {
    const phone = installment.tenantPhone.replace(/[^\d]/g, "");
    const url = `https://wa.me/${phone}?text=${encodeURIComponent(content.sms)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const handleSend = async () => {
    if (!channelReady) {
      showToast(
        `${channel === "SMS" ? "SMS" : "Email"} indisponible : vérifiez les réglages et la configuration du fournisseur.`,
        "error"
      );
      return;
    }
    setIsSending(true);
    try {
      const res = await fetch("/api/reminders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          installmentId: installment.id,
          channel,
          sequence,
        }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(
          `Relance envoyée avec succès à ${installment.tenantName} par ${channel === "SMS" ? "SMS" : "email"} (${data.provider}).`,
          "success"
        );
        onSuccess();
        onClose();
      } else {
        showToast(data.error || "Impossible d'envoyer la relance", "error");
      }
    } catch {
      showToast("Erreur réseau lors de l'envoi de la relance", "error");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white">
              <MessageSquare className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-bold text-base text-slate-900 dark:text-white">
                Envoyer une Relance
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                SMS via Twilio/passerelle · Email via Resend/Brevo/SendGrid
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          {/* Target */}
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex justify-between items-center text-xs">
            <div>
              <p className="font-bold text-slate-900 dark:text-white text-sm">{installment.tenantName}</p>
              <p className="text-slate-500 dark:text-slate-400">
                {installment.tenantPhone} &bull; {installment.unitNumber}
              </p>
            </div>
            <div className="text-right">
              <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300">
                Impayé
              </span>
              <p className="font-extrabold text-sm text-rose-600 dark:text-rose-400 mt-0.5">
                {formatCurrency(installment.remainingDue, org?.defaultCurrency || "XOF")}
              </p>
            </div>
          </div>

          {/* Channel selector */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              Canal de Diffusion
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                disabled={!smsReady}
                onClick={() => setChannel("SMS")}
                className={`flex items-center justify-center gap-2 p-3 rounded-xl border text-xs font-bold transition disabled:opacity-40 disabled:cursor-not-allowed ${
                  channel === "SMS"
                    ? "border-emerald-600 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300"
                    : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400"
                }`}
              >
                <Smartphone className="w-4 h-4 text-emerald-600" />
                <span>SMS</span>
              </button>
              <button
                type="button"
                disabled={!emailReady}
                onClick={() => setChannel("EMAIL")}
                className={`flex items-center justify-center gap-2 p-3 rounded-xl border text-xs font-bold transition disabled:opacity-40 disabled:cursor-not-allowed ${
                  channel === "EMAIL"
                    ? "border-emerald-600 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300"
                    : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400"
                }`}
              >
                <Mail className="w-4 h-4 text-emerald-600" />
                <span>Email</span>
              </button>
            </div>
            {!channelReady && providers && (
              <p className="flex items-start gap-1.5 text-[11px] text-amber-700 dark:text-amber-300">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                {channel === "SMS"
                  ? `SMS indisponible : ${providers.sms.missing.join(", ") || "canal désactivé"}.`
                  : `Email indisponible : ${providers.email.missing.join(", ") || "canal désactivé"}.`}
              </p>
            )}
          </div>

          {/* Sequence selector */}
          <div className="space-y-1.5">
            <label htmlFor="relance-sequence" className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              Niveau d&apos;Escalade / Modèle
            </label>
            <select
              id="relance-sequence"
              value={sequence}
              onChange={(e) => setSequence(e.target.value as ReminderSequence)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              {REMINDER_SEQUENCES.map((seq) => (
                <option key={seq} value={seq}>
                  {SEQUENCE_LABELS[seq].fr}
                </option>
              ))}
            </select>
          </div>

          {/* Message preview */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              Aperçu du Message
            </label>
            <div className="p-3.5 rounded-xl bg-slate-900 text-emerald-400 font-mono text-xs leading-relaxed border border-slate-800 whitespace-pre-wrap">
              {channel === "SMS" ? content.sms : `${content.emailSubject}\n\n${content.emailText}`}
            </div>
          </div>

          {whatsappEnabled && (
            <button
              type="button"
              onClick={openWhatsapp}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 font-bold text-xs hover:bg-emerald-50 dark:hover:bg-emerald-950/30 transition"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              Ouvrir WhatsApp avec le message pré-rempli (lien direct, sans API)
            </button>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              Annuler
            </button>
            <button
              type="button"
              onClick={handleSend}
              disabled={isSending || !channelReady}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 dark:disabled:bg-slate-700 disabled:text-slate-500 text-white text-xs font-extrabold shadow-md shadow-emerald-700/20 transition active:scale-95"
            >
              {isSending ? (
                <CheckCircle2 className="w-3.5 h-3.5 animate-pulse" />
              ) : (
                <Send className="w-3.5 h-3.5" />
              )}
              <span>{isSending ? "Envoi en cours..." : "Déclencher la Relance"}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
