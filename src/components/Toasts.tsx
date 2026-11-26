"use client";

import React from "react";
import { useApp } from "@/context/AppContext";
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from "lucide-react";

export function Toasts() {
  const { toasts, removeToast } = useApp();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-20 md:bottom-6 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => {
        let bg = "bg-slate-900 text-white border-slate-700";
        let Icon = Info;
        let iconColor = "text-sky-400";

        if (toast.type === "success") {
          bg = "bg-emerald-900/95 text-emerald-50 border-emerald-600 shadow-emerald-950/40";
          Icon = CheckCircle2;
          iconColor = "text-emerald-400";
        } else if (toast.type === "error") {
          bg = "bg-rose-950/95 text-rose-50 border-rose-600 shadow-rose-950/40";
          Icon = AlertCircle;
          iconColor = "text-rose-400";
        } else if (toast.type === "warning") {
          bg = "bg-amber-950/95 text-amber-50 border-amber-600 shadow-amber-950/40";
          Icon = AlertTriangle;
          iconColor = "text-amber-400";
        }

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-start gap-3 p-3.5 rounded-xl border shadow-xl backdrop-blur-md transition-all duration-300 animate-in fade-in slide-in-from-bottom-2 ${bg}`}
          >
            <Icon className={`w-5 h-5 shrink-0 mt-0.5 ${iconColor}`} />
            <p className="text-sm font-medium flex-1 leading-snug">{toast.message}</p>
            <button
              onClick={() => removeToast(toast.id)}
              className="text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
