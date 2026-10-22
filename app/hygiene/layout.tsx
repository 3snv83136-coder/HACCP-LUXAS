"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { BackArrow } from "@/components/navigation/back-arrow";
import { BrandLogo, SanitraceNom } from "@/components/brand/logo";
import { useEtablissementCourant } from "@/components/brand/use-etablissement";

export default function HygieneLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const compte = useEtablissementCourant();

  function quit() {
    router.replace("/accueil");
  }

  return (
    <div className="min-h-dvh w-full overflow-x-hidden bg-transparent text-slate-900">
      <header className="sticky top-0 z-20 flex items-center justify-between border-b border-teal-200/50 bg-white/55 px-4 py-3 backdrop-blur-xl">
        <div className="flex min-w-0 items-center gap-3">
          <BackArrow />
          <BrandLogo size={36} src={compte?.logoUrl} alt={compte?.nom ?? "Établissement"} className="rounded-lg" />
          <div className="min-w-0">
            <SanitraceNom />
            <p className="truncate font-serif text-lg font-semibold">{compte?.nom ?? "Accès hygiène"}</p>
          </div>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <Link href="/station-impression" className="text-slate-500">
            Imprimante
          </Link>
          <button type="button" onClick={quit} className="text-slate-500">
            Quitter
          </button>
        </div>
      </header>
      <div className="mx-auto max-w-5xl px-4 py-6">{children}</div>
    </div>
  );
}
