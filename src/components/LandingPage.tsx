"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/context/AuthContext";
import { formatCurrency } from "@/lib/utils";
import {
  Building2,
  CheckCircle2,
  Smartphone,
  MessageSquare,
  ArrowRight,
  TrendingUp,
  Sparkles,
  QrCode,
  Zap,
  Calculator,
  ChevronDown,
  ChevronUp,
  FileText,
  Clock,
  Lock,
  Layers,
  Award,
  Menu,
  X,
} from "lucide-react";

export function LandingPage() {
  const { isAuthenticated } = useAuth();

  // Mobile navigation drawer
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Interactive ROI Calculator State
  const [lotsCount, setLotsCount] = useState<number>(12);
  const [avgRent, setAvgRent] = useState<number>(200000);

  // Interactive FAQ Accordion State
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  // Calculations
  const totalMonthlyCollected = lotsCount * avgRent;
  const hoursSaved = Math.round(lotsCount * 1.8);
  const recoveryRate = 98.8;

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-emerald-500 selection:text-slate-950 relative overflow-x-hidden">
      {/* Ambient background glow mesh */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[15%] w-[600px] h-[600px] rounded-full bg-emerald-600/10 blur-[130px]" />
        <div className="absolute top-[40%] right-[10%] w-[500px] h-[500px] rounded-full bg-teal-600/10 blur-[140px]" />
        <div className="absolute bottom-[10%] left-[5%] w-[650px] h-[650px] rounded-full bg-emerald-700/10 blur-[150px]" />
      </div>

      {/* Sticky Header */}
      <header className="sticky top-0 z-50 bg-slate-950/85 backdrop-blur-md border-b border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-4 relative z-10">
          {/* Brand Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center text-slate-950 shadow-lg shadow-emerald-500/25 group-hover:scale-105 transition-transform duration-200">
              <Building2 className="w-6 h-6 text-slate-950" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-2xl tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-transparent">
                  LOUTIGUI
                </span>
                <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                  Proptech
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium hidden sm:block">
                Gestion Locative & Quittances Certifiées
              </p>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-8 text-xs font-bold text-slate-300">
            <a href="#paiements" className="hover:text-emerald-400 transition-colors">
              Paiements
            </a>
            <a href="#fonctionnalites" className="hover:text-emerald-400 transition-colors">
              Fonctionnalités
            </a>
            <a href="#simulateur" className="hover:text-emerald-400 transition-colors">
              Simulateur
            </a>
            <a href="#tarifs" className="hover:text-emerald-400 transition-colors">
              Tarifs
            </a>
            <a href="#faq" className="hover:text-emerald-400 transition-colors">
              FAQ
            </a>
          </nav>

          {/* Header Action Buttons */}
          <div className="hidden sm:flex items-center gap-3">
            {isAuthenticated ? (
              <Link
                href="/"
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs shadow-md shadow-emerald-500/20 transition hover:shadow-emerald-500/35"
              >
                <span>Mon Tableau de Bord</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  className="px-4 py-2.5 rounded-xl text-slate-300 hover:text-white hover:bg-slate-900 border border-transparent hover:border-slate-800 text-xs font-bold transition"
                >
                  Connexion
                </Link>
                <Link
                  href="/signup"
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs shadow-md shadow-emerald-500/20 transition hover:shadow-emerald-500/35"
                >
                  <span>Créer mon Compte</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </>
            )}
          </div>

          {/* Mobile Hamburger Toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white"
            aria-label="Menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-slate-950/95 border-b border-slate-800 px-4 py-6 space-y-4">
            <nav className="flex flex-col gap-3 text-sm font-bold text-slate-200">
              <a
                href="#paiements"
                onClick={() => setMobileMenuOpen(false)}
                className="py-2 hover:text-emerald-400"
              >
                Paiements Mobile Money
              </a>
              <a
                href="#fonctionnalites"
                onClick={() => setMobileMenuOpen(false)}
                className="py-2 hover:text-emerald-400"
              >
                Fonctionnalités
              </a>
              <a
                href="#simulateur"
                onClick={() => setMobileMenuOpen(false)}
                className="py-2 hover:text-emerald-400"
              >
                Simulateur de Gains
              </a>
              <a
                href="#tarifs"
                onClick={() => setMobileMenuOpen(false)}
                className="py-2 hover:text-emerald-400"
              >
                Tarifs
              </a>
              <a
                href="#faq"
                onClick={() => setMobileMenuOpen(false)}
                className="py-2 hover:text-emerald-400"
              >
                FAQ
              </a>
            </nav>
            <div className="pt-4 border-t border-slate-800 flex flex-col gap-2">
              <Link
                href="/login"
                className="w-full text-center py-3 rounded-xl bg-slate-900 text-white font-bold text-xs"
              >
                Connexion
              </Link>
              <Link
                href="/signup"
                className="w-full text-center py-3 rounded-xl bg-emerald-500 text-slate-950 font-black text-xs"
              >
                Créer mon Compte Gratuit
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* Hero Section */}
      <section className="relative pt-12 pb-20 sm:pt-20 sm:pb-28">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10 space-y-6">
          {/* Tag Pill */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-900/90 border border-emerald-500/30 text-emerald-400 text-xs font-bold shadow-lg shadow-emerald-500/10">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>La plateforme immobilière nouvelle génération</span>
          </div>

          {/* Main Title */}
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white max-w-4xl mx-auto leading-[1.15]">
            Encaissez vos loyers en direct.{" "}
            <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-300 bg-clip-text text-transparent">
              Émettez des quittances certifiées.
            </span>
          </h1>

          {/* Description */}
          <p className="text-sm sm:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed">
            Fini les litiges et les retards sur cahier papier. Encaissez en toute simplicité par{" "}
            <strong className="text-white font-bold">Wave, Orange Money, MTN et Moov</strong>,
            éditez des quittances infalsifiables avec QR Code et automatisez vos relances WhatsApp.
          </p>

          {/* CTA Buttons */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3.5 max-w-md mx-auto">
            <Link
              href="/signup"
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-7 py-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-sm shadow-xl shadow-emerald-500/25 transition hover:shadow-emerald-500/40 hover:-translate-y-0.5 active:scale-95"
            >
              <span>Démarrer l&apos;essai gratuit</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <a
              href="#simulateur"
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 font-bold text-sm transition hover:border-slate-700"
            >
              <Calculator className="w-4 h-4 text-emerald-400" />
              <span>Simuler mes gains</span>
            </a>
          </div>

          {/* Trust Guarantees */}
          <div className="pt-4 flex flex-wrap justify-center items-center gap-4 text-xs text-slate-400 font-semibold">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" /> 7 jours d&apos;essai gratuit offerts
            </span>
            <span className="hidden sm:inline text-slate-700">&bull;</span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Sans carte bancaire requise
            </span>
            <span className="hidden sm:inline text-slate-700">&bull;</span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Conforme loi ivoirienne
            </span>
          </div>
        </div>
      </section>

      {/* Mobile Money Operators Section */}
      <section id="paiements" className="py-16 bg-slate-900/60 border-y border-slate-800/80 relative">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[11px] font-bold uppercase tracking-wider">
              <Smartphone className="w-3.5 h-3.5" />
              <span>Compatibilité Mobile Money Totale</span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-black text-white">
              Les 4 Moyens de Paiement Préférés
            </h2>
            <p className="text-xs sm:text-sm text-slate-400">
              Vos locataires règlent facilement depuis leur compte Mobile Money. LOUTIGUI valide
              l&apos;échéance et transmet le reçu immédiatement.
            </p>
          </div>

          {/* 4 Cards Grid with Clean Sized Logos */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Wave */}
            <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 hover:border-[#00B6F0]/50 transition duration-300 shadow-lg flex flex-col justify-between space-y-4">
              <div className="relative w-full h-16 rounded-xl overflow-hidden bg-slate-900 border border-slate-800 flex items-center justify-center p-2 shadow-sm">
                <Image
                  src="/images/payments/wave.png"
                  alt="Wave Logo"
                  width={140}
                  height={70}
                  className="h-full w-auto max-w-full object-contain rounded-md"
                />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <h3 className="text-base font-black text-white">Wave</h3>
                  <span className="px-2 py-0.5 rounded-full bg-[#00B6F0]/15 text-[#00B6F0] border border-[#00B6F0]/30 text-[10px] font-extrabold uppercase">
                    Instantané
                  </span>
                </div>
                <p className="text-xs font-semibold text-slate-300">Paiement QR & Push Mobile</p>
                <p className="text-[11px] text-slate-400 pt-1 leading-relaxed">
                  0% frais de retrait, validation en 2 secondes et reçu WhatsApp envoyé sur-le-champ.
                </p>
              </div>
              <div className="pt-2.5 border-t border-slate-800 flex items-center justify-between text-[11px]">
                <span className="text-slate-400 font-medium">Côte d&apos;Ivoire</span>
                <span className="font-bold text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Opérationnel
                </span>
              </div>
            </div>

            {/* Orange Money */}
            <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 hover:border-[#FF7900]/50 transition duration-300 shadow-lg flex flex-col justify-between space-y-4">
              <div className="relative w-full h-16 rounded-xl overflow-hidden bg-slate-900 border border-slate-800 flex items-center justify-center p-2 shadow-sm">
                <Image
                  src="/images/payments/orange-money.png"
                  alt="Orange Money Logo"
                  width={140}
                  height={70}
                  className="h-full w-auto max-w-full object-contain rounded-md"
                />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <h3 className="text-base font-black text-white">Orange Money</h3>
                  <span className="px-2 py-0.5 rounded-full bg-[#FF7900]/15 text-[#FF7900] border border-[#FF7900]/30 text-[10px] font-extrabold uppercase">
                    #144# & Max it
                  </span>
                </div>
                <p className="text-xs font-semibold text-slate-300">Réseau National Étendu</p>
                <p className="text-[11px] text-slate-400 pt-1 leading-relaxed">
                  Confirmation par notification SMS en direct et mise à jour immédiate du solde du loyer.
                </p>
              </div>
              <div className="pt-2.5 border-t border-slate-800 flex items-center justify-between text-[11px]">
                <span className="text-slate-400 font-medium">Côte d&apos;Ivoire</span>
                <span className="font-bold text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Opérationnel
                </span>
              </div>
            </div>

            {/* MTN Mobile Money */}
            <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 hover:border-[#FFCC00]/50 transition duration-300 shadow-lg flex flex-col justify-between space-y-4">
              <div className="relative w-full h-16 rounded-xl overflow-hidden bg-slate-900 border border-slate-800 flex items-center justify-center p-2 shadow-sm">
                <Image
                  src="/images/payments/mtn-money.png"
                  alt="MTN Mobile Money Logo"
                  width={140}
                  height={70}
                  className="h-full w-auto max-w-full object-contain rounded-md"
                />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <h3 className="text-base font-black text-white">MTN MoMo</h3>
                  <span className="px-2 py-0.5 rounded-full bg-[#FFCC00]/15 text-[#FFCC00] border border-[#FFCC00]/30 text-[10px] font-extrabold uppercase">
                    *133# & MoMo
                  </span>
                </div>
                <p className="text-xs font-semibold text-slate-300">Le Réseau Panafricain</p>
                <p className="text-[11px] text-slate-400 pt-1 leading-relaxed">
                  Rapprochement bancaire temps réel avec archivage numérique de la preuve de versement.
                </p>
              </div>
              <div className="pt-2.5 border-t border-slate-800 flex items-center justify-between text-[11px]">
                <span className="text-slate-400 font-medium">Côte d&apos;Ivoire</span>
                <span className="font-bold text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Opérationnel
                </span>
              </div>
            </div>

            {/* Moov Money */}
            <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 hover:border-[#005CA9]/50 transition duration-300 shadow-lg flex flex-col justify-between space-y-4">
              <div className="relative w-full h-16 rounded-xl overflow-hidden bg-slate-900 border border-slate-800 flex items-center justify-center p-2 shadow-sm">
                <Image
                  src="/images/payments/moov-money.png"
                  alt="Moov Money Logo"
                  width={140}
                  height={70}
                  className="h-full w-auto max-w-full object-contain rounded-md"
                />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <h3 className="text-base font-black text-white">Moov Money</h3>
                  <span className="px-2 py-0.5 rounded-full bg-[#005CA9]/25 text-cyan-300 border border-[#005CA9]/40 text-[10px] font-extrabold uppercase">
                    *155# & Moov
                  </span>
                </div>
                <p className="text-xs font-semibold text-slate-300">Moov Africa CI</p>
                <p className="text-[11px] text-slate-400 pt-1 leading-relaxed">
                  Encaissement sans délai avec quittance certifiée téléchargeable en un clic par le locataire.
                </p>
              </div>
              <div className="pt-2.5 border-t border-slate-800 flex items-center justify-between text-[11px]">
                <span className="text-slate-400 font-medium">Côte d&apos;Ivoire</span>
                <span className="font-bold text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Opérationnel
                </span>
              </div>
            </div>
          </div>

          {/* Workflow Guarantee Banner */}
          <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4 text-xs">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center shrink-0">
                <Zap className="w-4 h-4 text-emerald-400" />
              </div>
              <div>
                <span className="font-bold text-white block">
                  Workflow d&apos;encaissement 100% sécurisé
                </span>
                <span className="text-slate-400 text-[11px]">
                  Règlement par le locataire ➔ Rapprochement immédiat ➔ Quittance officielle transmise par WhatsApp & SMS.
                </span>
              </div>
            </div>
            <Link
              href="/signup"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs transition shrink-0"
            >
              <span>Activer les encaissements</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Core Features Grid */}
      <section id="fonctionnalites" className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-xs font-bold uppercase tracking-wider">
            <Layers className="w-3.5 h-3.5" />
            <span>Tout-en-un pour Propriétaires & Agences</span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-black text-white">
            Conçu pour la Réalité Immobilière Africaine
          </h2>
          <p className="text-xs sm:text-sm text-slate-400">
            Une technologie de pointe pensée pour éliminer la paperasse, sécuriser chaque franc CFA et
            simplifier vos rapports avec vos locataires.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Card 1: Quittance QR */}
          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-emerald-500/40 transition duration-300 space-y-3.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <QrCode className="w-5 h-5" />
            </div>
            <h3 className="font-extrabold text-base text-white">
              Quittances Certifiées par QR Code
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Chaque quittance est signée avec un hash cryptographique unique. Les banques,
              ambassades et notaires peuvent vérifier son authenticité en un scan d&apos;appareil photo.
            </p>
          </div>

          {/* Card 2: Relances WhatsApp */}
          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-emerald-500/40 transition duration-300 space-y-3.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <MessageSquare className="w-5 h-5" />
            </div>
            <h3 className="font-extrabold text-base text-white">
              Relances Automatiques WhatsApp
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Activez des rappels courtois à J-3, le Jour J et des alertes d&apos;escalade à J+3. Vos
              locataires reçoivent un message personnalisé avec leur lien de paiement direct.
            </p>
          </div>

          {/* Card 3: Baux de Location */}
          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-emerald-500/40 transition duration-300 space-y-3.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <FileText className="w-5 h-5" />
            </div>
            <h3 className="font-extrabold text-base text-white">
              Contrats de Bail Conformes
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Générez en quelques clics des baux d&apos;habitation ou commerciaux conformes au droit
              en vigueur, avec clauses de dépôt de garantie, préavis et inventaire d&apos;entrée.
            </p>
          </div>

          {/* Card 4: Suivi Patrimoine */}
          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-emerald-500/40 transition duration-300 space-y-3.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Building2 className="w-5 h-5" />
            </div>
            <h3 className="font-extrabold text-base text-white">
              Gestion des Lots & Immeubles
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Structurez vos biens par immeuble, villa individuelle ou local commercial. Suivez le taux
              d&apos;occupation, les logements vacants et l&apos;historique complet des occupants.
            </p>
          </div>

          {/* Card 5: Mode Hors-Ligne Résilient */}
          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-emerald-500/40 transition duration-300 space-y-3.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Lock className="w-5 h-5" />
            </div>
            <h3 className="font-extrabold text-base text-white">
              Mode Hors-Ligne Résilient
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Vous êtes sur le terrain sans réseau 4G ? Continuez à enregistrer vos versements. Dès
              que la connexion revient, vos données se synchronisent automatiquement.
            </p>
          </div>

          {/* Card 6: Comptabilité & Analyses */}
          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-emerald-500/40 transition duration-300 space-y-3.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <TrendingUp className="w-5 h-5" />
            </div>
            <h3 className="font-extrabold text-base text-white">
              Tableau de Bord & Rapprochement
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Visualisez en temps réel vos loyers encaissés, les échéances en retard, la balance âgée
              des impayés et exportez vos états comptables prêts pour votre bilan.
            </p>
          </div>
        </div>
      </section>

      {/* Interactive ROI Calculator */}
      <section id="simulateur" className="py-20 bg-slate-900/60 border-y border-slate-800/80 relative">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-xs font-bold uppercase tracking-wider">
              <Calculator className="w-3.5 h-3.5" />
              <span>Simulateur Financier Interactif</span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-black text-white">
              Calculez vos Gains & Heures Économisées
            </h2>
            <p className="text-xs sm:text-sm text-slate-400">
              Ajustez les curseurs selon la taille de votre parc et visualisez immédiatement l&apos;impact.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center bg-slate-950 p-6 sm:p-10 rounded-3xl border border-slate-800 shadow-2xl">
            {/* Sliders */}
            <div className="space-y-6">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-xs font-bold text-slate-300">
                    Nombre de lots gérés :
                  </label>
                  <span className="text-lg font-black text-emerald-400">
                    {lotsCount} lot{lotsCount > 1 ? "s" : ""}
                  </span>
                </div>
                <input
                  type="range"
                  min={2}
                  max={60}
                  value={lotsCount}
                  onChange={(e) => setLotsCount(Number(e.target.value))}
                  className="w-full accent-emerald-500 h-2 bg-slate-800 rounded-lg cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-500 mt-1 font-mono">
                  <span>2 lots</span>
                  <span>30 lots</span>
                  <span>60 lots</span>
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-xs font-bold text-slate-300">
                    Loyer mensuel moyen par lot :
                  </label>
                  <span className="text-lg font-black text-emerald-400">
                    {formatCurrency(avgRent)}
                  </span>
                </div>
                <input
                  type="range"
                  min={50000}
                  max={1000000}
                  step={25000}
                  value={avgRent}
                  onChange={(e) => setAvgRent(Number(e.target.value))}
                  className="w-full accent-emerald-500 h-2 bg-slate-800 rounded-lg cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-500 mt-1 font-mono">
                  <span>50 000 FCFA</span>
                  <span>500 000 FCFA</span>
                  <span>1 000 000 FCFA</span>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 text-[11px] text-slate-400 leading-relaxed">
                💡 <strong className="text-slate-200">Conseil LOUTIGUI :</strong> Plus votre parc grandit, plus l&apos;encaissement automatisé par Wave et Orange Money vous évite les contestations d&apos;écritures et les déplacements physiques.
              </div>
            </div>

            {/* Live Stats Preview */}
            <div className="space-y-4 p-6 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-950 border border-emerald-500/30 shadow-xl">
              <span className="text-[10px] font-extrabold uppercase text-emerald-400 tracking-wider">
                Résultats Estimés en Direct
              </span>

              <div className="space-y-1">
                <span className="text-xs text-slate-400">Volume mensuel sécurisé</span>
                <p className="text-3xl sm:text-4xl font-black text-white">
                  {formatCurrency(totalMonthlyCollected)}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-800">
                <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800">
                  <div className="flex items-center gap-1.5 text-emerald-400 text-xs font-bold mb-0.5">
                    <Clock className="w-3.5 h-3.5" />
                    <span>Temps Gagné</span>
                  </div>
                  <p className="text-xl font-black text-white">~{hoursSaved} h / mois</p>
                  <span className="text-[10px] text-slate-400">Plus de quittances manuelles</span>
                </div>

                <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800">
                  <div className="flex items-center gap-1.5 text-emerald-400 text-xs font-bold mb-0.5">
                    <TrendingUp className="w-3.5 h-3.5" />
                    <span>Taux Recouvrement</span>
                  </div>
                  <p className="text-xl font-black text-emerald-400">{recoveryRate}%</p>
                  <span className="text-[10px] text-slate-400">Grâce aux rappels auto</span>
                </div>
              </div>

              <Link
                href="/signup"
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs transition shadow-lg shadow-emerald-500/20"
              >
                <span>Sécuriser ce revenu maintenant</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section (3-Tiers Clean: Starter, Pro, Agence) */}
      <section id="tarifs" className="py-20 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-xs font-bold uppercase tracking-wider">
            <Award className="w-3.5 h-3.5" />
            <span>Tarification Claire & Sans Surprise</span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-black text-white">
            Choisissez l&apos;Offre Adaptée à votre Parc
          </h2>
          <p className="text-xs sm:text-sm text-slate-400">
            Abonnement mensuel sans engagement. Aucun frais caché par transaction.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Plan 1: Starter */}
          <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800 flex flex-col justify-between space-y-6 hover:border-slate-700 transition">
            <div className="space-y-4">
              <div>
                <span className="px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 text-[10px] font-bold uppercase">
                  Propriétaire Particulier
                </span>
                <h3 className="text-xl font-black text-white mt-2">Starter</h3>
                <p className="text-xs text-slate-400 mt-1">
                  Idéal pour gérer vos premiers logements en toute sérénité.
                </p>
              </div>

              <div>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-black text-white">10 000</span>
                  <span className="text-xs font-bold text-slate-400">FCFA / mois</span>
                </div>
                <span className="text-[11px] text-emerald-400 font-semibold">
                  Jusqu&apos;à 10 lots gérés
                </span>
              </div>

              <div className="space-y-2.5 text-xs text-slate-300 pt-2 border-t border-slate-800">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Encaissement Mobile Money intégré</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Quittances officielles avec QR Code</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Suivi des impayés & échéancier</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Support technique par WhatsApp</span>
                </div>
              </div>
            </div>

            <Link
              href="/signup"
              className="w-full py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs text-center transition"
            >
              Choisir le forfait Starter
            </Link>
          </div>

          {/* Plan 2: Pro (Featured) */}
          <div className="p-6 sm:p-7 rounded-3xl bg-gradient-to-b from-slate-900 to-slate-950 border-2 border-emerald-500 shadow-2xl shadow-emerald-500/10 flex flex-col justify-between space-y-6 relative">
            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 text-[10px] font-black uppercase tracking-wider shadow-md">
              Recommandé &bull; Plus Choisi
            </div>

            <div className="space-y-4">
              <div>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold uppercase">
                  Bailleurs & Investisseurs
                </span>
                <h3 className="text-xl font-black text-white mt-2">Pro</h3>
                <p className="text-xs text-slate-400 mt-1">
                  Automatisation totale des relances et gestion juridique des baux.
                </p>
              </div>

              <div>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-black text-emerald-400">25 000</span>
                  <span className="text-xs font-bold text-slate-400">FCFA / mois</span>
                </div>
                <span className="text-[11px] text-emerald-400 font-semibold">
                  Jusqu&apos;à 35 lots gérés
                </span>
              </div>

              <div className="space-y-2.5 text-xs text-slate-200 pt-2 border-t border-slate-800">
                <div className="flex items-center gap-2 font-semibold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Tout le forfait Starter inclus</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Relances WhatsApp automatiques programmées</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Générateur de baux de location conformes</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Gestion des demandes d&apos;intervention</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Assistance téléphonique prioritaire 7j/7</span>
                </div>
              </div>
            </div>

            <Link
              href="/signup"
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs text-center shadow-lg shadow-emerald-500/25 transition active:scale-95"
            >
              Démarrer avec l&apos;Offre Pro
            </Link>
          </div>

          {/* Plan 3: Agence */}
          <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800 flex flex-col justify-between space-y-6 hover:border-slate-700 transition">
            <div className="space-y-4">
              <div>
                <span className="px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 text-[10px] font-bold uppercase">
                  Agences & Syndics
                </span>
                <h3 className="text-xl font-black text-white mt-2">Agence</h3>
                <p className="text-xs text-slate-400 mt-1">
                  Gestion multi-propriétaires et exports comptables avancés.
                </p>
              </div>

              <div>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-black text-white">50 000</span>
                  <span className="text-xs font-bold text-slate-400">FCFA / mois</span>
                </div>
                <span className="text-[11px] text-emerald-400 font-semibold">
                  Lots illimités
                </span>
              </div>

              <div className="space-y-2.5 text-xs text-slate-300 pt-2 border-t border-slate-800">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Lots et immeubles illimités</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Accès multi-utilisateurs & gestionnaires</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Rapports financiers & exports Excel</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Accompagnement & onboarding personnalisé</span>
                </div>
              </div>
            </div>

            <Link
              href="/signup"
              className="w-full py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs text-center transition"
            >
              Choisir le forfait Agence
            </Link>
          </div>
        </div>
      </section>

      {/* FAQ Accordion */}
      <section id="faq" className="py-20 bg-slate-900/40 border-t border-slate-800/80">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="text-center space-y-2">
            <h2 className="text-2xl sm:text-3xl font-black text-white">
              Questions Fréquentes
            </h2>
            <p className="text-xs sm:text-sm text-slate-400">
              Tout ce que vous devez savoir pour commencer en toute confiance.
            </p>
          </div>

          <div className="space-y-3">
            {[
              {
                q: "Puis-je encaisser par Wave, Orange Money et MTN en même temps ?",
                a: "Oui, parfaitement. LOUTIGUI permet à vos locataires de régler via Wave CI, Orange Money, MTN MoMo ou Moov Money selon leur préférence. Chaque règlement est rapproché avec son échéance en quelques secondes.",
              },
              {
                q: "Les quittances générées avec QR Code sont-elles valides juridiquement ?",
                a: "Oui. Chaque quittance comporte un QR Code et une empreinte cryptographique unique attestant de la date, du montant et de l'identité du locataire. Ce certificat infalsifiable est accepté par les banques et administrations.",
              },
              {
                q: "Comment fonctionnent les relances WhatsApp automatiques ?",
                a: "Vous activez le scénario de relance de votre choix. LOUTIGUI transmet des messages courtois avec le récapitulatif du loyer dû et le lien direct pour régler, sans aucune intervention manuelle de votre part.",
              },
              {
                q: "Que se passe-t-il si je n'ai pas de connexion internet sur le terrain ?",
                a: "LOUTIGUI intègre un mode hors-ligne résilient. Vous pouvez saisir un encaissement ou consulter une fiche locataire même sans réseau. Dès le retour de la connexion, tout se synchronise de manière transparente.",
              },
              {
                q: "Ai-je besoin d'une carte bancaire pour créer mon compte ?",
                a: "Non, aucune carte bancaire n'est exigée. Vous pouvez créer votre compte gratuitement en moins de 3 minutes et régler votre abonnement par Mobile Money en toute simplicité.",
              },
            ].map((faq, index) => (
              <div
                key={index}
                className="rounded-2xl bg-slate-900/80 border border-slate-800 overflow-hidden transition"
              >
                <button
                  onClick={() => toggleFaq(index)}
                  className="w-full p-5 text-left flex justify-between items-center gap-4 hover:bg-slate-800/50 transition"
                >
                  <span className="font-bold text-sm text-white">{faq.q}</span>
                  {openFaq === index ? (
                    <ChevronUp className="w-4 h-4 text-emerald-400 shrink-0" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
                  )}
                </button>
                {openFaq === index && (
                  <div className="px-5 pb-5 text-xs text-slate-300 leading-relaxed border-t border-slate-800/60 pt-3">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final Call to Action */}
      <section className="py-20 relative">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="p-8 sm:p-12 rounded-3xl bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 border border-emerald-500/30 text-center space-y-6 shadow-2xl relative overflow-hidden">
            <div className="space-y-3 relative z-10">
              <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold uppercase tracking-wider border border-emerald-500/30">
                Démarrez en toute simplicité
              </span>
              <h2 className="text-3xl sm:text-4xl font-black text-white max-w-2xl mx-auto">
                Prêt à Sécuriser vos Loyers dès ce Mois-ci ?
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 max-w-lg mx-auto leading-relaxed">
                Rejoignez les gestionnaires et propriétaires qui encaissent à temps et éliminent les litiges avec LOUTIGUI.
              </p>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3 relative z-10 max-w-sm mx-auto">
              <Link
                href="/signup"
                className="w-full flex items-center justify-center gap-2 py-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-sm shadow-xl shadow-emerald-500/25 transition active:scale-95"
              >
                <span>Créer mon Compte Gratuit</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-slate-800/80 text-xs text-slate-400 bg-slate-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-emerald-500 flex items-center justify-center text-slate-950 font-black">
              <Building2 className="w-4 h-4" />
            </div>
            <span className="font-black text-sm text-white tracking-tight">LOUTIGUI</span>
            <span className="text-slate-600">&bull;</span>
            <span>Abidjan, Côte d&apos;Ivoire</span>
          </div>

          <div className="flex items-center gap-6 text-[11px] font-semibold text-slate-400">
            <a href="#paiements" className="hover:text-white transition">Paiements</a>
            <a href="#fonctionnalites" className="hover:text-white transition">Fonctionnalités</a>
            <a href="#tarifs" className="hover:text-white transition">Tarifs</a>
            <Link href="/login" className="hover:text-white transition">Espace Client</Link>
          </div>

          <p className="text-[11px] text-slate-400">
            &copy; {new Date().getFullYear()} LOUTIGUI. Tous droits réservés.
          </p>
        </div>
      </footer>
    </div>
  );
}
