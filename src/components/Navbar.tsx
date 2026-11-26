"use client";

import React from "react";
import Link from "next/link";
import { useApp } from "@/context/AppContext";
import { useAuth } from "@/context/AuthContext";

import {
  Building2,
  WifiOff,
  RefreshCw,
  CreditCard,
  UserCheck,
  LogOut,
  Settings,
} from "lucide-react";

export function Navbar({ onOpenEncaissement }: { onOpenEncaissement?: () => void }) {
  const {
    currency,
    setCurrency,
    isOnline,
    offlineQueueCount,
    syncOfflineQueue,
  } = useApp();

  const { organization, logout } = useAuth();

  return (
    <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur border-b border-slate-200 dark:border-slate-800 no-print">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Brand & Organization Name */}
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-800 flex items-center justify-center text-white shadow-md shadow-emerald-700/20 group-hover:scale-105 transition-transform">
              <Building2 className="w-5 h-5 text-emerald-100" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-emerald-700 via-teal-800 to-slate-900 dark:from-emerald-400 dark:to-teal-200 bg-clip-text text-transparent">
                  LOUTIGUI
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                  Proptech
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium hidden sm:block truncate max-w-[200px]">
                {organization?.name || "Patrimoine Immobilier"}
              </p>
            </div>
          </Link>
        </div>

        {/* Center / Right controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Online/Offline status pill */}
          <div
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
              isOnline
                ? "bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800"
                : "bg-amber-100 text-amber-800 border border-amber-300 animate-pulse"
            }`}
            title={isOnline ? "Réseau connecté" : "Mode hors-ligne actif"}
          >
            {isOnline ? (
              <>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="hidden sm:inline">En ligne</span>
              </>
            ) : (
              <>
                <WifiOff className="w-3.5 h-3.5" />
                <span>Hors-ligne ({offlineQueueCount})</span>
              </>
            )}
          </div>

          {/* Sync Offline Queue */}
          {isOnline && offlineQueueCount > 0 && (
            <button
              onClick={syncOfflineQueue}
              className="flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-full bg-blue-600 text-white hover:bg-blue-700 transition"
            >
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              <span>Synchro ({offlineQueueCount})</span>
            </button>
          )}

          {/* Currency Switcher */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-lg p-0.5 border border-slate-200 dark:border-slate-700">
            <button
              onClick={() => setCurrency("XOF")}
              className={`px-2.5 py-1 text-xs font-bold rounded-md transition ${
                currency === "XOF"
                  ? "bg-white dark:bg-slate-700 text-emerald-700 dark:text-emerald-300 shadow-sm"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
              }`}
              title="Franc CFA (XOF)"
            >
              FCFA
            </button>
            <button
              onClick={() => setCurrency("EUR")}
              className={`px-2 py-1 text-xs font-bold rounded-md transition ${
                currency === "EUR"
                  ? "bg-white dark:bg-slate-700 text-emerald-700 dark:text-emerald-300 shadow-sm"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
              }`}
              title="Euro (€) pour Diaspora"
            >
              € EUR
            </button>
            <button
              onClick={() => setCurrency("USD")}
              className={`px-2 py-1 text-xs font-bold rounded-md transition ${
                currency === "USD"
                  ? "bg-white dark:bg-slate-700 text-emerald-700 dark:text-emerald-300 shadow-sm"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
              }`}
              title="Dollar ($) pour Diaspora"
            >
              $ USD
            </button>
          </div>

          {/* Express Collection Action Button */}
          {onOpenEncaissement && (
            <button
              onClick={() => onOpenEncaissement()}
              className="flex items-center gap-1.5 bg-gradient-to-r from-emerald-600 to-teal-700 text-white text-xs sm:text-sm font-bold px-3.5 py-2 rounded-xl shadow-md shadow-emerald-700/25 hover:from-emerald-700 hover:to-teal-800 active:scale-95 transition"
            >
              <CreditCard className="w-4 h-4" />
              <span>Encaisser</span>
            </button>
          )}

          {/* Link to Tenant Portal */}
          <Link
            href="/locataire"
            className="hidden xl:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-emerald-600 transition"
            title="Accéder au portail libre-service locataire"
          >
            <UserCheck className="w-4 h-4 text-emerald-600" />
            <span>Portail Locataire</span>
          </Link>

          {/* User & Logout */}
          <div className="flex items-center gap-1 border-l border-slate-200 dark:border-slate-800 pl-2">
            <Link
              href="/parametres"
              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-white transition"
              title="Paramètres de l'agence"
            >
              <Settings className="w-4 h-4" />
            </Link>
            <button
              onClick={logout}
              className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition"
              title="Se déconnecter"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
