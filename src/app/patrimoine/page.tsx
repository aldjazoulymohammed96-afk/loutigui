"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Building, Unit } from "@/types";
import { useApp } from "@/context/AppContext";
import { formatCurrency } from "@/lib/utils";
import { readApiJson, useApiQuery } from "@/lib/api-client";
import { Building2, Plus, MapPin, X, DoorOpen, Eye } from "lucide-react";

export default function PatrimoinePage() {
  const { currency, refreshTrigger, triggerRefresh, showToast } = useApp();
  const { data: properties } = useApiQuery<{ buildings: Building[]; units: Unit[] }>(
    "properties",
    "/api/properties",
    { refreshKey: refreshTrigger }
  );
  const buildings = useMemo(() => properties?.buildings ?? [], [properties]);
  const units = useMemo(() => properties?.units ?? [], [properties]);
  const [selectedBuildingId, setSelectedBuildingId] = useState<string>("ALL");
  const [viewTab, setViewTab] = useState<"lots" | "buildings">("lots");

  // New building modal
  const [isAddBuildingOpen, setIsAddBuildingOpen] = useState(false);
  const [newBldName, setNewBldName] = useState("");
  const [newBldCity, setNewBldCity] = useState("Abidjan");
  const [newBldNeighborhood, setNewBldNeighborhood] = useState("Cocody");
  const [newBldAddress, setNewBldAddress] = useState("");
  const [createInitialUnit, setCreateInitialUnit] = useState(true);
  const [initialUnitName, setInitialUnitName] = useState("Logement Principal");
  const [initialUnitRent, setInitialUnitRent] = useState(250000);

  // New unit modal
  const [isAddUnitOpen, setIsAddUnitOpen] = useState(false);
  const [unitBldId, setUnitBldId] = useState("");
  const [unitNumber, setUnitNumber] = useState("");
  const [unitType, setUnitType] = useState<Unit["type"]>("APARTMENT");
  const [unitRent, setUnitRent] = useState(250000);
  const [unitCharges, setUnitCharges] = useState(20000);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (buildings.length > 0 && !unitBldId) setUnitBldId(buildings[0].id);
    // If the owner has buildings but no units yet, show the buildings tab directly.
    if (units.length === 0 && buildings.length > 0 && viewTab !== "buildings") {
      setViewTab("buildings");
    }
  }, [buildings, units, unitBldId, viewTab]);

  const handleCreateBuilding = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/properties", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create_building",
          name: newBldName,
          city: newBldCity,
          neighborhood: newBldNeighborhood,
          address: newBldAddress || `${newBldNeighborhood}, ${newBldCity}`,
          country: "Côte d'Ivoire",
          totalUnits: createInitialUnit ? 1 : 0,
        }),
      });
      const data = await readApiJson(res);
      if (data.success) {
        const createdBld = data.data;

        // If user opted to create the initial unit automatically (e.g. for a standalone villa, shop or house)
        if (createInitialUnit && createdBld?.id) {
          await fetch("/api/properties", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              action: "create_unit",
              buildingId: createdBld.id,
              buildingName: createdBld.name,
              unitNumber: initialUnitName || "Lot 01",
              type: "VILLA",
              surfaceM2: 120,
              roomsCount: 4,
              rentAmount: Number(initialUnitRent),
              chargesAmount: 0,
              depositAmount: Number(initialUnitRent) * 2,
              status: "VACANT",
            }),
          });
        }

        showToast("Bien ajouté avec succès au patrimoine !", "success");
        setIsAddBuildingOpen(false);
        setNewBldName("");
        setNewBldAddress("");
        triggerRefresh();
      } else {
        showToast(data.error || "Erreur lors de la création", "error");
      }
    } catch {
      showToast("Erreur réseau lors de la création", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateUnit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    const bld = buildings.find((b) => b.id === unitBldId) || buildings[0];
    try {
      const res = await fetch("/api/properties", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create_unit",
          buildingId: bld?.id || unitBldId,
          buildingName: bld?.name || "Immeuble",
          unitNumber,
          type: unitType,
          surfaceM2: 80,
          roomsCount: 3,
          rentAmount: Number(unitRent),
          chargesAmount: Number(unitCharges),
          depositAmount: Number(unitRent) * 2,
          status: "VACANT",
        }),
      });
      const data = await readApiJson(res);
      if (data.success) {
        showToast("Nouveau lot créé avec succès !", "success");
        setIsAddUnitOpen(false);
        setUnitNumber("");
        setViewTab("lots");
        triggerRefresh();
      } else {
        showToast(data.error || "Erreur lors de la création", "error");
      }
    } catch {
      showToast("Erreur réseau lors de la création", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredUnits = useMemo(
    () =>
      selectedBuildingId === "ALL"
        ? units
        : units.filter((u) => u.buildingId === selectedBuildingId),
    [units, selectedBuildingId]
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Building2 className="w-6 h-6 text-emerald-600" />
            <span>Patrimoine & Logements</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Gestion du parc immobilier, immeubles, lots et suivi d&apos;occupation en temps réel.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsAddBuildingOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-bold text-slate-800 dark:text-slate-200 transition shadow-sm"
          >
            <Plus className="w-3.5 h-3.5 text-emerald-600" />
            <span>Nouveau Bien / Immeuble</span>
          </button>
          <button
            onClick={() => {
              if (buildings.length === 0) {
                showToast("Veuillez d'abord ajouter un immeuble ou bien", "info");
                setIsAddBuildingOpen(true);
              } else {
                setIsAddUnitOpen(true);
              }
            }}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md transition active:scale-95"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Ajouter un Lot</span>
          </button>
        </div>
      </div>

      {/* Main Navigation Tabs */}
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewTab("lots")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-extrabold transition ${
              viewTab === "lots"
                ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/20"
                : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900"
            }`}
          >
            <DoorOpen className="w-4 h-4" />
            <span>Lots & Logements ({units.length})</span>
          </button>

          <button
            onClick={() => setViewTab("buildings")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-extrabold transition ${
              viewTab === "buildings"
                ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/20"
                : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900"
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>Immeubles & Biens ({buildings.length})</span>
          </button>
        </div>

        {viewTab === "lots" && buildings.length > 1 && (
          <div className="hidden sm:flex items-center gap-1.5 overflow-x-auto">
            <button
              onClick={() => setSelectedBuildingId("ALL")}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition ${
                selectedBuildingId === "ALL"
                  ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900"
                  : "text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
            >
              Tous
            </button>
            {buildings.map((b) => (
              <button
                key={b.id}
                onClick={() => setSelectedBuildingId(b.id)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition truncate max-w-[150px] ${
                  selectedBuildingId === b.id
                    ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900"
                    : "text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                }`}
              >
                {b.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* VIEW 1: LOTS / UNITS */}
      {viewTab === "lots" && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredUnits.length > 0 ? (
              filteredUnits.map((unit) => (
                <div
                  key={unit.id}
                  className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between hover:shadow-md transition"
                >
                  <div>
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                          <Building2 className="w-3 h-3 text-emerald-600" />
                          {unit.buildingName || "Bien"}
                        </span>
                        <h3 className="font-extrabold text-base text-slate-900 dark:text-white mt-0.5">
                          {unit.unitNumber}
                        </h3>
                      </div>
                      <span
                        className={`text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full ${
                          unit.status === "OCCUPIED"
                            ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800"
                            : "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300 dark:border-amber-800"
                        }`}
                      >
                        {unit.status === "OCCUPIED" ? "Occupé" : "Vacant / Disponible"}
                      </span>
                    </div>

                    <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 space-y-1.5 text-xs my-3">
                      <div className="flex justify-between text-slate-600 dark:text-slate-400">
                        <span>Loyer Mensuel :</span>
                        <span className="font-extrabold text-slate-900 dark:text-white">
                          {formatCurrency(unit.rentAmount, currency)}
                        </span>
                      </div>
                      {unit.chargesAmount > 0 && (
                        <div className="flex justify-between text-slate-600 dark:text-slate-400">
                          <span>Charges :</span>
                          <span>{formatCurrency(unit.chargesAmount, currency)}</span>
                        </div>
                      )}
                      <div className="flex justify-between text-slate-600 dark:text-slate-400">
                        <span>Type :</span>
                        <span className="font-medium capitalize">{unit.type || "Appartement"}</span>
                      </div>
                    </div>

                    {unit.currentTenantName ? (
                      <div className="text-xs text-slate-600 dark:text-slate-300 flex items-center gap-1.5 p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-900">
                        <span className="text-slate-500">Locataire :</span>
                        <strong className="text-emerald-700 dark:text-emerald-400">
                          {unit.currentTenantName}
                        </strong>
                      </div>
                    ) : (
                      <div className="text-xs text-amber-600 dark:text-amber-400 font-semibold p-2 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-100 dark:border-amber-900 flex items-center justify-between">
                        <span>Prêt pour attribution</span>
                        <a
                          href="/locataires"
                          className="text-[11px] font-bold underline hover:text-amber-700"
                        >
                          Attribuer &rarr;
                        </a>
                      </div>
                    )}
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center text-[11px] text-slate-500">
                    <span>CIE: {unit.electricityMeter || "Standard"}</span>
                    <span>SODECI: {unit.waterMeter || "Standard"}</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full p-12 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-4">
                <div className="w-16 h-16 rounded-2xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 flex items-center justify-center mx-auto">
                  <DoorOpen className="w-8 h-8" />
                </div>
                <div className="max-w-md mx-auto space-y-1">
                  <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                    {buildings.length > 0
                      ? "Aucun lot rattaché pour le moment"
                      : "Votre patrimoine est encore vide"}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {buildings.length > 0
                      ? "Vous avez enregistré un bien. Ajoutez maintenant vos appartements, studios, villas ou boutiques."
                      : "Commencez par créer votre premier bien (villa, immeuble, magasin) pour enregistrer vos logements."}
                  </p>
                </div>
                <div className="flex justify-center gap-3">
                  {buildings.length > 0 ? (
                    <button
                      onClick={() => setIsAddUnitOpen(true)}
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Ajouter un Lot</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => setIsAddBuildingOpen(true)}
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Créer mon Premier Bien</span>
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* VIEW 2: BUILDINGS / PROPERTIES */}
      {viewTab === "buildings" && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {buildings.length > 0 ? (
              buildings.map((bld) => {
                const bldUnits = units.filter((u) => u.buildingId === bld.id);
                const occupiedCount = bldUnits.filter((u) => u.status === "OCCUPIED").length;
                return (
                  <div
                    key={bld.id}
                    className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between hover:shadow-md transition space-y-4"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 flex items-center justify-center">
                            <Building2 className="w-6 h-6" />
                          </div>
                          <div>
                            <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                              {bld.name}
                            </h3>
                            <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                              <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <span>{bld.neighborhood}, {bld.city}</span>
                            </p>
                          </div>
                        </div>
                        <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                          {bldUnits.length} lot{bldUnits.length > 1 ? "s" : ""}
                        </span>
                      </div>

                      {bld.address && (
                        <p className="text-xs text-slate-600 dark:text-slate-400 mt-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                          <strong>Adresse :</strong> {bld.address}
                        </p>
                      )}

                      <div className="grid grid-cols-2 gap-2 mt-3 pt-2 text-xs">
                        <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                          <span className="text-[10px] text-slate-400 block uppercase font-bold">Occupés</span>
                          <span className="font-extrabold text-emerald-600 dark:text-emerald-400 text-sm">
                            {occupiedCount} / {bldUnits.length}
                          </span>
                        </div>
                        <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                          <span className="text-[10px] text-slate-400 block uppercase font-bold">Disponibles</span>
                          <span className="font-extrabold text-amber-600 dark:text-amber-400 text-sm">
                            {bldUnits.length - occupiedCount}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-2 flex items-center gap-2">
                      <button
                        onClick={() => {
                          setUnitBldId(bld.id);
                          setIsAddUnitOpen(true);
                        }}
                        className="flex-1 flex items-center justify-center gap-1 py-2 px-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 font-bold text-xs transition"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Ajouter un Lot</span>
                      </button>
                      <button
                        onClick={() => {
                          setSelectedBuildingId(bld.id);
                          setViewTab("lots");
                        }}
                        className="flex items-center justify-center gap-1 py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 font-bold text-xs transition"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Voir</span>
                      </button>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="col-span-full p-12 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-4">
                <div className="w-16 h-16 rounded-2xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 flex items-center justify-center mx-auto">
                  <Building2 className="w-8 h-8" />
                </div>
                <div className="max-w-md mx-auto space-y-1">
                  <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                    Aucun immeuble ou bien enregistré
                  </h3>
                  <p className="text-xs text-slate-500">
                    Enregistrez votre première résidence, villa ou immeuble pour commencer.
                  </p>
                </div>
                <button
                  onClick={() => setIsAddBuildingOpen(true)}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition"
                >
                  <Plus className="w-4 h-4" />
                  <span>Ajouter un Bien</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal Add Building */}
      {isAddBuildingOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                <Building2 className="w-5 h-5 text-emerald-600" />
                <span>Nouveau Bien / Immeuble</span>
              </h3>
              <button onClick={() => setIsAddBuildingOpen(false)}>
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>
            <form onSubmit={handleCreateBuilding} className="space-y-3.5 text-xs">
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300">
                  Nom du Bien / Résidence / Villa
                </label>
                <input
                  type="text"
                  required
                  value={newBldName}
                  onChange={(e) => setNewBldName(e.target.value)}
                  placeholder="Ex: Villa Cocody Angré ou Résidence La Paix"
                  className="w-full mt-1 px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300">Ville</label>
                  <input
                    type="text"
                    required
                    value={newBldCity}
                    onChange={(e) => setNewBldCity(e.target.value)}
                    className="w-full mt-1 px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300">Quartier</label>
                  <input
                    type="text"
                    required
                    value={newBldNeighborhood}
                    onChange={(e) => setNewBldNeighborhood(e.target.value)}
                    placeholder="Ex: Riviera Golf"
                    className="w-full mt-1 px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300">Adresse Complète</label>
                <input
                  type="text"
                  value={newBldAddress}
                  onChange={(e) => setNewBldAddress(e.target.value)}
                  placeholder="Rue des Ambassades, Lot 402..."
                  className="w-full mt-1 px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              {/* Instant Lot Creation Toggle */}
              <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 space-y-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={createInitialUnit}
                    onChange={(e) => setCreateInitialUnit(e.target.checked)}
                    className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
                  />
                  <span className="font-bold text-emerald-900 dark:text-emerald-200">
                    Créer immédiatement le logement associé
                  </span>
                </label>
                <p className="text-[11px] text-emerald-700 dark:text-emerald-300 pl-6 leading-tight">
                  Idéal pour une villa, maison ou magasin unique. Crée le lot automatiquement pour pouvoir lui associer un locataire dès maintenant.
                </p>

                {createInitialUnit && (
                  <div className="pl-6 pt-2 space-y-2">
                    <div>
                      <label className="font-bold text-slate-700 dark:text-slate-300 block mb-0.5">
                        Désignation du logement
                      </label>
                      <input
                        type="text"
                        value={initialUnitName}
                        onChange={(e) => setInitialUnitName(e.target.value)}
                        placeholder="Ex: Villa Principale"
                        className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="font-bold text-slate-700 dark:text-slate-300 block mb-0.5">
                        Loyer mensuel prévu (FCFA)
                      </label>
                      <input
                        type="number"
                        value={initialUnitRent}
                        onChange={(e) => setInitialUnitRent(Number(e.target.value))}
                        step={5000}
                        className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold text-slate-900 dark:text-white"
                      />
                    </div>
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl mt-2 transition shadow-md"
              >
                {isSubmitting ? "Enregistrement..." : "Créer le Bien"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Modal Add Unit */}
      {isAddUnitOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                <DoorOpen className="w-5 h-5 text-emerald-600" />
                <span>Ajouter un Lot / Logement</span>
              </h3>
              <button onClick={() => setIsAddUnitOpen(false)}>
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>
            <form onSubmit={handleCreateUnit} className="space-y-3.5 text-xs">
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300">
                  Bien / Immeuble de rattachement
                </label>
                <select
                  value={unitBldId}
                  onChange={(e) => setUnitBldId(e.target.value)}
                  className="w-full mt-1 px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                >
                  {buildings.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name} ({b.neighborhood})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300">
                  Numéro / Désignation du Lot
                </label>
                <input
                  type="text"
                  required
                  value={unitNumber}
                  onChange={(e) => setUnitNumber(e.target.value)}
                  placeholder="Ex: Appartement A2 - 2ème étage"
                  className="w-full mt-1 px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300">Type de Logement</label>
                <select
                  value={unitType}
                  onChange={(e) => setUnitType(e.target.value as Unit["type"])}
                  className="w-full mt-1 px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                >
                  <option value="APARTMENT">Appartement</option>
                  <option value="STUDIO">Studio</option>
                  <option value="VILLA">Villa</option>
                  <option value="COMMERCIAL">Magasin / Bureau</option>
                  <option value="ROOM">Chambre</option>
                  <option value="FURNISHED">Meublé</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300">
                    Loyer Mensuel (FCFA)
                  </label>
                  <input
                    type="number"
                    required
                    value={unitRent}
                    onChange={(e) => setUnitRent(Number(e.target.value))}
                    step={5000}
                    className="w-full mt-1 px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300">
                    Charges (FCFA)
                  </label>
                  <input
                    type="number"
                    value={unitCharges}
                    onChange={(e) => setUnitCharges(Number(e.target.value))}
                    step={1000}
                    className="w-full mt-1 px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl mt-2 transition shadow-md"
              >
                {isSubmitting ? "Enregistrement..." : "Enregistrer le Lot"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
