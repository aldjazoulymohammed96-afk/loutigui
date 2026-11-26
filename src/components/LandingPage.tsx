"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/context/AuthContext";
import {
  ArrowRight,
  ArrowUpRight,
  BadgeCheck,
  Building2,
  Check,
  CheckCircle2,
  ChevronDown,
  Clock3,
  FileCheck2,
  Gauge,
  Landmark,
  LockKeyhole,
  Menu,
  MessageCircleMore,
  Moon,
  Play,
  QrCode,
  Radio,
  ReceiptText,
  ShieldCheck,
  Sparkles,
  Sun,
  TrendingUp,
  Wallet,
  X,
  Zap,
} from "lucide-react";

type Plan = {
  name: string;
  audience: string;
  price: string;
  period: string;
  limit: string;
  features: string[];
  featured?: boolean;
  cta: string;
};

const PLANS: Plan[] = [
  {
    name: "Starter",
    audience: "Propriétaires particuliers",
    price: "10 000",
    period: "FCFA / mois",
    limit: "Jusqu'à 10 lots gérés",
    features: [
      "Encaissement Mobile Money intégré",
      "Quittances officielles avec QR Code",
      "Suivi des impayés et échéancier",
      "Support technique par WhatsApp",
    ],
    cta: "Choisir Starter",
  },
  {
    name: "Pro",
    audience: "Bailleurs et investisseurs",
    price: "25 000",
    period: "FCFA / mois",
    limit: "Jusqu'à 35 lots gérés",
    features: [
      "Tout le forfait Starter inclus",
      "Relances WhatsApp automatiques",
      "Générateur de baux conformes",
      "Gestion des demandes d'intervention",
      "Assistance prioritaire 7j/7",
    ],
    featured: true,
    cta: "Démarrer avec Pro",
  },
  {
    name: "Agence",
    audience: "Agences et syndics",
    price: "50 000",
    period: "FCFA / mois",
    limit: "Lots et immeubles illimités",
    features: [
      "Lots et immeubles illimités",
      "Accès multi-utilisateurs",
      "Rapports et exports Excel",
      "Onboarding personnalisé",
    ],
    cta: "Choisir Agence",
  },
];

const FAQ = [
  {
    q: "Puis-je encaisser par Wave, Orange Money, MTN et Moov en même temps ?",
    a: "Oui. Chaque règlement est rapproché de son échéance et la quittance est émise avec sa référence de transaction. Le raccordement aux passerelles de paiement est configuré côté serveur par vos soins ou par notre équipe.",
  },
  {
    q: "Les quittances avec QR Code sont-elles vérifiables ?",
    a: "Chaque quittance possède une référence de vérification unique et une page publique dédiée. Un banquier, un notaire ou un locataire peut confirmer le montant, la période et le bien en scannant simplement le QR code.",
  },
  {
    q: "Comment fonctionnent les relances automatiques ?",
    a: "Vous définissez les échéances et les canaux actifs. LOUTIGUI prépare les rappels courtois et les relances d'escalade avec le détail du loyer dû. Les envois SMS et email nécessitent vos identifiants de passerelle ; aucun message simulé n'est produit.",
  },
  {
    q: "Puis-je travailler sans connexion sur le terrain ?",
    a: "L'interface conserve les actions hors ligne dans une file d'attente locale et les réméthode au retour du réseau. Les écritures définitives restent validées par le serveur et votre organisation.",
  },
  {
    q: "Faut-il une carte bancaire pour créer un compte ?",
    a: "Non. L'inscription ne demande aucune carte bancaire. Le choix d'un forfait et son règlement interviennent après la création du compte.",
  },
];

const OPERATORS = [
  {
    name: "Wave",
    logo: "/images/payments/wave.png",
    code: "QR & Push",
    tagline: "Paiement instantané",
    detail: "Validation rapide et quittance envoyée au locataire.",
    color: "#00B6F0",
  },
  {
    name: "Orange Money",
    logo: "/images/payments/orange-money.png",
    code: "#144#",
    tagline: "Réseau national étendu",
    detail: "Confirmation par SMS et solde mis à jour immédiatement.",
    color: "#FF7900",
  },
  {
    name: "MTN MoMo",
    logo: "/images/payments/mtn-money.png",
    code: "*133#",
    tagline: "Réseau panafricain",
    detail: "Rapprochement en temps réel et preuve archivée.",
    color: "#FFCC00",
  },
  {
    name: "Moov Money",
    logo: "/images/payments/moov-money.png",
    code: "*155#",
    tagline: "Moov Africa CI",
    detail: "Encaissement sans délai avec quittance vérifiable.",
    color: "#38BDF8",
  },
];

const THEME_STORAGE_KEY = "loutigui-landing-theme";

function Reveal({
  children,
  className = "",
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  return (
    <div className={`reveal ${className}`} style={{ transitionDelay: `${delay}ms` }}>
      {children}
    </div>
  );
}

function SectionHeading({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description?: string;
}) {
  return (
    <div className="mx-auto max-w-2xl space-y-4 text-center">
      <span className="inline-flex items-center gap-2 rounded-full border border-[var(--lp-accent-border)] bg-[var(--lp-accent-soft)] px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--lp-accent-text)]">
        <Sparkles className="h-3.5 w-3.5" />
        {eyebrow}
      </span>
      <h2 className="text-balance text-3xl font-semibold tracking-tight text-[var(--lp-text)] sm:text-4xl md:text-5xl">
        {title}
      </h2>
      {description ? (
        <p className="mx-auto max-w-xl text-sm leading-7 text-[var(--lp-text-muted)] sm:text-base">
          {description}
        </p>
      ) : null}
    </div>
  );
}

export function LandingPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [lotsCount, setLotsCount] = useState(12);
  const [avgRent, setAvgRent] = useState(200000);
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [scrolled, setScrolled] = useState(false);
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });

    // The inline script in the page sets this attribute before hydration.
    setIsDark(document.documentElement.getAttribute("data-lp-theme") === "dark");

    const nodes = document.querySelectorAll(".reveal");
    if (!("IntersectionObserver" in window)) {
      nodes.forEach((node) => node.classList.add("is-visible"));
      return () => window.removeEventListener("scroll", onScroll);
    }
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.08 }
    );
    nodes.forEach((node) => observer.observe(node));
    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  const toggleTheme = () => {
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

  const totalMonthlyCollected = lotsCount * avgRent;
  const hoursSaved = Math.round(lotsCount * 1.8);
  const monthlyFees = 10000 * lotsCount;
  const netGain = Math.max(totalMonthlyCollected - monthlyFees, 0);
  const navLinks = [
    { href: "#paiements", label: "Paiements" },
    { href: "#fonctionnalites", label: "Fonctionnalités" },
    { href: "#simulateur", label: "Simulateur" },
    { href: "#tarifs", label: "Tarifs" },
    { href: "#faq", label: "FAQ" },
  ];

  return (
    <div className="landing-page relative min-h-screen overflow-x-hidden bg-[var(--lp-bg)] text-[var(--lp-text)]">
      {/* Ambient light, reduced when the user prefers less motion/transparency */}
      <div className="landing-glow pointer-events-none fixed inset-0 z-0" aria-hidden="true">
        <div className="absolute -top-40 left-[8%] h-[560px] w-[560px] rounded-full bg-[var(--lp-glow-1)] blur-[140px]" />
        <div className="absolute right-[2%] top-[22%] h-[520px] w-[520px] rounded-full bg-[var(--lp-glow-2)] blur-[150px]" />
        <div className="absolute bottom-[4%] left-[28%] h-[500px] w-[500px] rounded-full bg-[var(--lp-glow-3)] blur-[160px]" />
        <div className="landing-grid absolute inset-0 opacity-[var(--lp-grid-opacity)]" />
      </div>

      <header
        className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
          scrolled
            ? "border-b border-[var(--lp-header-border)] bg-[var(--lp-header-bg)] shadow-[0_16px_50px_-30px_rgba(15,23,42,0.25)] backdrop-blur-xl"
            : "border-b border-transparent bg-transparent"
        }`}
      >
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between gap-6 px-4 sm:px-6 lg:px-8">
          <Link href="/" className="group flex items-center gap-3" aria-label="LOUTIGUI – Accueil">
            <span className="relative flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-700 shadow-lg shadow-emerald-500/25 transition-transform duration-300 group-hover:-rotate-6 group-hover:scale-105">
              <Building2 className="h-5 w-5 text-slate-950" />
              <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full border-2 border-[var(--lp-bg)] bg-cyan-300" />
            </span>
            <span className="flex flex-col">
              <span className="text-xl font-semibold tracking-[0.16em] text-[var(--lp-text)]">
                LOUTIGUI
              </span>
              <span className="hidden text-[10px] font-medium tracking-wide text-[var(--lp-text-subtle)] sm:block">
                Gestion locative intelligente
              </span>
            </span>
          </Link>

          <nav className="hidden items-center gap-1 lg:flex" aria-label="Navigation principale">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="rounded-full px-4 py-2 text-sm font-medium text-[var(--lp-text-muted)] transition hover:bg-[var(--lp-hover-bg)] hover:text-[var(--lp-text)]"
              >
                {link.label}
              </a>
            ))}
          </nav>

          <div className="hidden items-center gap-2 sm:flex">
            {!isLoading &&
              (isAuthenticated ? (
                <Link
                  href="/"
                  className="group inline-flex items-center gap-2 rounded-full border border-[var(--lp-accent-border)] bg-[var(--lp-accent-soft)] px-5 py-2.5 text-sm font-semibold text-[var(--lp-accent-text)] transition hover:bg-[var(--lp-hover-bg)]"
                >
                  Tableau de bord
                  <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </Link>
              ) : (
                <>
                  <Link
                    href="/login"
                    className="rounded-full px-4 py-2.5 text-sm font-medium text-[var(--lp-text-muted)] transition hover:bg-[var(--lp-hover-bg)] hover:text-[var(--lp-text)]"
                  >
                    Connexion
                  </Link>
                  <Link
                    href="/signup"
                    className="group inline-flex items-center gap-2 rounded-full bg-[var(--lp-accent-solid)] px-5 py-2.5 text-sm font-semibold text-[var(--lp-accent-on)] shadow-lg shadow-[var(--lp-accent-shadow)] transition hover:bg-[var(--lp-accent-solid-hover)]"
                  >
                    Créer mon compte
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </Link>
                </>
              ))}
          </div>

          <button
            type="button"
            onClick={toggleTheme}
            className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-[var(--lp-border)] bg-[var(--lp-hover-bg)] text-[var(--lp-text-muted)] transition hover:text-[var(--lp-text)]"
            aria-label={isDark ? "Activer le mode clair" : "Activer le mode sombre"}
            title={isDark ? "Mode clair" : "Mode sombre"}
          >
            {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </button>

          <button
            type="button"
            onClick={() => setMobileMenuOpen((open) => !open)}
            className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-[var(--lp-border)] bg-[var(--lp-hover-bg)] text-[var(--lp-text)] lg:hidden"
            aria-label={mobileMenuOpen ? "Fermer le menu" : "Ouvrir le menu"}
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {mobileMenuOpen ? (
          <div className="border-t border-[var(--lp-header-border)] bg-[var(--lp-header-bg)] px-4 py-5 backdrop-blur-xl lg:hidden">
            <nav className="flex flex-col gap-1" aria-label="Navigation mobile">
              {navLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="rounded-xl px-4 py-3 text-sm font-medium text-[var(--lp-text)] hover:bg-[var(--lp-hover-bg)]"
                >
                  {link.label}
                </a>
              ))}
            </nav>
            <div className="mt-4 grid gap-2 border-t border-[var(--lp-border)] pt-4">
              {!isLoading &&
                (isAuthenticated ? (
                  <Link
                    href="/"
                    onClick={() => setMobileMenuOpen(false)}
                    className="rounded-full bg-[var(--lp-accent-solid)] px-5 py-3 text-center text-sm font-semibold text-[var(--lp-accent-on)]"
                  >
                    Tableau de bord
                  </Link>
                ) : (
                  <>
                    <Link
                      href="/login"
                      onClick={() => setMobileMenuOpen(false)}
                      className="rounded-full border border-[var(--lp-border-strong)] px-5 py-3 text-center text-sm font-semibold text-[var(--lp-text)]"
                    >
                      Connexion
                    </Link>
                    <Link
                      href="/signup"
                      onClick={() => setMobileMenuOpen(false)}
                      className="rounded-full bg-[var(--lp-accent-solid)] px-5 py-3 text-center text-sm font-semibold text-[var(--lp-accent-on)]"
                    >
                      Créer mon compte
                    </Link>
                  </>
                ))}
            </div>
          </div>
        ) : null}
      </header>

      <main className="relative z-10">
        {/* Hero */}
        <section className="relative px-4 pb-24 pt-36 sm:px-6 sm:pb-32 sm:pt-40 lg:px-8">
          <div className="mx-auto grid max-w-7xl items-center gap-14 lg:grid-cols-[1.05fr_0.95fr] lg:gap-10">
            <div className="max-w-2xl">
              <Reveal>
                <span className="inline-flex items-center gap-2 rounded-full border border-[var(--lp-accent-border)] bg-[var(--lp-accent-soft)] px-4 py-2 text-xs font-semibold text-[var(--lp-accent-text)]">
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--lp-accent-solid)] opacity-60" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-[var(--lp-accent-solid)]" />
                  </span>
                  Proptech pensée pour l&apos;Afrique francophone
                </span>
              </Reveal>

              <Reveal delay={90}>
                <h1 className="mt-7 text-balance text-4xl font-semibold leading-[1.08] tracking-tight text-[var(--lp-text)] sm:text-5xl lg:text-[3.65rem]">
                  Vos loyers rentrent à l&apos;heure.
                  <span
                    className="mt-2 block bg-clip-text text-transparent"
                    style={{ backgroundImage: "var(--lp-hero-gradient)" }}
                  >
                    Vos preuves aussi.
                  </span>
                </h1>
              </Reveal>

              <Reveal delay={170}>
                <p className="mt-6 max-w-xl text-base leading-8 text-[var(--lp-text-muted)] sm:text-lg">
                  LOUTIGUI réunit encaissements Mobile Money, quittances vérifiables, baux propres
                  et relances automatiques dans un seul espace. Moins de paperasse, plus de
                  tranquillité — même avec dix locataires.
                </p>
              </Reveal>

              <Reveal delay={250}>
                <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                  <Link
                    href="/signup"
                    className="group inline-flex items-center justify-center gap-2 rounded-full bg-[var(--lp-accent-solid)] px-7 py-4 text-sm font-semibold text-[var(--lp-accent-on)] shadow-[var(--lp-accent-shadow)] transition hover:-translate-y-0.5 hover:bg-[var(--lp-accent-solid-hover)] active:translate-y-0"
                  >
                    Commencer gratuitement
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </Link>
                  <a
                    href="#simulateur"
                    className="inline-flex items-center justify-center gap-2 rounded-full border border-[var(--lp-border-strong)] bg-[var(--lp-bg-elevated)] px-7 py-4 text-sm font-semibold text-[var(--lp-text)] transition hover:bg-[var(--lp-hover-bg)]"
                  >
                    <Play className="h-4 w-4 text-[var(--lp-accent-text)]" />
                    Voir mon potentiel d&apos;économie
                  </a>
                </div>
              </Reveal>

              <Reveal delay={320}>
                <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3 text-sm text-[var(--lp-text-subtle)]">
                  <span className="inline-flex items-center gap-2">
                    <Check className="h-4 w-4 text-[var(--lp-accent-text)]" /> 7 jours d&apos;essai
                  </span>
                  <span className="inline-flex items-center gap-2">
                    <Check className="h-4 w-4 text-[var(--lp-accent-text)]" /> Sans carte bancaire
                  </span>
                  <span className="inline-flex items-center gap-2">
                    <Check className="h-4 w-4 text-[var(--lp-accent-text)]" /> Données hébergées en CI
                  </span>
                </div>
              </Reveal>

              <Reveal delay={380}>
                <div className="mt-12 grid max-w-lg grid-cols-3 gap-6 border-t border-[var(--lp-border)] pt-7">
                  <div>
                    <p className="text-2xl font-semibold tracking-tight text-[var(--lp-text)]">Wave</p>
                    <p className="mt-1 text-xs text-[var(--lp-text-subtle)]">
                      Orange Money · MTN · Moov
                    </p>
                  </div>
                  <div>
                    <p className="text-2xl font-semibold tracking-tight text-[var(--lp-text)]">QR</p>
                    <p className="mt-1 text-xs text-[var(--lp-text-subtle)]">
                      Quittances vérifiables
                    </p>
                  </div>
                  <div>
                    <p className="text-2xl font-semibold tracking-tight text-[var(--lp-text)]">24/7</p>
                    <p className="mt-1 text-xs text-[var(--lp-text-subtle)]">
                      Suivi de votre parc
                    </p>
                  </div>
                </div>
              </Reveal>
            </div>

            <Reveal delay={220} className="relative">
              <div className="hero-window relative mx-auto w-full max-w-xl">
                <div className="pointer-events-none absolute -inset-8 rounded-[3rem] bg-[var(--lp-glow-3)] blur-3xl" />
                <div className="relative overflow-hidden rounded-[1.75rem] border border-[var(--lp-border-strong)] bg-[var(--lp-window-bg)] shadow-[var(--lp-window-shadow)] backdrop-blur-xl">
                  <div className="flex items-center justify-between border-b border-[var(--lp-border)] px-5 py-4">
                    <div className="flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full bg-rose-400/70" />
                      <span className="h-2.5 w-2.5 rounded-full bg-amber-300/70" />
                      <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/70" />
                    </div>
                    <span className="text-xs font-medium tracking-wide text-[var(--lp-text-subtle)]">
                      loutigui.app / tableau de bord
                    </span>
                    <ShieldCheck className="h-4 w-4 text-[var(--lp-accent-text)]" />
                  </div>

                  <div className="space-y-5 p-5 sm:p-7">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="text-xs font-medium text-[var(--lp-text-subtle)]">
                          Encaisse ce mois
                        </p>
                        <p className="mt-1 text-3xl font-semibold tracking-tight text-[var(--lp-text)]">
                          4 820 000{" "}
                          <span className="text-base text-[var(--lp-accent-text)]">FCFA</span>
                        </p>
                      </div>
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--lp-accent-soft)] px-3 py-1.5 text-xs font-semibold text-[var(--lp-accent-text)]">
                        <TrendingUp className="h-3.5 w-3.5" /> +12,4 %
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { label: "Loyers payés", value: "28 / 32", icon: CheckCircle2 },
                        { label: "En retard", value: "4", icon: Clock3 },
                        { label: "Quittances", value: "28", icon: ReceiptText },
                      ].map((stat) => (
                        <div
                          key={stat.label}
                          className="rounded-2xl border border-[var(--lp-border)] bg-[var(--lp-bg-subtle)] p-3.5"
                        >
                          <stat.icon className="h-4 w-4 text-[var(--lp-accent-text)]" />
                          <p className="mt-3 text-lg font-semibold text-[var(--lp-text)]">
                            {stat.value}
                          </p>
                          <p className="mt-0.5 text-[11px] text-[var(--lp-text-subtle)]">
                            {stat.label}
                          </p>
                        </div>
                      ))}
                    </div>

                    <div className="rounded-2xl border border-[var(--lp-border)] bg-[var(--lp-bg-subtle)] p-4">
                      <div className="mb-4 flex items-center justify-between">
                        <p className="text-sm font-semibold text-[var(--lp-text)]">
                          Dernier encaissement
                        </p>
                        <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-[var(--lp-accent-text)]">
                          <Radio className="h-3 w-3 animate-pulse" /> Confirmé
                        </span>
                      </div>
                      <div className="flex items-center gap-3 rounded-xl border border-[var(--lp-border)] bg-[var(--lp-bg-inset)] p-3">
                        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--lp-accent-soft)] text-[var(--lp-accent-text)]">
                          <Wallet className="h-5 w-5" />
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-[var(--lp-text)]">
                            Kouadio Koffi · Lot A3
                          </p>
                          <p className="text-xs text-[var(--lp-text-subtle)]">
                            Wave · QUITT-2026-000003
                          </p>
                        </div>
                        <p className="text-sm font-semibold text-[var(--lp-accent-text)]">
                          55 000 F
                        </p>
                      </div>
                      <div className="mt-3 flex items-center gap-2 rounded-xl border border-[var(--lp-accent-border)] bg-[var(--lp-accent-soft)] p-3 text-xs text-[var(--lp-accent-text)]">
                        <QrCode className="h-4 w-4 shrink-0" />
                        Quittance vérifiable envoyée au locataire
                      </div>
                    </div>
                  </div>
                </div>

                <div className="hero-float absolute -bottom-8 -left-6 hidden items-center gap-3 rounded-2xl border border-[var(--lp-border-strong)] bg-[var(--lp-window-bg)] px-4 py-3 shadow-[var(--lp-window-shadow)] backdrop-blur-xl sm:flex">
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--lp-accent-soft)] text-[var(--lp-accent-text)]">
                    <MessageCircleMore className="h-4 w-4" />
                  </span>
                  <div>
                    <p className="text-xs font-semibold text-[var(--lp-text)]">Relance envoyée</p>
                    <p className="text-[11px] text-[var(--lp-text-subtle)]">Rappel courtois à J+3</p>
                  </div>
                </div>
              </div>
            </Reveal>
          </div>
        </section>

        {/* Payment operators */}
        <section
          id="paiements"
          className="scroll-mt-24 border-y border-[var(--lp-border)] bg-[var(--lp-bg-subtle)] py-20 sm:py-24"
        >
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <Reveal>
              <SectionHeading
                eyebrow="Encaissement Mobile Money"
                title="Vos locataires paient comme ils le font déjà."
                description="Wave, Orange Money, MTN MoMo et Moov Money : chaque règlement est rapproché de son échéance et suivi d'une quittance officielle."
              />
            </Reveal>

            <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {OPERATORS.map((operator, index) => (
                <Reveal key={operator.name} delay={index * 80}>
                  <article className="group relative h-full overflow-hidden rounded-3xl border border-[var(--lp-border)] bg-[var(--lp-bg-elevated)] p-5 shadow-[var(--lp-window-shadow)] transition duration-300 hover:-translate-y-1 hover:border-[var(--lp-accent-border)]">
                    <span
                      className="absolute inset-x-0 top-0 h-px opacity-60"
                      style={{
                        background: `linear-gradient(90deg, transparent, ${operator.color}, transparent)`,
                      }}
                    />
                    <div className="flex h-20 items-center justify-center rounded-2xl border border-[var(--lp-border)] bg-[var(--lp-bg-inset)] p-3">
                      <Image
                        src={operator.logo}
                        alt={`Logo ${operator.name}`}
                        width={140}
                        height={56}
                        className="h-11 w-auto max-w-full object-contain transition duration-300 group-hover:scale-105"
                      />
                    </div>
                    <div className="mt-5 flex items-center justify-between gap-2">
                      <h3 className="text-base font-semibold text-[var(--lp-text)]">
                        {operator.name}
                      </h3>
                      <span className="rounded-full border border-[var(--lp-border)] bg-[var(--lp-bg-subtle)] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-[var(--lp-text-muted)]">
                        {operator.code}
                      </span>
                    </div>
                    <p className="mt-2 text-sm font-medium text-[var(--lp-accent-text)]">
                      {operator.tagline}
                    </p>
                    <p className="mt-2 text-sm leading-6 text-[var(--lp-text-muted)]">
                      {operator.detail}
                    </p>
                  </article>
                </Reveal>
              ))}
            </div>

            <Reveal delay={200}>
              <div className="mt-8 flex flex-col items-start justify-between gap-5 rounded-3xl border border-[var(--lp-accent-border)] bg-[var(--lp-banner-bg)] p-6 sm:flex-row sm:items-center sm:p-7">
                <div className="flex items-start gap-4">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[var(--lp-accent-soft)] text-[var(--lp-accent-text)]">
                    <Zap className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="font-semibold text-[var(--lp-text)]">
                      Un seul workflow, de la demande au reçu
                    </p>
                    <p className="mt-1 text-sm text-[var(--lp-text-muted)]">
                      Règlement du locataire → rapprochement de l&apos;échéance → quittance transmise.
                      Les passerelles SMS, email et paiement sont branchées sur vos identifiants,
                      sans simulation.
                    </p>
                  </div>
                </div>
                <Link
                  href="/signup"
                  className="inline-flex shrink-0 items-center gap-2 rounded-full bg-[var(--lp-contrast-bg)] px-5 py-3 text-sm font-semibold text-[var(--lp-contrast-text)] transition hover:opacity-90"
                >
                  Activer les encaissements <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </Reveal>
          </div>
        </section>

        {/* Features */}
        <section id="fonctionnalites" className="scroll-mt-24 py-20 sm:py-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <Reveal>
              <SectionHeading
                eyebrow="Tout votre immobilier, au même endroit"
                title="Conçu pour la réalité des gestionnaires africains."
                description="Une interface claire, des documents professionnels et des données qui restent à vous."
              />
            </Reveal>

            <div className="mt-14 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {[
                {
                  icon: QrCode,
                  title: "Quittances vérifiables",
                  text: "Un numéro séquentiel, une référence unique et une page publique pour prouver chaque paiement en un scan.",
                },
                {
                  icon: MessageCircleMore,
                  title: "Relances maîtrisées",
                  text: "Rappels avant échéance et escalade après retard, avec vos propres canaux SMS et email configurés.",
                },
                {
                  icon: FileCheck2,
                  title: "Baux en document propre",
                  text: "Des contrats A4 structurés, imprimables en PDF, avec parties, clauses financières et zones de signature.",
                },
                {
                  icon: Building2,
                  title: "Patrimoine structuré",
                  text: "Immeubles, lots, locataires et baux reliés entre eux. Occupation, vacance et historique en un coup d'œil.",
                },
                {
                  icon: Gauge,
                  title: "Décisions en temps réel",
                  text: "Encaissés, impayés, balance âgée et indicateurs par organisation, avec exports prêts pour la comptabilité.",
                },
                {
                  icon: LockKeyhole,
                  title: "Sécurité dès la connexion",
                  text: "Sessions signées HttpOnly, mots de passe dérivés, permissions par rôle et isolation stricte entre organisations.",
                },
              ].map((feature, index) => (
                <Reveal key={feature.title} delay={index * 60}>
                  <article className="group h-full rounded-3xl border border-[var(--lp-border)] bg-[var(--lp-bg-elevated)] p-6 shadow-[var(--lp-window-shadow)] transition duration-300 hover:-translate-y-1 hover:border-[var(--lp-accent-border)]">
                    <span className="flex h-12 w-12 items-center justify-center rounded-2xl border border-[var(--lp-accent-border)] bg-[var(--lp-accent-soft)] text-[var(--lp-accent-text)] transition group-hover:bg-[var(--lp-hover-bg)]">
                      <feature.icon className="h-5 w-5" />
                    </span>
                    <h3 className="mt-5 text-lg font-semibold text-[var(--lp-text)]">
                      {feature.title}
                    </h3>
                    <p className="mt-2 text-sm leading-7 text-[var(--lp-text-muted)]">
                      {feature.text}
                    </p>
                  </article>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* Simulator */}
        <section
          id="simulateur"
          className="scroll-mt-24 border-y border-[var(--lp-border)] bg-[var(--lp-bg-subtle)] py-20 sm:py-28"
        >
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <Reveal>
              <SectionHeading
                eyebrow="Simulateur interactif"
                title="Ce que votre parc peut vous faire gagner."
                description="Ajustez la taille de votre parc et le loyer moyen. L'estimation se met à jour immédiatement."
              />
            </Reveal>

            <Reveal delay={120}>
              <div className="mt-12 grid gap-8 rounded-[2rem] border border-[var(--lp-border)] bg-[var(--lp-bg-elevated)] p-6 shadow-[var(--lp-window-shadow)] sm:p-10 lg:grid-cols-2">
                <div className="space-y-9">
                  <div>
                    <div className="flex items-baseline justify-between gap-4">
                      <label htmlFor="lots" className="text-sm font-medium text-[var(--lp-text)]">
                        Nombre de lots gérés
                      </label>
                      <span className="text-xl font-semibold text-[var(--lp-accent-text)]">
                        {lotsCount} {lotsCount > 1 ? "lots" : "lot"}
                      </span>
                    </div>
                    <input
                      id="lots"
                      type="range"
                      min={2}
                      max={60}
                      value={lotsCount}
                      onChange={(event) => setLotsCount(Number(event.target.value))}
                      className="landing-range mt-4 w-full"
                    />
                    <div className="mt-2 flex justify-between text-xs font-medium text-[var(--lp-text-subtle)]">
                      <span>2</span>
                      <span>30</span>
                      <span>60 lots</span>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-baseline justify-between gap-4">
                      <label htmlFor="rent" className="text-sm font-medium text-[var(--lp-text)]">
                        Loyer mensuel moyen
                      </label>
                      <span className="text-xl font-semibold text-[var(--lp-accent-text)]">
                        {avgRent.toLocaleString("fr-FR")} F
                      </span>
                    </div>
                    <input
                      id="rent"
                      type="range"
                      min={50000}
                      max={1000000}
                      step={25000}
                      value={avgRent}
                      onChange={(event) => setAvgRent(Number(event.target.value))}
                      className="landing-range mt-4 w-full"
                    />
                    <div className="mt-2 flex justify-between text-xs font-medium text-[var(--lp-text-subtle)]">
                      <span>50 000 F</span>
                      <span>500 000 F</span>
                      <span>1 000 000 F</span>
                    </div>
                  </div>

                  <p className="rounded-2xl border border-[var(--lp-border)] bg-[var(--lp-bg-subtle)] p-4 text-sm leading-7 text-[var(--lp-text-muted)]">
                    <Sparkles className="mr-2 inline h-4 w-4 text-[var(--lp-accent-text)]" />
                    Estimation indicative : elle illustre le volume suivi et le temps évité. Le prix
                    du forfait Starter est pris à 10 000 FCFA par lot pour le calcul.
                  </p>
                </div>

                <div className="relative overflow-hidden rounded-[1.5rem] border border-[var(--lp-accent-border)] bg-[var(--lp-projection-bg)] p-6 sm:p-8">
                  <span className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--lp-accent-text)]">
                    Projection mensuelle
                  </span>
                  <p className="mt-6 text-4xl font-semibold tracking-tight text-[var(--lp-text)] sm:text-5xl">
                    {totalMonthlyCollected.toLocaleString("fr-FR")}{" "}
                    <span className="text-xl text-[var(--lp-accent-text)]">FCFA</span>
                  </p>
                  <p className="mt-2 text-sm text-[var(--lp-text-muted)]">
                    Volume de loyers suivi chaque mois
                  </p>

                  <div className="mt-8 grid gap-3 sm:grid-cols-2">
                    <div className="rounded-2xl border border-[var(--lp-border)] bg-[var(--lp-bg-inset)] p-4">
                      <Clock3 className="h-4 w-4 text-[var(--lp-accent-text)]" />
                      <p className="mt-3 text-2xl font-semibold text-[var(--lp-text)]">
                        ~{hoursSaved} h
                      </p>
                      <p className="mt-1 text-xs text-[var(--lp-text-subtle)]">
                        Temps gagné par mois
                      </p>
                    </div>
                    <div className="rounded-2xl border border-[var(--lp-border)] bg-[var(--lp-bg-inset)] p-4">
                      <Wallet className="h-4 w-4 text-[var(--lp-accent-text)]" />
                      <p className="mt-3 text-2xl font-semibold text-[var(--lp-text)]">
                        {netGain.toLocaleString("fr-FR")} F
                      </p>
                      <p className="mt-1 text-xs text-[var(--lp-text-subtle)]">
                        Après forfait estimé
                      </p>
                    </div>
                  </div>

                  <Link
                    href="/signup"
                    className="mt-8 inline-flex w-full items-center justify-center gap-2 rounded-full bg-[var(--lp-accent-solid)] px-6 py-4 text-sm font-semibold text-[var(--lp-accent-on)] transition hover:bg-[var(--lp-accent-solid-hover)]"
                  >
                    Sécuriser ce revenu <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            </Reveal>
          </div>
        </section>

        {/* Pricing */}
        <section id="tarifs" className="scroll-mt-24 py-20 sm:py-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <Reveal>
              <SectionHeading
                eyebrow="Tarification claire"
                title="Un forfait adapté à la taille de votre parc."
                description="Sans engagement, sans frais caché par transaction. Vous gardez la main sur votre organisation et vos données."
              />
            </Reveal>

            <div className="mt-14 grid gap-5 lg:grid-cols-3">
              {PLANS.map((plan, index) => (
                <Reveal key={plan.name} delay={index * 90}>
                  <article
                    className={`relative flex h-full flex-col rounded-[1.75rem] border p-7 shadow-[var(--lp-window-shadow)] transition duration-300 hover:-translate-y-1 ${
                      plan.featured
                        ? "border-[var(--lp-accent-solid)] bg-[var(--lp-featured-bg)]"
                        : "border-[var(--lp-border)] bg-[var(--lp-bg-elevated)] hover:border-[var(--lp-border-strong)]"
                    }`}
                  >
                    {plan.featured ? (
                      <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-[var(--lp-accent-solid)] px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-[var(--lp-accent-on)] shadow-lg shadow-[var(--lp-accent-shadow)]">
                        Le plus choisi
                      </span>
                    ) : null}
                    <p className="text-sm font-medium text-[var(--lp-text-subtle)]">
                      {plan.audience}
                    </p>
                    <h3 className="mt-1 text-2xl font-semibold text-[var(--lp-text)]">
                      {plan.name}
                    </h3>
                    <div className="mt-6 flex items-baseline gap-2">
                      <span className="text-3xl font-semibold tracking-tight text-[var(--lp-text)]">
                        {plan.price}
                      </span>
                      <span className="text-sm text-[var(--lp-text-subtle)]">{plan.period}</span>
                    </div>
                    <p className="mt-2 text-sm font-medium text-[var(--lp-accent-text)]">
                      {plan.limit}
                    </p>
                    <ul className="mt-7 space-y-3 border-t border-[var(--lp-border)] pt-6">
                      {plan.features.map((feature) => (
                        <li
                          key={feature}
                          className="flex items-start gap-3 text-sm text-[var(--lp-text-muted)]"
                        >
                          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[var(--lp-accent-text)]" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                    <Link
                      href="/signup"
                      className={`mt-8 inline-flex w-full items-center justify-center gap-2 rounded-full px-5 py-3.5 text-sm font-semibold transition ${
                        plan.featured
                          ? "bg-[var(--lp-accent-solid)] text-[var(--lp-accent-on)] hover:bg-[var(--lp-accent-solid-hover)]"
                          : "border border-[var(--lp-border-strong)] bg-[var(--lp-bg-subtle)] text-[var(--lp-text)] hover:bg-[var(--lp-hover-bg)]"
                      }`}
                    >
                      {plan.cta} <ArrowRight className="h-4 w-4" />
                    </Link>
                  </article>
                </Reveal>
              ))}
            </div>
            <p className="mt-8 text-center text-sm text-[var(--lp-text-subtle)]">
              Le forfait est choisi et activé depuis votre espace, après la création du compte.
            </p>
          </div>
        </section>

        {/* FAQ */}
        <section
          id="faq"
          className="scroll-mt-24 border-t border-[var(--lp-border)] bg-[var(--lp-bg-subtle)] py-20 sm:py-28"
        >
          <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
            <Reveal>
              <SectionHeading
                eyebrow="Questions fréquentes"
                title="Les réponses avant de commencer."
              />
            </Reveal>

            <div className="mt-12 space-y-3">
              {FAQ.map((item, index) => (
                <Reveal key={item.q} delay={index * 50}>
                  <div className="overflow-hidden rounded-2xl border border-[var(--lp-border)] bg-[var(--lp-bg-elevated)]">
                    <button
                      type="button"
                      onClick={() => setOpenFaq(openFaq === index ? null : index)}
                      className="flex w-full items-center justify-between gap-4 px-5 py-5 text-left text-sm font-medium text-[var(--lp-text)] transition hover:bg-[var(--lp-hover-bg)] sm:text-base"
                      aria-expanded={openFaq === index}
                    >
                      {item.q}
                      <ChevronDown
                        className={`h-5 w-5 shrink-0 text-[var(--lp-accent-text)] transition-transform duration-300 ${
                          openFaq === index ? "rotate-180" : ""
                        }`}
                      />
                    </button>
                    <div
                      className={`grid transition-all duration-300 ease-out ${
                        openFaq === index
                          ? "grid-rows-[1fr] opacity-100"
                          : "grid-rows-[0fr] opacity-0"
                      }`}
                    >
                      <div className="overflow-hidden">
                        <p className="border-t border-[var(--lp-border)] px-5 py-5 text-sm leading-7 text-[var(--lp-text-muted)]">
                          {item.a}
                        </p>
                      </div>
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="relative px-4 py-20 sm:px-6 sm:py-28 lg:px-8">
          <Reveal>
            <div className="relative mx-auto max-w-5xl overflow-hidden rounded-[2.25rem] border border-[var(--lp-accent-border)] bg-[var(--lp-cta-bg)] px-6 py-14 text-center shadow-[var(--lp-window-shadow)] sm:px-12 sm:py-20">
              <div className="landing-grid pointer-events-none absolute inset-0 opacity-[var(--lp-grid-opacity)]" />
              <div className="relative">
                <span className="inline-flex items-center gap-2 rounded-full border border-[var(--lp-border)] bg-[var(--lp-bg-elevated)] px-4 py-2 text-xs font-semibold text-[var(--lp-accent-text)]">
                  <BadgeCheck className="h-4 w-4" /> Prêt en quelques minutes
                </span>
                <h2 className="mx-auto mt-6 max-w-2xl text-balance text-3xl font-semibold tracking-tight text-[var(--lp-text)] sm:text-5xl">
                  Prenez le contrôle de vos loyers dès ce mois-ci.
                </h2>
                <p className="mx-auto mt-5 max-w-xl text-base leading-8 text-[var(--lp-text-muted)]">
                  Créez votre organisation, ajoutez vos biens et commencez à suivre vos encaissements
                  avec des documents à votre image.
                </p>
                <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
                  <Link
                    href="/signup"
                    className="group inline-flex items-center gap-2 rounded-full bg-[var(--lp-accent-solid)] px-8 py-4 text-sm font-semibold text-[var(--lp-accent-on)] shadow-[var(--lp-accent-shadow)] transition hover:-translate-y-0.5 hover:bg-[var(--lp-accent-solid-hover)]"
                  >
                    Créer mon compte gratuitement
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </Link>
                  <Link
                    href="/login"
                    className="inline-flex items-center gap-2 rounded-full border border-[var(--lp-border-strong)] bg-[var(--lp-bg-elevated)] px-8 py-4 text-sm font-semibold text-[var(--lp-text)] transition hover:bg-[var(--lp-hover-bg)]"
                  >
                    J&apos;ai déjà un compte
                  </Link>
                </div>
              </div>
            </div>
          </Reveal>
        </section>
      </main>

      <footer className="relative z-10 border-t border-[var(--lp-border)] bg-[var(--lp-footer-bg)] py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col justify-between gap-10 md:flex-row">
            <div className="max-w-sm">
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--lp-accent-solid)] text-[var(--lp-accent-on)]">
                  <Building2 className="h-4 w-4" />
                </span>
                <span className="text-base font-semibold tracking-[0.16em] text-[var(--lp-text)]">
                  LOUTIGUI
                </span>
              </div>
              <p className="mt-4 text-sm leading-7 text-[var(--lp-text-muted)]">
                La plateforme de gestion locative pour les propriétaires et agences qui veulent
                encaisser sereinement et garder une trace irréprochable de chaque loyer.
              </p>
              <p className="mt-4 inline-flex items-center gap-2 text-sm text-[var(--lp-text-subtle)]">
                <Landmark className="h-4 w-4 text-[var(--lp-accent-text)]" /> Abidjan, Côte
                d&apos;Ivoire
              </p>
            </div>

            <div className="grid grid-cols-2 gap-10 sm:grid-cols-3">
              <div>
                <p className="text-sm font-semibold text-[var(--lp-text)]">Produit</p>
                <ul className="mt-4 space-y-3 text-sm text-[var(--lp-text-muted)]">
                  <li>
                    <a href="#fonctionnalites" className="hover:text-[var(--lp-accent-text)]">
                      Fonctionnalités
                    </a>
                  </li>
                  <li>
                    <a href="#paiements" className="hover:text-[var(--lp-accent-text)]">
                      Paiements
                    </a>
                  </li>
                  <li>
                    <a href="#tarifs" className="hover:text-[var(--lp-accent-text)]">
                      Tarifs
                    </a>
                  </li>
                </ul>
              </div>
              <div>
                <p className="text-sm font-semibold text-[var(--lp-text)]">Ressources</p>
                <ul className="mt-4 space-y-3 text-sm text-[var(--lp-text-muted)]">
                  <li>
                    <a href="#simulateur" className="hover:text-[var(--lp-accent-text)]">
                      Simulateur
                    </a>
                  </li>
                  <li>
                    <a href="#faq" className="hover:text-[var(--lp-accent-text)]">
                      FAQ
                    </a>
                  </li>
                  <li>
                    <Link href="/verify" className="hover:text-[var(--lp-accent-text)]">
                      Vérifier une quittance
                    </Link>
                  </li>
                </ul>
              </div>
              <div>
                <p className="text-sm font-semibold text-[var(--lp-text)]">Espace client</p>
                <ul className="mt-4 space-y-3 text-sm text-[var(--lp-text-muted)]">
                  <li>
                    <Link href="/login" className="hover:text-[var(--lp-accent-text)]">
                      Connexion
                    </Link>
                  </li>
                  <li>
                    <Link href="/signup" className="hover:text-[var(--lp-accent-text)]">
                      Inscription
                    </Link>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          <div className="mt-12 flex flex-col justify-between gap-4 border-t border-[var(--lp-border)] pt-6 text-xs text-[var(--lp-text-subtle)] sm:flex-row">
            <p>© {new Date().getFullYear()} LOUTIGUI. Tous droits réservés.</p>
            <p className="flex items-center gap-2">
              <ShieldCheck className="h-3.5 w-3.5 text-[var(--lp-accent-text)]" />
              Données d&apos;organisation isolées · Sessions sécurisées
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
