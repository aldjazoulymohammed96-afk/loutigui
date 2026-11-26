import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { AppProvider } from "@/context/AppContext";
import { AppLayout } from "@/components/AppLayout";

export const metadata: Metadata = {
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
    <html lang="fr" className="light">
      <body className="antialiased selection:bg-emerald-500 selection:text-white">
        <AuthProvider>
          <AppProvider>
            <AppLayout>{children}</AppLayout>
          </AppProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
