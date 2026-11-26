"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, ReactNode } from "react";
import { User, Organization, Currency, UserRole } from "@/types";
import { clearQueryCache } from "@/lib/api-client";

interface AuthContextType {
  user: User | null;
  organization: Organization | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (identifier: string, password?: string) => Promise<boolean>;
  register: (data: {
    name: string;
    phone: string;
    email?: string;
    password?: string;
    role?: UserRole;
    startEmpty?: boolean;
  }) => Promise<{ ok: boolean; error?: string }>;
  logout: () => Promise<void>;
  updateUser: (updates: Partial<User>) => void;
  completeOnboarding: (data: {
    orgName: string;
    countryCode: string;
    defaultCurrency: Currency;
    managementType: "OWNER" | "AGENCY" | "DIASPORA";
    paymentDueDay?: number;
    gracePeriodDays?: number;
    lateFeePercentage?: number;
    startEmpty: boolean;
  }) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // The session lives in an HttpOnly cookie: the browser cannot read or forge
  // it, and no credential is ever stored in localStorage.
  useEffect(() => {
    let cancelled = false;

    const loadSession = async () => {
      try {
        const res = await fetch("/api/auth/me", { cache: "no-store" });
        if (!res.ok) return;
        const json = await res.json();
        if (!cancelled && json?.success && json.data) {
          setUser(json.data.user);
          setOrganization(json.data.organization);
        }
      } catch {
        // Offline or server unavailable: stay unauthenticated.
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    loadSession();
    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(async (identifier: string, password?: string): Promise<boolean> => {
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier, password }),
      });
      const data = await res.json();
      if (res.ok && data.success && data.data) {
        setUser(data.data.user);
        setOrganization(data.data.organization);
        clearQueryCache();
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }, []);

  const register = useCallback(
    async (formData: {
      name: string;
      phone: string;
      email?: string;
      password?: string;
      role?: UserRole;
      startEmpty?: boolean;
    }): Promise<{ ok: boolean; error?: string }> => {
      try {
        const res = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });
        const data = await res.json();
        if (res.ok && data.success && data.data) {
          setUser(data.data.user);
          setOrganization(data.data.organization);
          clearQueryCache();
          return { ok: true };
        }
        return { ok: false, error: data.error || "Une erreur est survenue lors de l'inscription." };
      } catch {
        return { ok: false, error: "Erreur de connexion au serveur." };
      }
    },
    []
  );

  const logout = useCallback(async (): Promise<void> => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {
      // Even if the network call fails, clear the local state.
    }
    setUser(null);
    setOrganization(null);
    clearQueryCache();
    if (typeof window !== "undefined") {
      window.location.href = "/";
    }
  }, []);

  const updateUser = useCallback((updates: Partial<User>) => {
    setUser((prev) => {
      if (!prev) return prev;
      const next: User = { ...prev, ...updates };
      delete next.password;
      delete next.passwordHash;
      return next;
    });
  }, []);

  const completeOnboarding = useCallback(
    async (setupData: {
      orgName: string;
      countryCode: string;
      defaultCurrency: Currency;
      managementType: "OWNER" | "AGENCY" | "DIASPORA";
      paymentDueDay?: number;
      gracePeriodDays?: number;
      lateFeePercentage?: number;
      startEmpty: boolean;
    }): Promise<boolean> => {
      try {
        const res = await fetch("/api/auth/onboarding", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(setupData),
        });
        const data = await res.json();
        if (res.ok && data.success && data.data) {
          setOrganization(data.data);
          clearQueryCache();
          return true;
        }
        return false;
      } catch {
        return false;
      }
    },
    []
  );

  const value = useMemo(
    () => ({
      user,
      organization,
      isAuthenticated: !!user,
      isLoading,
      login,
      register,
      logout,
      updateUser,
      completeOnboarding,
    }),
    [user, organization, isLoading, login, register, logout, updateUser, completeOnboarding]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
