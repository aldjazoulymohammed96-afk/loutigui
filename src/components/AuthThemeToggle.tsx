"use client";

import React, { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

const THEME_STORAGE_KEY = "loutigui-landing-theme";

/** Same persisted theme as the public landing, available on auth pages. */
export function AuthThemeToggle() {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    setIsDark(document.documentElement.getAttribute("data-lp-theme") === "dark");
  }, []);

  const toggle = () => {
    const next = !isDark;
    setIsDark(next);
    if (next) document.documentElement.setAttribute("data-lp-theme", "dark");
    else document.documentElement.removeAttribute("data-lp-theme");
    try {
      localStorage.setItem(THEME_STORAGE_KEY, next ? "dark" : "light");
    } catch {
      // Storage can be disabled; the choice still applies for this visit.
    }
  };

  return (
    <button
      type="button"
      onClick={toggle}
      className="fixed right-4 top-4 z-50 inline-flex h-11 w-11 items-center justify-center rounded-full border border-[var(--lp-border)] bg-[var(--lp-bg-elevated)] text-[var(--lp-text-muted)] shadow-[var(--lp-window-shadow)] transition hover:text-[var(--lp-text)]"
      aria-label={isDark ? "Activer le mode clair" : "Activer le mode sombre"}
      title={isDark ? "Mode clair" : "Mode sombre"}
    >
      {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
    </button>
  );
}
