"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { BackArrow } from "@/components/navigation/back-arrow";

export default function HygieneLayout({ children }: { children: ReactNode }) {
  const router = useRouter();

  async function quit() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.replace("/acces/hygiene");
    router.refresh();
  }

  return (
    <div className="min-h-dvh bg-slate-50 text-slate-900">
      <header className="sticky top-0 z-20 flex items-center justify-between border-b border-slate-200 bg-white/95 px-4 py-3 backdrop-blur">
        <div className="flex items-center gap-3">
          <BackArrow />
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-teal-700">Sanitrace</p>
            <p className="font-serif text-lg font-semibold">Accès hygiène</p>
          </div>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <Link href="/station-impression" className="text-slate-500">
            Imprimante
          </Link>
          <button type="button" onClick={() => void quit()} className="text-slate-500">
            Quitter
          </button>
        </div>
      </header>
      <div className="mx-auto max-w-5xl px-4 py-6">{children}</div>
    </div>
  );
}
