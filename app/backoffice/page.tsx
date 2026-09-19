"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { formatDateHeure } from "@/lib/utils";

type Dashboard = {
  etablissement: { id: string; nom: string };
  etablissements: { id: string; nom: string; enRetard: number; ncOuvertes: number }[];
  compteurs: {
    aFaire: number;
    enRetard: number;
    fait: number;
    ncOuvertes: number;
    receptionsToday: number;
    alertes: number;
  };
  taches: {
    id: string;
    titre: string;
    sousTitre: string;
    statut: "a_faire" | "fait" | "en_retard";
  }[];
  nonConformites: { id: string; constat: string; gravite: string; statut: string; createdAt: string }[];
  alertes: {
    type: string;
    gravite: string;
    message: string;
    href: string;
    etablissementNom: string;
  }[];
};

export default function DashboardPage() {
  const [data, setData] = useState<Dashboard | null>(null);
  const [etabId, setEtabId] = useState<string>("");

  useEffect(() => {
    const qs = etabId ? `?etablissementId=${etabId}` : "";
    void fetch(`/api/dashboard${qs}`)
      .then((r) => r.json())
      .then((d: Dashboard) => {
        setData(d);
        if (!etabId) setEtabId(d.etablissement.id);
      });
  }, [etabId]);

  if (!data) return <p className="text-slate-500">Chargement du tableau de bord…</p>;

  const cards = [
    { label: "En retard", value: data.compteurs.enRetard, tone: "bg-amber-100 text-amber-900" },
    { label: "À faire", value: data.compteurs.aFaire, tone: "bg-sky-100 text-sky-900" },
    { label: "Fait", value: data.compteurs.fait, tone: "bg-emerald-100 text-emerald-900" },
    { label: "NC ouvertes", value: data.compteurs.ncOuvertes, tone: "bg-red-100 text-red-900" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-teal-700">Temps réel</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">{data.etablissement.nom}</h1>
          <p className="text-slate-500">
            {data.compteurs.receptionsToday} réceptions · {data.compteurs.alertes} alertes
          </p>
        </div>
        <select
          className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-3 sm:w-auto"
          value={etabId}
          onChange={(e) => setEtabId(e.target.value)}
          aria-label="Établissement"
        >
          {data.etablissements.map((e) => (
            <option key={e.id} value={e.id}>
              {e.nom} · {e.enRetard} retard · {e.ncOuvertes} NC
            </option>
          ))}
        </select>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <Link
          href="/backoffice/personnel"
          className="rounded-3xl border border-slate-200 bg-white p-5 hover:border-teal-300"
        >
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-teal-700">Équipe</p>
          <p className="mt-1 text-lg font-semibold">Salariés & accès</p>
          <p className="mt-1 text-sm text-slate-500">Ajouter un salarié, un gérant ou un code back-office.</p>
        </Link>
        <Link
          href="/backoffice/produits"
          className="rounded-3xl border border-slate-200 bg-white p-5 hover:border-teal-300"
        >
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-teal-700">Traçabilité</p>
          <p className="mt-1 text-lg font-semibold">Produits</p>
          <p className="mt-1 text-sm text-slate-500">Réceptions et lots filtrés par jour, semaine ou mois.</p>
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {cards.map((c) => (
          <div key={c.label} className={`rounded-3xl p-5 ${c.tone}`}>
            <p className="text-sm font-medium">{c.label}</p>
            <p className="mt-2 font-mono text-4xl">{c.value}</p>
          </div>
        ))}
      </div>

      {data.etablissements.length > 1 ? (
        <section className="rounded-3xl bg-white p-5 shadow-sm">
          <h2 className="mb-3 text-lg font-semibold">Multi-établissement</h2>
          <div className="grid gap-2 sm:grid-cols-2">
            {data.etablissements.map((e) => (
              <button
                key={e.id}
                type="button"
                onClick={() => setEtabId(e.id)}
                className="rounded-2xl border border-slate-100 p-4 text-left hover:border-teal-300"
              >
                <p className="font-medium">{e.nom}</p>
                <p className="text-sm text-slate-500">
                  {e.enRetard} en retard · {e.ncOuvertes} NC
                </p>
              </button>
            ))}
          </div>
        </section>
      ) : null}

      <section className="rounded-3xl bg-white p-5 shadow-sm">
        <h2 className="mb-3 text-lg font-semibold">Alertes</h2>
        {data.alertes.length === 0 ? (
          <p className="text-sm text-slate-500">Aucune alerte.</p>
        ) : (
          <div className="space-y-2">
            {data.alertes.map((a, i) => (
              <Link key={`${a.type}-${i}`} href={a.href} className="block rounded-2xl border border-slate-100 p-3">
                <p className="text-xs uppercase text-slate-400">
                  {a.etablissementNom} · {a.type}
                </p>
                <p className="font-medium">{a.message}</p>
              </Link>
            ))}
          </div>
        )}
      </section>

      <section className="rounded-3xl bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Tâches du service</h2>
          <Link href="/terrain" className="text-sm text-teal-700">
            Ouvrir le terrain
          </Link>
        </div>
        <div className="divide-y divide-slate-100">
          {data.taches.map((t) => (
            <div key={t.id} className="flex items-center justify-between py-3">
              <div>
                <p className="font-medium">{t.titre}</p>
                <p className="text-sm text-slate-500">{t.sousTitre}</p>
              </div>
              <Badge variant={t.statut === "fait" ? "ok" : t.statut === "en_retard" ? "warn" : "info"}>
                {t.statut.replace("_", " ")}
              </Badge>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-3xl bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Non-conformités ouvertes</h2>
          <Link href="/backoffice/non-conformites" className="text-sm text-teal-700">
            CAPA
          </Link>
        </div>
        {data.nonConformites.length === 0 ? (
          <p className="text-sm text-slate-500">Aucune NC ouverte.</p>
        ) : (
          <div className="space-y-3">
            {data.nonConformites.map((nc) => (
              <div key={nc.id} className="rounded-2xl border border-slate-100 p-4">
                <p className="font-medium">{nc.constat}</p>
                <p className="mt-1 text-xs uppercase text-slate-500">
                  {nc.gravite} · {nc.statut} · {formatDateHeure(nc.createdAt)}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
