import type { Metadata, Viewport } from "next";
import { DM_Sans, IBM_Plex_Mono, Source_Serif_4 } from "next/font/google";
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

const serif = Source_Serif_4({
  subsets: ["latin"],
  variable: "--font-serif",
  weight: ["500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Sanitrace — Contrôle sanitaire HACCP",
  description:
    "Relevés, traçabilité, plan de nettoyage et dossier DDPP pour chaque établissement.",
  applicationName: "Sanitrace",
  manifest: "/manifest.json",
  icons: { icon: "/logo-le-zinc-bouillon.png", apple: "/logo-le-zinc-bouillon.png" },
  appleWebApp: {
    capable: true,
    title: "Sanitrace",
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
      <body className={`${sans.variable} ${mono.variable} ${serif.variable} font-sans antialiased`}>
        <RegisterSw />
        {children}
      </body>
    </html>
  );
}
