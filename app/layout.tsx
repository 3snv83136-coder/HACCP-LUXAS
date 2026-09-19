import type { Metadata, Viewport } from "next";
import { DM_Sans, IBM_Plex_Mono } from "next/font/google";
import { RegisterSw } from "@/components/pwa/register-sw";
import "./globals.css";

const sans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  weight: ["400", "500", "600", "700"],
});

const mono = IBM_Plex_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: "Le Zinc Bouillon — Contrôle sanitaire HACCP",
  description:
    "Relevés de températures, ménage, traçabilité et dossier sanitaire pour Le Zinc Bouillon.",
  applicationName: "Le Zinc Bouillon",
  manifest: "/manifest.json",
  icons: { icon: "/logo-le-zinc-bouillon.png", apple: "/logo-le-zinc-bouillon.png" },
  appleWebApp: {
    capable: true,
    title: "Le Zinc Bouillon",
    statusBarStyle: "default",
  },
};

export const viewport: Viewport = {
  themeColor: "#ffffff",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body className={`${sans.variable} ${mono.variable} font-sans antialiased`}>
        <RegisterSw />
        {children}
      </body>
    </html>
  );
}
