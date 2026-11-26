import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { AppProvider } from "@/context/AppContext";
import { AppLayout } from "@/components/AppLayout";

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") || "https://loutigui.app"
  ),
  title: "LOUTIGUI – Plateforme SaaS de Gestion Locative",
  description:
    "Système d'exploitation de gestion locative en Afrique francophone. Suivi des loyers, quittances sécurisées QR Code, encaissements Mobile Money et relances automatiques.",
  icons: { icon: "/icon.svg", shortcut: "/icon.svg", apple: "/icon.svg" },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className="light" suppressHydrationWarning>
      <body className="antialiased selection:bg-emerald-500 selection:text-white">
        <Script id="lp-theme-init" strategy="beforeInteractive">
          {`(function(){try{if(localStorage.getItem('loutigui-landing-theme')==='dark'){document.documentElement.setAttribute('data-lp-theme','dark');}}catch(e){}})();`}
        </Script>
        <AuthProvider>
          <AppProvider>
            <AppLayout>{children}</AppLayout>
          </AppProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
