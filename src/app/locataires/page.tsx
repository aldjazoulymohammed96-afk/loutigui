"use client";

import React, { useMemo, useState } from "react";
import { Tenant, Lease, Unit, Organization } from "@/types";
import { useApp } from "@/context/AppContext";
import { formatCurrency } from "@/lib/utils";
import { readApiJson, useApiQuery } from "@/lib/api-client";
import { Users, Plus, Phone, MessageSquare, Search, X, FileText, Home } from "lucide-react";
import { LazyContratBailModal as ContratBailModal } from "@/components/LazyModals";

export default function LocatairesPage() {
  const { currency, refreshTrigger, triggerRefresh, showToast } = useApp();
  const { data: tenants = [] } = useApiQuery<Tenant[]>("tenants", "/api/tenants", {
    refreshKey: refreshTrigger,
  });
  const { data: leases = [] } = useApiQuery<Lease[]>("leases", "/api/leases", {
    refreshKey: refreshTrigger,
  });
  const { data: properties } = useApiQuery<{ units: Unit[] }>(
    "properties",
    "/api/properties",
    { refreshKey: refreshTrigger }
  );
  const units = useMemo(() => properties?.units ?? [], [properties]);
  const { data: org = null } = useApiQuery<Organization | null>(
    "organization",
    "/api/organization",
    { refreshKey: refreshTrigger }
  );
  const [activeBail, setActiveBail] = useState<{
    lease: Lease;
    tenant: Tenant;
    unit: Unit;
    organization: Organization;
  } | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  // New Tenant Modal State
  const [isAddTenantOpen, setIsAddTenantOpen] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("+225");
  const [email, setEmail] = useState("");
  const [profession, setProfession] = useState("");
  const [employer, setEmployer] = useState("");
  const [identityNumber, setIdentityNumber] = useState("");
  const [assignUnitId, setAssignUnitId] = useState("");
  const [assignRent, setAssignRent] = useState(250000);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Assign Lease to Existing Tenant Modal State
  const [assignTenant, setAssignTenant] = useState<Tenant | null>(null);
  const [selectedUnitForTenant, setSelectedUnitForTenant] = useState("");
  const [modalRent, setModalRent] = useState(250000);

  const handleCreateTenant = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/tenants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName,
          lastName,
          phone,
          email,
          identityType: "CNI",
          identityNumber: identityNumber || "CI-EN-COURS",
          profession,
          employer,
        }),
      });
      const data = await readApiJson(res);
      if (data.success) {
        const createdTenant = data.data;

        // If an available unit was assigned immediately, create lease!
        if (assignUnitId && createdTenant?.id) {
          const unit = units.find((u) => u.id === assignUnitId);
          await fetch("/api/leases", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              unitId: assignUnitId,
              tenantId: createdTenant.id,
              leaseType: "RESIDENTIAL",
              startDate: new Date().toISOString().split("T")[0],
              rentAmount: Number(assignRent) || unit?.rentAmount || 250000,
              chargesAmount: unit?.chargesAmount || 0,
              depositAmount: (Number(assignRent) || unit?.rentAmount || 250000) * 2,
            }),
          });
        }

        showToast("Dossier locataire créé avec succès !", "success");
        setIsAddTenantOpen(false);
        setFirstName("");
        setLastName("");
        setEmail("");
        setProfession("");
        setEmployer("");
        setIdentityNumber("");
        setAssignUnitId("");
        triggerRefresh();
      } else {
        showToast(data.error || "Erreur lors de la création", "error");
      }
    } catch {
      showToast("Erreur lors de la création du locataire", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAssignLease = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignTenant || !selectedUnitForTenant) return;
    setIsSubmitting(true);
    const unit = units.find((u) => u.id === selectedUnitForTenant);
    try {
      const res = await fetch("/api/leases", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          unitId: selectedUnitForTenant,
          tenantId: assignTenant.id,
          leaseType: "RESIDENTIAL",
          startDate: new Date().toISOString().split("T")[0],
          rentAmount: Number(modalRent) || unit?.rentAmount || 250000,
          chargesAmount: unit?.chargesAmount || 0,
          depositAmount: (Number(modalRent) || unit?.rentAmount || 250000) * 2,
        }),
      });
      const d = await readApiJson(res);
      if (d.success) {
        showToast("Logement attribué et bail activé !", "success");
        setAssignTenant(null);
        setSelectedUnitForTenant("");
        triggerRefresh();
      } else {
        showToast(d.error || "Erreur lors de l'attribution", "error");
      }
    } catch {
      showToast("Erreur réseau", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const filtered = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return tenants;
    return tenants.filter(
      (t) =>
        t.firstName.toLowerCase().includes(term) ||
        t.lastName.toLowerCase().includes(term) ||
        t.phone.includes(term) ||
        (t.profession && t.profession.toLowerCase().includes(term))
    );
  }, [tenants, searchTerm]);

  const vacantUnits = useMemo(() => units.filter((u) => u.status !== "OCCUPIED"), [units]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Users className="w-6 h-6 text-emerald-600" />
            <span>Fiches Locataires & Dossiers</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Dossiers locataires, attribution de logements, baux officiels et contact direct.
          </p>
        </div>

        <button
          onClick={() => setIsAddTenantOpen(true)}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md transition active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>Nouveau Locataire</span>
        </button>
      </div>

      {/* Search Input & Stats */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div className="relative w-full max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Rechercher par nom, téléphone, profession..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-sm"
          />
        </div>
        <div className="text-xs text-slate-500 font-semibold">
          Total : <strong className="text-slate-900 dark:text-white">{tenants.length}</strong> locataire{tenants.length > 1 ? "s" : ""}
        </div>
      </div>

      {/* Tenants Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.length > 0 ? (
          filtered.map((tnt) => {
            const lease = leases.find((l) => l.tenantId === tnt.id);
            const unit = units.find((u) => u.id === lease?.unitId);

            return (
              <div
                key={tnt.id}
                className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between hover:shadow-md transition space-y-4"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-extrabold flex items-center justify-center text-base">
                        {tnt.firstName.charAt(0)}
                        {tnt.lastName.charAt(0)}
                      </div>
                      <div>
                        <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
                          {tnt.firstName} {tnt.lastName}
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {tnt.profession || "Particulier"}{" "}
                          {tnt.employer ? `(${tnt.employer})` : ""}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Housing Status Badge */}
                  <div className="mt-3">
                    {unit ? (
                      <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-bold">
                          <Home className="w-4 h-4 text-emerald-600" />
                          <span>{unit.buildingName || "Bien"} &bull; {unit.unitNumber}</span>
                        </div>
                        <span className="font-black text-slate-900 dark:text-white">
                          {formatCurrency(lease?.rentAmount || unit.rentAmount, currency)}
                        </span>
                      </div>
                    ) : (
                      <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 flex items-center justify-between text-xs">
                        <span className="text-amber-800 dark:text-amber-300 font-semibold">
                          Aucun logement attribué
                        </span>
                        <button
                          onClick={() => {
                            setAssignTenant(tnt);
                            if (vacantUnits.length > 0) {
                              setSelectedUnitForTenant(vacantUnits[0].id);
                              setModalRent(vacantUnits[0].rentAmount);
                            }
                          }}
                          className="px-2 py-1 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-[11px] font-bold transition"
                        >
                          + Attribuer un lot
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Contact & ID Details */}
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 space-y-1.5 text-xs text-slate-600 dark:text-slate-300 mt-3">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Téléphone :</span>
                      <strong className="text-slate-900 dark:text-white font-mono">{tnt.phone}</strong>
                    </div>
                    {tnt.email && (
                      <div className="flex justify-between">
                        <span className="text-slate-400">Email :</span>
                        <span className="truncate max-w-[170px]">{tnt.email}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-slate-400">Pièce ID :</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        {tnt.identityType} - {tnt.identityNumber}
                      </span>
                    </div>
                    {tnt.guarantorName && (
                      <div className="flex justify-between">
                        <span className="text-slate-400">Garant :</span>
                        <span className="font-semibold">{tnt.guarantorName}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Direct Communication & Lease Buttons */}
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <a
                      href={`tel:${tnt.phone}`}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 font-bold text-xs transition"
                    >
                      <Phone className="w-3.5 h-3.5 text-slate-500" />
                      <span>Appeler</span>
                    </a>

                    <a
                      href={`https://wa.me/${tnt.phone.replace(/[^0-9]/g, "")}`}
                      target="_blank"
                      rel="noreferrer"
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>WhatsApp</span>
                    </a>
                  </div>

                  {lease && unit && org ? (
                    <button
                      type="button"
                      onClick={() => {
                        setActiveBail({ lease, tenant: tnt, unit, organization: org });
                      }}
                      className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-800 dark:text-slate-200 font-bold text-xs transition"
                    >
                      <FileText className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Voir Contrat de Bail Officiel</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setAssignTenant(tnt);
                        if (vacantUnits.length > 0) {
                          setSelectedUnitForTenant(vacantUnits[0].id);
                          setModalRent(vacantUnits[0].rentAmount);
                        }
                      }}
                      className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl border border-emerald-300 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100 font-bold text-xs transition"
                    >
                      <Plus className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Attribuer un logement</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })
        ) : (
          <div className="col-span-full p-12 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 flex items-center justify-center mx-auto">
              <Users className="w-8 h-8" />
            </div>
            <div className="max-w-md mx-auto space-y-1">
              <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                Aucun locataire enregistré pour le moment
              </h3>
              <p className="text-xs text-slate-500">
                Créez la fiche de votre premier locataire avec son numéro WhatsApp et associez-le à un lot.
              </p>
            </div>
            <button
              onClick={() => setIsAddTenantOpen(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition"
            >
              <Plus className="w-4 h-4" />
              <span>Ajouter mon Premier Locataire</span>
            </button>
          </div>
        )}
      </div>

      {/* Modal Add Tenant */}
      {isAddTenantOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-emerald-600" />
                <span>Nouveau Locataire</span>
              </h3>
              <button onClick={() => setIsAddTenantOpen(false)}>
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>
            <form onSubmit={handleCreateTenant} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300">Prénom *</label>
                  <input
                    type="text"
                    required
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="Ex: Amadou"
                    className="w-full mt-1 px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300">Nom *</label>
                  <input
                    type="text"
                    required
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Ex: Diallo"
                    className="w-full mt-1 px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300">
                  Téléphone (WhatsApp pour les relances) *
                </label>
                <input
                  type="text"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+2250700000000"
                  className="w-full mt-1 px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                />
              </div>

              {/* Optional housing assignment directly at creation */}
              {vacantUnits.length > 0 && (
                <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 space-y-2">
                  <label className="font-bold text-emerald-900 dark:text-emerald-200 block">
                    Attribuer immédiatement un lot vacant (optionnel)
                  </label>
                  <select
                    value={assignUnitId}
                    onChange={(e) => {
                      const uId = e.target.value;
                      setAssignUnitId(uId);
                      const sel = vacantUnits.find((u) => u.id === uId);
                      if (sel) setAssignRent(sel.rentAmount);
                    }}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs"
                  >
                    <option value="">-- Aucun pour le moment (créer fiche seule) --</option>
                    {vacantUnits.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.buildingName} - {u.unitNumber} ({formatCurrency(u.rentAmount, currency)})
                      </option>
                    ))}
                  </select>

                  {assignUnitId && (
                    <div className="pt-1">
                      <label className="font-bold text-slate-700 dark:text-slate-300 block mb-0.5">
                        Loyer mensuel convenu (FCFA)
                      </label>
                      <input
                        type="number"
                        value={assignRent}
                        onChange={(e) => setAssignRent(Number(e.target.value))}
                        step={5000}
                        className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold text-slate-900 dark:text-white"
                      />
                    </div>
                  )}
                </div>
              )}

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300">Email (optionnel)</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="locataire@domaine.ci"
                  className="w-full mt-1 px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300">Profession</label>
                  <input
                    type="text"
                    value={profession}
                    onChange={(e) => setProfession(e.target.value)}
                    placeholder="Ex: Cadre Bancaire"
                    className="w-full mt-1 px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300">Employeur</label>
                  <input
                    type="text"
                    value={employer}
                    onChange={(e) => setEmployer(e.target.value)}
                    placeholder="Ex: Orange CI"
                    className="w-full mt-1 px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300">
                  N° Pièce d&apos;Identité (CNI / Passeport)
                </label>
                <input
                  type="text"
                  value={identityNumber}
                  onChange={(e) => setIdentityNumber(e.target.value)}
                  placeholder="Ex: CI00299104"
                  className="w-full mt-1 px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl mt-2 transition shadow-md"
              >
                {isSubmitting ? "Enregistrement..." : "Enregistrer le Locataire"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Modal Assign Unit to Existing Tenant */}
      {assignTenant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                <Home className="w-5 h-5 text-emerald-600" />
                <span>Attribuer un lot à {assignTenant.firstName} {assignTenant.lastName}</span>
              </h3>
              <button onClick={() => setAssignTenant(null)}>
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>
            <form onSubmit={handleAssignLease} className="space-y-3.5 text-xs">
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300">
                  Sélectionner un Lot Disponible
                </label>
                {vacantUnits.length > 0 ? (
                  <select
                    value={selectedUnitForTenant}
                    onChange={(e) => {
                      const uId = e.target.value;
                      setSelectedUnitForTenant(uId);
                      const sel = vacantUnits.find((u) => u.id === uId);
                      if (sel) setModalRent(sel.rentAmount);
                    }}
                    className="w-full mt-1 px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  >
                    {vacantUnits.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.buildingName} - {u.unitNumber} ({formatCurrency(u.rentAmount, currency)})
                      </option>
                    ))}
                  </select>
                ) : (
                  <p className="p-3 mt-1 rounded-xl bg-amber-50 text-amber-800 text-xs font-semibold">
                    Aucun lot vacant. Veuillez d&apos;abord créer un lot dans le menu Patrimoine.
                  </p>
                )}
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300">
                  Loyer Mensuel Convenu (FCFA)
                </label>
                <input
                  type="number"
                  required
                  value={modalRent}
                  onChange={(e) => setModalRent(Number(e.target.value))}
                  step={5000}
                  className="w-full mt-1 px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold text-slate-900 dark:text-white"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting || vacantUnits.length === 0}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl mt-2 transition shadow-md disabled:opacity-50"
              >
                {isSubmitting ? "Activation du bail..." : "Confirmer l'Attribution & Activer le Bail"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Bail Contract Modal */}
      {activeBail && (
        <ContratBailModal
          lease={activeBail.lease}
          tenant={activeBail.tenant}
          unit={activeBail.unit}
          organization={activeBail.organization}
          onClose={() => setActiveBail(null)}
        />
      )}
    </div>
  );
}
