"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Building2, Tags, Thermometer, Trash2, Users } from "lucide-react";
import { BrandLogo } from "@/components/brand/logo";
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
  const [granted, setGranted] = useState(true);
  const [cible, setCible] = useState<EtabLigne | null>(null);
  const [confirmation, setConfirmation] = useState("");
  const [suppression, setSuppression] = useState(false);

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
    const t = window.setTimeout(() => setGranted(false), 1400);
    return () => window.clearTimeout(t);
  }, [charger]);

  async function toggleActif(etab: EtabLigne) {
    const res = await fetch("/api/createurs/etablissements", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: etab.id, actif: !etab.actif }),
    });
    if (res.ok) await charger();
  }

  async function confirmerSuppression() {
    if (!cible || confirmation.trim() !== cible.nom) return;
    setSuppression(true);
    const res = await fetch("/api/createurs/etablissements", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: cible.id }),
    });
    const payload = (await res.json()) as { error?: string };
    setSuppression(false);
    if (!res.ok) {
      setError(payload.error ?? "Suppression impossible");
      return;
    }
    setCible(null);
    setConfirmation("");
    await charger();
  }

  async function quit() {
    await fetch("/api/createurs/logout", { method: "POST" });
    router.replace("/");
    router.refresh();
  }

  return (
    <main className="relative min-h-dvh overflow-hidden bg-[#07090d] text-zinc-100">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(212,175,55,0.12),_transparent_38%)]" />
      <div className="pointer-events-none absolute inset-0 opacity-[0.07] [background-image:linear-gradient(rgba(255,255,255,0.16)_1px,transparent_1px)] [background-size:100%_4px]" />

      {granted ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black">
          <p className="font-mono text-sm uppercase tracking-[0.55em] text-amber-300">Accès autorisé</p>
        </div>
      ) : null}

      <header className="relative border-b border-white/10">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-4">
          <div className="flex items-center gap-3">
            <BrandLogo size={44} />
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-amber-300/80">
                Sanitrace · Q.G.
              </p>
              <p className="font-serif text-lg font-semibold text-white">Super administrateur</p>
            </div>
          </div>
          <Button
            variant="outline"
            className="border-white/20 bg-transparent text-zinc-200 hover:bg-white/10"
            onClick={() => void quit()}
          >
            Sortir
          </Button>
        </div>
      </header>

      <div className="relative mx-auto max-w-6xl px-6 py-8">
        <p className="font-mono text-xs uppercase tracking-[0.22em] text-amber-200/70">
          Tous les établissements · suppression définitive possible
        </p>

        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <Carte label="Établissements" valeur={data?.synthese.total ?? "—"} />
          <Carte label="Actifs" valeur={data?.synthese.actifs ?? "—"} />
          <Carte label="Nouveaux (30 j)" valeur={data?.synthese.nouveaux30j ?? "—"} />
        </div>

        {error ? <p className="mt-6 text-sm text-red-400">{error}</p> : null}

        <div className="mt-8 overflow-hidden rounded-3xl border border-white/10 bg-black/40">
          <div className="hidden grid-cols-[2fr_1.4fr_0.7fr_0.7fr_0.7fr_1.3fr] gap-3 border-b border-white/10 px-5 py-3 font-mono text-[11px] font-semibold uppercase tracking-wider text-zinc-500 md:grid">
            <span>Établissement</span>
            <span>Contact</span>
            <span>Membres</span>
            <span>Relevés</span>
            <span>Étiquettes</span>
            <span>Actions</span>
          </div>
          {(data?.etablissements ?? []).map((e) => (
            <div
              key={e.id}
              className="grid gap-3 border-b border-white/10 px-5 py-4 last:border-0 md:grid-cols-[2fr_1.4fr_0.7fr_0.7fr_0.7fr_1.3fr] md:items-center"
            >
              <div className="flex min-w-0 items-center gap-3">
                <BrandLogo size={40} src={e.logoUrl} alt={e.nom} className="rounded-xl" />
                <div className="min-w-0">
                  <p className="truncate font-semibold text-white">{e.nom}</p>
                  <p className="truncate font-mono text-xs text-zinc-500">
                    {e.slug ?? "—"} · {formatDate(e.createdAt)}
                  </p>
                </div>
              </div>
              <div className="min-w-0 text-sm text-zinc-400">
                <p className="truncate">{e.email ?? "Pas d’e-mail"}</p>
                <p className="truncate text-xs text-zinc-600">{e.telephone ?? ""}</p>
              </div>
              <p className="flex items-center gap-1.5 text-sm text-zinc-300">
                <Users className="h-3.5 w-3.5" />
                {e.membres}
              </p>
              <p className="flex items-center gap-1.5 text-sm text-zinc-300">
                <Thermometer className="h-3.5 w-3.5" />
                {e.releves}
              </p>
              <p className="flex items-center gap-1.5 text-sm text-zinc-300">
                <Tags className="h-3.5 w-3.5" />
                {e.etiquettes}
              </p>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => void toggleActif(e)}
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${
                    e.actif ? "bg-emerald-500/15 text-emerald-300" : "bg-white/10 text-zinc-400"
                  }`}
                >
                  {e.actif ? "Actif" : "Suspendu"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setCible(e);
                    setConfirmation("");
                    setError(null);
                  }}
                  className="inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold text-red-300 hover:bg-red-500/10"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Supprimer
                </button>
              </div>
            </div>
          ))}
          {data && data.etablissements.length === 0 ? (
            <p className="px-5 py-10 text-center text-sm text-zinc-500">Aucun établissement inscrit pour l’instant.</p>
          ) : null}
        </div>
      </div>

      {cible ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-md rounded-3xl border border-white/15 bg-[#0c1018] p-6">
            <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-amber-300">Mission irréversible</p>
            <h2 className="mt-2 font-serif text-2xl text-white">Supprimer {cible.nom} ?</h2>
            <p className="mt-2 text-sm text-zinc-400">
              Tout disparaît : employés, relevés, étiquettes, dossier hygiène. Tape le nom exact pour confirmer.
            </p>
            <input
              value={confirmation}
              onChange={(e) => setConfirmation(e.target.value)}
              className="mt-4 h-12 w-full rounded-2xl border border-white/15 bg-black/40 px-4 text-white"
              placeholder={cible.nom}
            />
            <div className="mt-5 flex gap-2">
              <Button
                variant="outline"
                className="flex-1 border-white/20 bg-transparent text-zinc-200 hover:bg-white/10"
                onClick={() => setCible(null)}
              >
                Annuler
              </Button>
              <Button
                variant="danger"
                className="flex-1"
                disabled={suppression || confirmation.trim() !== cible.nom}
                onClick={() => void confirmerSuppression()}
              >
                {suppression ? "Suppression…" : "Supprimer"}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}

function Carte({ label, valeur }: { label: string; valeur: number | string }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-black/40 p-5">
      <Building2 className="h-5 w-5 text-amber-300" />
      <p className="mt-4 text-3xl font-semibold text-white">{valeur}</p>
      <p className="mt-1 font-mono text-xs uppercase tracking-[0.16em] text-zinc-500">{label}</p>
    </div>
  );
}
