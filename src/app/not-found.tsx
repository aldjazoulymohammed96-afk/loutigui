import Link from "next/link";
import { Home } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6 text-center">
      <h2 className="text-4xl font-black text-emerald-400 mb-2">404</h2>
      <p className="text-lg font-bold text-slate-200 mb-6">Page introuvable</p>
      <Link
        href="/"
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs transition"
      >
        <Home className="w-4 h-4" />
        <span>Retour à l&apos;accueil</span>
      </Link>
    </div>
  );
}
