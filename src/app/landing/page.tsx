import type { Metadata } from "next";
import { LandingPage } from "@/components/LandingPage";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") || "https://loutigui.app";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "LOUTIGUI — Gestion locative, quittances vérifiables & Mobile Money",
  description:
    "Gérez vos loyers, encaissez par Wave, Orange Money, MTN MoMo et Moov, et émettez des quittances vérifiables par QR code. Essai gratuit de 7 jours, sans carte bancaire.",
  keywords: [
    "gestion locative Côte d'Ivoire",
    "logiciel loyers Abidjan",
    "quittance de loyer QR code",
    "encaissement Mobile Money loyer",
    "Wave Orange Money MTN Moov",
    "bail de location en ligne",
    "relance loyer WhatsApp",
    "SaaS immobilier africain",
  ],
  alternates: { canonical: "/landing" },
  openGraph: {
    type: "website",
    locale: "fr_CI",
    siteName: "LOUTIGUI",
    url: "/landing",
    title: "LOUTIGUI — Vos loyers rentrent à l'heure. Vos preuves aussi.",
    description:
      "Encaissements Mobile Money, quittances vérifiables, baux professionnels et relances automatiques dans un seul espace.",
  },
  twitter: {
    card: "summary_large_image",
    title: "LOUTIGUI — Gestion locative intelligente",
    description:
      "Encaissez vos loyers et émettez des quittances vérifiables en quelques clics.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large" },
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "LOUTIGUI",
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web",
  url: `${siteUrl}/landing`,
  description:
    "Plateforme SaaS de gestion locative : encaissements Mobile Money, quittances vérifiables, baux et suivi des impayés.",
  offers: {
    "@type": "AggregateOffer",
    priceCurrency: "XOF",
    lowPrice: "10000",
    highPrice: "50000",
    offers: [
      { "@type": "Offer", name: "Starter", price: "10000", priceCurrency: "XOF" },
      { "@type": "Offer", name: "Pro", price: "25000", priceCurrency: "XOF" },
      { "@type": "Offer", name: "Agence", price: "50000", priceCurrency: "XOF" },
    ],
  },
};

export default function PublicLandingPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <LandingPage />
    </>
  );
}
