"use client";
import { readApiJson } from "@/lib/api-client";

import React, { useState } from "react";
import { ClipboardList, Loader2, X } from "lucide-react";
import { Tenant, TicketCategory, TicketPriority, Unit } from "@/types";
import { useApp } from "@/context/AppContext";
import { cn } from "@/lib/utils";

interface MaintenanceRequestModalProps {
  tenant: Tenant;
  unit?: Unit;
  onClose: () => void;
}

const categories: { id: TicketCategory; label: string }[] = [
  { id: "PLUMBING", label: "Plomberie" },
  { id: "ELECTRICITY", label: "Électricité" },
  { id: "AC", label: "Climatisation" },
  { id: "MASONRY", label: "Maçonnerie" },
  { id: "CARPENTRY", label: "Menuiserie" },
  { id: "OTHER", label: "Autre" },
];

const priorities: { id: TicketPriority; label: string }[] = [
  { id: "LOW", label: "Faible" },
  { id: "MEDIUM", label: "Normale" },
  { id: "HIGH", label: "Élevée" },
  { id: "URGENT", label: "Urgente" },
];

const fieldClass =
  "w-full mt-1 px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500";

export function MaintenanceRequestModal({
  tenant,
  unit,
  onClose,
}: MaintenanceRequestModalProps) {
  const { showToast, triggerRefresh } = useApp();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<TicketCategory>("PLUMBING");
  const [priority, setPriority] = useState<TicketPriority>("MEDIUM");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isValid = title.trim().length >= 5 && description.trim().length >= 10 && !!unit;

  const submit = async () => {
    if (!isValid) return;
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/maintenance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          unitId: unit!.id,
          unitNumber: unit!.unitNumber,
          buildingName: unit!.buildingName || "",
          tenantId: tenant.id,
          tenantName: `${tenant.firstName} ${tenant.lastName}`,
          tenantPhone: tenant.phone,
          title: title.trim(),
          description: description.trim(),
          category,
          priority,
        }),
      });
      const data = await readApiJson(res);
      if (data.success) {
        showToast("Votre demande de maintenance a été transmise au gestionnaire", "success");
        triggerRefresh();
        onClose();
      } else {
        showToast(data.error || "Impossible d'envoyer la demande", "error");
      }
    } catch {
      showToast("Erreur réseau lors de l'envoi de la demande", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
      <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-2">
            <ClipboardList className="w-5 h-5 text-emerald-600 mt-0.5 shrink-0" />
            <div>
              <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                Signaler un problème de maintenance
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                Lot {unit?.unitNumber || "—"} · {unit?.buildingName || "Logement non renseigné"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white transition"
            aria-label="Fermer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label htmlFor="maint-category" className="font-bold text-slate-700 dark:text-slate-300 text-xs">
              Catégorie
            </label>
            <select
              id="maint-category"
              value={category}
              onChange={(e) => setCategory(e.target.value as TicketCategory)}
              className={fieldClass}
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="maint-priority" className="font-bold text-slate-700 dark:text-slate-300 text-xs">
              Urgence
            </label>
            <select
              id="maint-priority"
              value={priority}
              onChange={(e) => setPriority(e.target.value as TicketPriority)}
              className={fieldClass}
            >
              {priorities.map((p) => (
                <option key={p.id} value={p.id}>{p.label}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label htmlFor="maint-title" className="font-bold text-slate-700 dark:text-slate-300 text-xs">
            Titre du problème
          </label>
          <input
            id="maint-title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ex : Fuite d'eau dans la salle de bain"
            className={fieldClass}
          />
        </div>

        <div>
          <label htmlFor="maint-description" className="font-bold text-slate-700 dark:text-slate-300 text-xs">
            Description
          </label>
          <textarea
            id="maint-description"
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Décrivez précisément le problème et depuis quand il est constaté..."
            className={cn(fieldClass, "resize-y")}
          />
          <p className="text-[10px] text-slate-400 mt-1">
            {description.trim().length}/10 caractères minimum
          </p>
        </div>

        <div className="pt-1 flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300"
          >
            Annuler
          </button>
          <button
            type="button"
            disabled={!isValid || isSubmitting}
            onClick={submit}
            className="flex-[2] py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-md transition active:scale-95 disabled:opacity-50"
          >
            {isSubmitting ? (
              <span className="inline-flex items-center gap-1.5">
                <Loader2 className="w-4 h-4 animate-spin" />
                Envoi en cours...
              </span>
            ) : (
              "Envoyer la demande"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
