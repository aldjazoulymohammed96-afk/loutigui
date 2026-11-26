"use client";

import React, { useEffect, useMemo, useState } from "react";
import { MaintenanceTicket, Unit } from "@/types";
import { useApp } from "@/context/AppContext";
import { formatCurrency } from "@/lib/utils";
import { useApiQuery } from "@/lib/api-client";
import { Wrench, Plus, CheckCircle2, X } from "lucide-react";

export default function MaintenancePage() {
  const { currency, refreshTrigger, showToast, triggerRefresh } = useApp();
  const { data: tickets = [] } = useApiQuery<MaintenanceTicket[]>(
    "maintenance",
    "/api/maintenance",
    { refreshKey: refreshTrigger }
  );
  const { data: properties } = useApiQuery<{ units: Unit[] }>(
    "properties",
    "/api/properties",
    { refreshKey: refreshTrigger }
  );
  const units = useMemo(() => properties?.units ?? [], [properties]);

  // New ticket modal
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [unitId, setUnitId] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<MaintenanceTicket["category"]>("PLUMBING");
  const [priority, setPriority] = useState<MaintenanceTicket["priority"]>("MEDIUM");
  const [estimatedCost, setEstimatedCost] = useState(0);
  const [vendorName, setVendorName] = useState("");

  useEffect(() => {
    if (!unitId && units.length > 0) setUnitId(units[0].id);
  }, [units, unitId]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const unit = units.find((u) => u.id === unitId);
    try {
      const res = await fetch("/api/maintenance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          unitId,
          tenantId: unit?.currentTenantId,
          title,
          description,
          category,
          priority,
          estimatedCost: Number(estimatedCost),
          vendorName,
        }),
      });
      const data = await res.json();
      if (data.success) {
        showToast("Ticket d'incident créé avec succès !", "success");
        setIsAddOpen(false);
        setTitle("");
        setDescription("");
        triggerRefresh();
      }
    } catch {
      showToast("Erreur lors de la création du ticket", "error");
    }
  };

  const handleUpdateStatus = async (id: string, status: MaintenanceTicket["status"]) => {
    try {
      const res = await fetch("/api/maintenance", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      });
      const data = await res.json();
      if (data.success) {
        showToast("Statut de l'intervention mis à jour !", "success");
        triggerRefresh();
      }
    } catch {
      showToast("Erreur lors de la mise à jour", "error");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Wrench className="w-6 h-6 text-emerald-600" />
            <span>Gestion de la Maintenance & Travaux</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Suivi des pannes, validation des devis artisans et historiques d&apos;interventions.
          </p>
        </div>

        <button
          onClick={() => setIsAddOpen(true)}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md transition active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>Déclarer un Incident</span>
        </button>
      </div>

      {/* Tickets List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {tickets.map((tkt) => {
          let statusBadge = (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
              En cours
            </span>
          );
          if (tkt.status === "RESOLVED") {
            statusBadge = (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                Résolu
              </span>
            );
          } else if (tkt.status === "OPEN") {
            statusBadge = (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300">
                Nouveau
              </span>
            );
          }

          return (
            <div
              key={tkt.id}
              className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between hover:shadow-md transition"
            >
              <div>
                <div className="flex justify-between items-start mb-2">
                  <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                    {tkt.category}
                  </span>
                  {statusBadge}
                </div>

                <h3 className="font-extrabold text-sm text-slate-900 dark:text-white mt-1">
                  {tkt.title}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                  {tkt.description}
                </p>

                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 space-y-1 text-xs text-slate-600 dark:text-slate-300 my-3">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Lot :</span>
                    <span className="font-bold">{tkt.unitNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Locataire :</span>
                    <span>{tkt.tenantName}</span>
                  </div>
                  {tkt.estimatedCost && (
                    <div className="flex justify-between">
                      <span className="text-slate-400">Devis estimé :</span>
                      <span className="font-bold text-slate-900 dark:text-white">
                        {formatCurrency(tkt.estimatedCost, currency)}
                      </span>
                    </div>
                  )}
                  {tkt.vendorName && (
                    <div className="flex justify-between">
                      <span className="text-slate-400">Prestataire :</span>
                      <span>{tkt.vendorName}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Status Action */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center text-xs">
                {tkt.status !== "RESOLVED" ? (
                  <button
                    onClick={() => handleUpdateStatus(tkt.id, "RESOLVED")}
                    className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Marquer comme Résolu</span>
                  </button>
                ) : (
                  <div className="w-full text-center text-slate-400 font-semibold py-1">
                    Intervention clôturée
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal Add Ticket */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                Déclarer un Ticket d&apos;Incident
              </h3>
              <button onClick={() => setIsAddOpen(false)}>
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>
            <form onSubmit={handleCreate} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300">Lot concerné</label>
                <select
                  value={unitId}
                  onChange={(e) => setUnitId(e.target.value)}
                  className="w-full mt-1 px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                >
                  {units.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.unitNumber} ({u.buildingName})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300">Titre de la panne</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ex: Problème disjoncteur climatiseur"
                  className="w-full mt-1 px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                />
              </div>
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300">Description détaillée</label>
                <textarea
                  required
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Précisez la nature de la panne..."
                  className="w-full mt-1 px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300">Catégorie</label>
                  <select
                    value={category}
                    onChange={(e) =>
                      setCategory(e.target.value as MaintenanceTicket["category"])
                    }
                    className="w-full mt-1 px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                  >
                    <option value="PLUMBING">Plomberie</option>
                    <option value="ELECTRICITY">Électricité</option>
                    <option value="AC">Climatisation</option>
                    <option value="MASONRY">Maçonnerie</option>
                    <option value="OTHER">Autre</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300">Devis Estimé (FCFA)</label>
                  <input
                    type="number"
                    value={estimatedCost}
                    onChange={(e) => setEstimatedCost(Number(e.target.value))}
                    step={5000}
                    className="w-full mt-1 px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300">Priorité</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as MaintenanceTicket["priority"])}
                    className="w-full mt-1 px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                  >
                    <option value="LOW">Basse</option>
                    <option value="MEDIUM">Moyenne</option>
                    <option value="HIGH">Haute</option>
                    <option value="URGENT">Urgente</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300">Prestataire (optionnel)</label>
                  <input
                    type="text"
                    value={vendorName}
                    onChange={(e) => setVendorName(e.target.value)}
                    placeholder="Nom de l'artisan"
                    className="w-full mt-1 px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                  />
                </div>
              </div>
              <button
                type="submit"
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl mt-2 transition"
              >
                Créer l&apos;Ordre de Réparation
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
