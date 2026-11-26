"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ReceiptText,
  Building,
  Users,
  FileCheck2,
  MessageSquare,
  Wrench,
  Smartphone,
  ShieldCheck,
  CreditCard,
} from "lucide-react";

export const navItems = [
  { href: "/", label: "Tableau de Bord", icon: LayoutDashboard },
  { href: "/loyers", label: "Loyers & Échéances", icon: ReceiptText },
  { href: "/patrimoine", label: "Patrimoine & Lots", icon: Building },
  { href: "/locataires", label: "Locataires", icon: Users },
  { href: "/quittances", label: "Quittances Émises", icon: FileCheck2 },
  { href: "/relances", label: "Relances & SMS", icon: MessageSquare },
  { href: "/maintenance", label: "Maintenance", icon: Wrench },
  { href: "/locataire", label: "Espace Locataire", icon: Smartphone },
  { href: "/abonnement", label: "Mon Abonnement", icon: CreditCard },
  { href: "/parametres", label: "Paramètres", icon: ShieldCheck },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden lg:flex flex-col w-64 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 min-h-[calc(100vh-4rem)] p-4 shrink-0 no-print">
      <div className="space-y-1">
        <p className="px-3 text-[11px] font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider mb-2">
          Gestion Opérationnelle
        </p>
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                isActive
                  ? "bg-emerald-600 text-white shadow-md shadow-emerald-700/20 font-bold"
                  : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
            >
              <Icon className={`w-4 h-4 shrink-0 ${isActive ? "text-white" : "text-slate-500 dark:text-slate-400"}`} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>

      <div className="mt-auto pt-6 border-t border-slate-200 dark:border-slate-800 space-y-3">
        <div className="p-3 bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/40 dark:to-teal-950/20 border border-emerald-200 dark:border-emerald-800 rounded-xl">
          <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-bold text-xs mb-1">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Conformité Légale</span>
          </div>
          <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-tight">
            Quittances certifiées avec QR Code d&apos;authenticité inviolable.
          </p>
        </div>
      </div>
    </aside>
  );
}

export function MobileBottomNav() {
  const pathname = usePathname();

  // Mobile navigation uses 5 primary tabs
  const mobileTabs = [
    { href: "/", label: "Accueil", icon: LayoutDashboard },
    { href: "/loyers", label: "Loyers", icon: ReceiptText },
    { href: "/patrimoine", label: "Biens", icon: Building },
    { href: "/quittances", label: "Quittances", icon: FileCheck2 },
    { href: "/locataire", label: "Locataire", icon: Smartphone },
  ];

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur border-t border-slate-200 dark:border-slate-800 px-2 py-1.5 flex items-center justify-around no-print shadow-lg">
      {mobileTabs.map((tab) => {
        const isActive = pathname === tab.href;
        const Icon = tab.icon;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-lg transition-colors ${
              isActive
                ? "text-emerald-600 dark:text-emerald-400 font-bold"
                : "text-slate-700 dark:text-slate-400 hover:text-slate-900"
            }`}
          >
            <Icon className="w-5 h-5 mb-0.5" />
            <span className="text-[10px] tracking-tight">{tab.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
