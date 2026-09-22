"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Building2, Tags, Thermometer, Users } from "lucide-react";
import { BrandLogo, SanitraceNom } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";

type EtabLigne = {
  id: string;
  nom: string;
  email: string | null;
  telephone: string | null;
  slug: string | null;
  logoUrl: string | null;
  actif: boolean;
  createdAt: string;
  organisation: string;
  membres: number;
  releves: number;
  etiquettes: number;
};

type Payload = {
  synthese: { total: number; actifs: number; nouveaux30j: number };
  etablissements: EtabLigne[];
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });
}

export default function CreateursDashboardPage() {
  const router = useRouter();
  const [data, setData] = useState<Payload | null>(null);
  const [error, setError] = useState<string | null>(null);

  const charger = useCallback(async () => {
    const res = await fetch("/api/createurs/etablissements");
    if (!res.ok) {
      setError("Impossible de charger les établissements");
      return;
    }
    setData((await res.json()) as Payload);
  }, []);

  useEffect(() => {
    void charger();
  }, [charger]);

  async function toggleActif(etab: EtabLigne) {
    const res = await fetch("/api/createurs/etablissements", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: etab.id, actif: !etab.actif }),
    });
    if (res.ok) await charger();
  }

  async function quit() {
    await fetch("/api/createurs/logout", { method: "POST" });
    router.replace("/createurs/connexion");
    router.refresh();
  }

  return (
    <main className="min-h-dvh bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-4">
          <div className="flex items-center gap-3">
            <BrandLogo size={44} />
            <div>
              <SanitraceNom />
              <p className="font-serif text-lg font-semibold">Dashboard créateurs</p>
            </div>
          </div>
          <Button variant="outline" onClick={() => void quit()}>
            Quitter
          </Button>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-6 py-8">
        <p className="text-sm text-slate-500">
          Vue globale de tous les établissements inscrits. Chaque restaurant a son espace isolé.
        </p>

        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <Carte
            icon={Building2}
            label="Établissements"
            valeur={data?.synthese.total ?? "—"}
          />
          <Carte icon={Building2} label="Actifs" valeur={data?.synthese.actifs ?? "—"} />
          <Carte icon={Building2} label="Nouveaux (30 j)" valeur={data?.synthese.nouveaux30j ?? "—"} />
        </div>

        {error ? <p className="mt-6 text-sm text-red-600">{error}</p> : null}

        <div className="mt-8 overflow-hidden rounded-3xl border border-slate-200 bg-white">
          <div className="hidden grid-cols-[2fr_1.4fr_0.8fr_0.7fr_0.7fr_0.9fr] gap-3 border-b border-slate-100 px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400 md:grid">
            <span>Établissement</span>
            <span>Contact</span>
            <span>Membres</span>
            <span>Relevés</span>
            <span>Étiquettes</span>
            <span>Statut</span>
          </div>
          {(data?.etablissements ?? []).map((e) => (
            <div
              key={e.id}
              className="grid gap-3 border-b border-slate-100 px-5 py-4 last:border-0 md:grid-cols-[2fr_1.4fr_0.8fr_0.7fr_0.7fr_0.9fr] md:items-center"
            >
              <div className="flex min-w-0 items-center gap-3">
                <BrandLogo size={40} src={e.logoUrl} alt={e.nom} className="rounded-xl" />
                <div className="min-w-0">
                  <p className="truncate font-semibold">{e.nom}</p>
                  <p className="truncate text-xs text-slate-400">
                    {e.slug ?? "—"} · {formatDate(e.createdAt)}
                  </p>
                </div>
              </div>
              <div className="min-w-0 text-sm text-slate-600">
                <p className="truncate">{e.email ?? "Pas d’e-mail"}</p>
                <p className="truncate text-xs text-slate-400">{e.telephone ?? ""}</p>
              </div>
              <p className="flex items-center gap-1.5 text-sm text-slate-600">
                <Users className="h-3.5 w-3.5" />
                {e.membres}
              </p>
              <p className="flex items-center gap-1.5 text-sm text-slate-600">
                <Thermometer className="h-3.5 w-3.5" />
                {e.releves}
              </p>
              <p className="flex items-center gap-1.5 text-sm text-slate-600">
                <Tags className="h-3.5 w-3.5" />
                {e.etiquettes}
              </p>
              <button
                type="button"
                onClick={() => void toggleActif(e)}
                className={`justify-self-start rounded-full px-3 py-1 text-xs font-semibold ${
                  e.actif ? "bg-teal-50 text-teal-800" : "bg-slate-100 text-slate-500"
                }`}
              >
                {e.actif ? "Actif" : "Suspendu"}
              </button>
            </div>
          ))}
          {data && data.etablissements.length === 0 ? (
            <p className="px-5 py-10 text-center text-sm text-slate-500">Aucun établissement inscrit pour l’instant.</p>
          ) : null}
        </div>
      </div>
    </main>
  );
}

function Carte({
  icon: Icon,
  label,
  valeur,
}: {
  icon: typeof Building2;
  label: string;
  valeur: number | string;
}) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5">
      <Icon className="h-5 w-5 text-teal-700" />
      <p className="mt-4 text-3xl font-semibold">{valeur}</p>
      <p className="mt-1 text-sm text-slate-500">{label}</p>
    </div>
  );
}
