"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ChefHat, ClipboardCheck, LayoutDashboard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LogoSanitrace } from "@/components/brand/logo-sanitrace";

const acces = [
  {
    href: "/terrain",
    label: "Accès Employé",
    texte: "Relevés, check-lists, infos du gérant, ménage et étiquettes.",
    icon: ChefHat,
  },
  {
    href: "/backoffice",
    label: "Accès Administrateur",
    texte: "Équipe, messagerie, équipements, traçabilité et paramétrage.",
    icon: LayoutDashboard,
  },
  {
    href: "/hygiene",
    label: "Accès Hygiène",
    texte: "Dossier inspecteur et export PDF.",
    icon: ClipboardCheck,
  },
];

type EtabItem = { id: string; nom: string };

export default function AccueilPage() {
  const router = useRouter();
  const [nom, setNom] = useState("Établissement");
  const [items, setItems] = useState<EtabItem[]>([]);
  const [courantId, setCourantId] = useState<string | null>(null);

  useEffect(() => {
    void fetch("/api/auth/etablissements")
      .then(async (res) => {
        if (!res.ok) return null;
        return res.json() as Promise<{ courantId?: string; items?: EtabItem[] }>;
      })
      .then((data) => {
        if (!data) return;
        setItems(data.items ?? []);
        setCourantId(data.courantId ?? null);
        const current = (data.items ?? []).find((e) => e.id === data.courantId);
        if (current) setNom(current.nom);
      })
      .catch(() => undefined);
  }, []);

  async function changerEtab(id: string) {
    const res = await fetch("/api/auth/etablissement-courant", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ etablissementId: id }),
    });
    if (!res.ok) return;
    setCourantId(id);
    const current = items.find((e) => e.id === id);
    if (current) setNom(current.nom);
    router.refresh();
  }

  async function deconnecter() {
    await fetch("/api/auth/logout", { method: "POST", headers: { Accept: "application/json" } });
    router.replace("/");
    router.refresh();
  }

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-5xl flex-col px-4 py-6 sm:px-6 sm:py-10">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <LogoSanitrace size={48} />
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-teal-700">Sanitrace</p>
            <h1 className="truncate font-serif text-2xl font-semibold text-slate-900 sm:text-3xl">{nom}</h1>
          </div>
        </div>
        <Button type="button" variant="outline" onClick={() => void deconnecter()}>
          Se déconnecter
        </Button>
      </header>

      {items.length > 1 ? (
        <label className="mt-6 block max-w-md space-y-1.5">
          <span className="text-xs font-medium uppercase tracking-[0.16em] text-slate-500">Établissement</span>
          <select
            className="h-12 w-full rounded-2xl border border-slate-200 px-3"
            value={courantId ?? ""}
            onChange={(e) => void changerEtab(e.target.value)}
          >
            {items.map((e) => (
              <option key={e.id} value={e.id}>
                {e.nom}
              </option>
            ))}
          </select>
        </label>
      ) : null}

      <p className="mt-4 text-sm text-slate-500">
        <Link href="/creer-compte" className="font-semibold text-teal-800">
          Ajouter un établissement
        </Link>
      </p>

      <div className="mt-10 grid gap-4 md:grid-cols-3">
        {acces.map((a) => (
          <Link
            key={a.href}
            href={a.href}
            className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-teal-500"
          >
            <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-50 text-teal-800">
              <a.icon className="h-6 w-6" />
            </span>
            <h2 className="mt-5 font-serif text-xl font-semibold text-slate-900">{a.label}</h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-500">{a.texte}</p>
            <p className="mt-6 text-sm font-semibold text-teal-800">Ouvrir →</p>
          </Link>
        ))}
      </div>
    </main>
  );
}
