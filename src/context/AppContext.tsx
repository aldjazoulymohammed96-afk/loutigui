"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  ReactNode,
} from "react";
import { Currency } from "@/types";
import { formatCurrency } from "@/lib/utils";
import { clearQueryCache } from "@/lib/api-client";

interface Toast {
  id: string;
  message: string;
  type: "success" | "error" | "info" | "warning";
}

interface AppContextType {
  currency: Currency;
  setCurrency: (c: Currency) => void;
  formatAmount: (amount: number) => string;
  isOnline: boolean;
  offlineQueueCount: number;
  addOfflinePayment: (data: unknown) => void;
  syncOfflineQueue: () => Promise<void>;
  toasts: Toast[];
  showToast: (message: string, type?: Toast["type"]) => void;
  removeToast: (id: string) => void;
  refreshTrigger: number;
  triggerRefresh: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [currency, setCurrencyState] = useState<Currency>("XOF");
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [offlineQueue, setOfflineQueue] = useState<unknown[]>([]);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [refreshTrigger, setRefreshTrigger] = useState<number>(0);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    (message: string, type: Toast["type"] = "success") => {
      const id = Math.random().toString(36).substring(2, 9);
      setToasts((prev) => [...prev, { id, message, type }]);
      setTimeout(() => removeToast(id), 4500);
    },
    [removeToast]
  );

  const triggerRefresh = useCallback(() => {
    // Drop the client cache so the next render fetches authoritative data.
    clearQueryCache();
    setRefreshTrigger((prev) => prev + 1);
  }, []);

  useEffect(() => {
    // Check initial online status
    if (typeof window !== "undefined") {
      setIsOnline(navigator.onLine);

      const handleOnline = () => {
        setIsOnline(true);
        showToast("Connexion réseau rétablie. Synchronisation...", "info");
      };

      const handleOffline = () => {
        setIsOnline(false);
        showToast("Mode Hors-Ligne actif. Vos encaissements seront stockés localement.", "warning");
      };

      // Register Service Worker for PWA Offline-First
      if ("serviceWorker" in navigator) {
        navigator.serviceWorker
          .register("/sw.js")
          .catch((err) => console.warn("SW registration skipped:", err));
      }

      window.addEventListener("online", handleOnline);
      window.addEventListener("offline", handleOffline);

      // Load saved preferences
      const savedCur = localStorage.getItem("loutigui_currency") as Currency;
      if (savedCur) setCurrencyState(savedCur);

      const savedQueue = localStorage.getItem("loutigui_offline_queue");
      if (savedQueue) {
        try {
          setOfflineQueue(JSON.parse(savedQueue));
        } catch {
          localStorage.removeItem("loutigui_offline_queue");
        }
      }

      return () => {
        window.removeEventListener("online", handleOnline);
        window.removeEventListener("offline", handleOffline);
      };
    }
  }, [showToast]);

  const setCurrency = useCallback((c: Currency) => {
    setCurrencyState(c);
    if (typeof window !== "undefined") {
      localStorage.setItem("loutigui_currency", c);
    }
  }, []);

  const formatAmount = useCallback(
    (amount: number) => formatCurrency(amount, currency),
    [currency]
  );

  const addOfflinePayment = useCallback(
    (data: unknown) => {
      setOfflineQueue((prev) => {
        const nextQueue = [...prev, { ...(data as object), queuedAt: new Date().toISOString() }];
        if (typeof window !== "undefined") {
          localStorage.setItem("loutigui_offline_queue", JSON.stringify(nextQueue));
        }
        return nextQueue;
      });
      showToast("Encaissement enregistré hors ligne avec succès dans la file d'attente.", "info");
    },
    [showToast]
  );

  const syncOfflineQueue = useCallback(async () => {
    if (offlineQueue.length === 0) return;
    const pending: unknown[] = [];
    let synced = 0;

    try {
      for (const item of offlineQueue) {
        const res = await fetch("/api/payments", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(item),
        });
        if (res.ok) synced += 1;
        else pending.push(item);
      }

      setOfflineQueue(pending);
      if (typeof window !== "undefined") {
        if (pending.length === 0) localStorage.removeItem("loutigui_offline_queue");
        else localStorage.setItem("loutigui_offline_queue", JSON.stringify(pending));
      }

      if (synced > 0) triggerRefresh();
      if (pending.length === 0) {
        showToast(`${synced} encaissement(s) synchronisé(s) avec succès !`, "success");
      } else {
        showToast(
          `${synced} synchronisé(s), ${pending.length} en attente (échéance déjà réglée ou donnée invalide).`,
          "warning"
        );
      }
    } catch {
      showToast("Échec de synchronisation. Nouvel essai dès rétablissement du réseau.", "error");
    }
  }, [offlineQueue, showToast, triggerRefresh]);

  // Memoize the context value so consumers do not re-render on every provider
  // state change (toasts, offline queue, etc.).
  const value = useMemo<AppContextType>(
    () => ({
      currency,
      setCurrency,
      formatAmount,
      isOnline,
      offlineQueueCount: offlineQueue.length,
      addOfflinePayment,
      syncOfflineQueue,
      toasts,
      showToast,
      removeToast,
      refreshTrigger,
      triggerRefresh,
    }),
    [
      currency,
      setCurrency,
      formatAmount,
      isOnline,
      offlineQueue.length,
      addOfflinePayment,
      syncOfflineQueue,
      toasts,
      showToast,
      removeToast,
      refreshTrigger,
      triggerRefresh,
    ]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useApp must be used within an AppProvider");
  }
  return context;
}
