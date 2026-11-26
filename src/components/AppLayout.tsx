"use client";

import React, { useCallback, useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Navbar } from "./Navbar";
import { Sidebar, MobileBottomNav } from "./Navigation";
import { Toasts } from "./Toasts";
import { LandingPage } from "./LandingPage";
import {
  LazyEncaissementModal as EncaissementModal,
  LazyQuittanceModal as QuittanceModal,
  LazyOnboardingWizard as OnboardingWizard,
} from "./LazyModals";
import TrialBanner from "./TrialBanner";
import SubscriptionPaywallModal from "./SubscriptionPaywallModal";
import { Receipt, Installment } from "@/types";

const PUBLIC_PREFIXES = [
  "/landing",
  "/login",
  "/signup",
  "/verify",
  "/forgot-password",
  "/reset-password",
];

export function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();

  const [isEncaissementOpen, setIsEncaissementOpen] = useState(false);
  const [selectedInstallment, setSelectedInstallment] = useState<Installment | null>(null);
  const [activeReceipt, setActiveReceipt] = useState<Receipt | null>(null);
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);

  const handleOpenEncaissement = useCallback((installment?: Installment) => {
    const valid =
      installment && typeof installment === "object" && typeof installment.id === "string"
        ? installment
        : null;
    setSelectedInstallment(valid);
    setIsEncaissementOpen(true);
  }, []);

  const handleEncaissementSuccess = (receipt: Receipt) => {
    setIsEncaissementOpen(false);
    setSelectedInstallment(null);
    setActiveReceipt(receipt);
  };

  const isPublicRoute = PUBLIC_PREFIXES.some((prefix) => pathname.startsWith(prefix));
  const isOnboardingRoute = pathname.startsWith("/onboarding");

  useEffect(() => {
    if (!isLoading && !isAuthenticated && !isPublicRoute && pathname !== "/") {
      router.replace("/login");
    }
  }, [isLoading, isAuthenticated, isPublicRoute, pathname, router]);

  if (isPublicRoute) {
    return (
      <div className="min-h-screen bg-[#f8fafc] text-slate-900 font-sans">
        {children}
        <Toasts />
      </div>
    );
  }

  if (pathname === "/" && !isAuthenticated && !isLoading) {
    return (
      <div className="min-h-screen bg-[#f8fafc] font-sans">
        <LandingPage />
        <Toasts />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin" />
        <Toasts />
      </div>
    );
  }

  if (isOnboardingRoute) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans">
        {children}
        <Toasts />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors duration-200">
      <TrialBanner />
      <Navbar onOpenEncaissement={() => handleOpenEncaissement()} />

      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full pb-24 lg:pb-8">
          {children}
        </main>
      </div>

      <MobileBottomNav />
      <Toasts />
      <SubscriptionPaywallModal />

      {isEncaissementOpen && (
        <EncaissementModal
          initialInstallment={selectedInstallment}
          onClose={() => {
            setIsEncaissementOpen(false);
            setSelectedInstallment(null);
          }}
          onSuccess={handleEncaissementSuccess}
        />
      )}

      {activeReceipt && (
        <QuittanceModal receipt={activeReceipt} onClose={() => setActiveReceipt(null)} />
      )}

      <OnboardingWizard
        isOpen={isOnboardingOpen}
        onClose={() => setIsOnboardingOpen(false)}
        onOpenEncaissement={() => handleOpenEncaissement()}
      />
    </div>
  );
}
