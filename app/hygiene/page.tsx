"use client";

import { useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { labelPlage, type PeriodeHygiene } from "@/lib/hygiene";
import { todayIsoDate } from "@/lib/utils";

type Personne = { id: string; prenom: string; nom: string };
type Dossier = {
  etablissement: { nom: string };
  debut: string;
  fin: string;
  pret: boolean;
  compteurs: {
    releves: number;
    receptions: number;
    menages: number;
    nc: number;
    ncOuvertes: number;
  };
};

const periodes: { id: PeriodeHygiene; label: string }[] = [
  { id: "jour", label: "Jour" },
  { id: "semaine", label: "Semaine" },
  { id: "mois", label: "Mois" },
];

const typesReleve = [
  { id: "releves", label: "Températures" },
  { id: "receptions", label: "Réceptions" },
  { id: "menage", label: "Nettoyage" },
  { id: "nc", label: "Non-conformités" },
  { id: "plats", label: "Plats témoins" },
  { id: "huiles", label: "Huiles" },
];

export default function AccesHygienePage() {
  const [periode, setPeriode] = useState<PeriodeHygiene>("mois");
  const [date, setDate] = useState(todayIsoDate());
  const [mois, setMois] = useState(todayIsoDate().slice(0, 7));
  const [employeId, setEmployeId] = useState("");
  const [types, setTypes] = useState<string[]>(typesReleve.map((t) => t.id));
  const [employes, setEmployes] = useState<Personne[]>([]);
  const [data, setData] = useState<Dossier | null>(null);

  useEffect(() => {
    void fetch("/api/personnel")
      .then((r) => r.json())
      .then((d: { items?: Personne[] }) => setEmployes(d.items ?? []));
  }, []);

  useEffect(() => {
    void fetch(`/api/hygiene?periode=${periode}&date=${date}`)
      .then((r) => r.json())
      .then((d: Dossier) => setData(d));
  }, [periode, date]);

  const hrefPdf = useMemo(() => {
    const qs = new URLSearchParams({
      mois,
      types: types.join(","),
    });
    if (employeId) qs.set("employeId", employeId);
    return `/api/export-pdf?${qs.toString()}`;
  }, [mois, types, employeId]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl font-semibold">Dossier de contrôle</h1>
        <p className="mt-1 text-slate-500">
          Filtre par employé, mois et type de relevé, puis télécharge le PDF.
        </p>
      </div>

      <section className="space-y-4 rounded-3xl border border-slate-200 bg-white p-5">
        <h2 className="font-serif text-lg font-semibold">Export PDF</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="text-sm text-slate-600">
            Mois
            <input
              type="month"
              value={mois}
              onChange={(e) => setMois(e.target.value)}
              className="mt-1 h-11 w-full rounded-2xl border border-slate-200 px-3"
            />
          </label>
          <label className="text-sm text-slate-600">
            Employé(e)
            <select
              value={employeId}
              onChange={(e) => setEmployeId(e.target.value)}
              className="mt-1 h-11 w-full rounded-2xl border border-slate-200 px-3"
            >
              <option value="">Tous</option>
              {employes.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.prenom} {e.nom}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="flex flex-wrap gap-2">
          {typesReleve.map((t) => {
            const on = types.includes(t.id);
            return (
              <button
                key={t.id}
                type="button"
                onClick={() =>
                  setTypes((prev) => (on ? prev.filter((x) => x !== t.id) : [...prev, t.id]))
                }
                className={`rounded-full px-3 py-2 text-sm font-semibold ${
                  on ? "bg-teal-700 text-white" : "bg-slate-100 text-slate-600"
                }`}
              >
                {t.label}
              </button>
            );
          })}
        </div>
        <a
          href={hrefPdf}
          className="inline-flex h-11 items-center rounded-2xl bg-slate-900 px-5 text-sm font-semibold text-white"
        >
          Télécharger le PDF
        </a>
      </section>

      <div className="flex rounded-2xl bg-white p-1 shadow-sm">
        {periodes.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => setPeriode(p.id)}
            className={`flex-1 rounded-xl py-2.5 text-sm font-semibold ${
              periode === p.id ? "bg-teal-700 text-white" : "text-slate-500"
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>
      <label className="flex items-center gap-2 text-sm text-slate-600">
        Date
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="h-11 rounded-2xl border border-slate-200 px-3"
        />
      </label>

      {data ? (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Stat label="Relevés" value={data.compteurs.releves} />
          <Stat label="Réceptions" value={data.compteurs.receptions} />
          <Stat label="Ménage" value={data.compteurs.menages} />
          <Stat label="NC ouvertes" value={data.compteurs.ncOuvertes} />
          <p className="col-span-2 text-sm text-slate-500 lg:col-span-4">
            {data.etablissement.nom} · {labelPlage(periode, new Date(data.debut), new Date(data.fin))}{" "}
            · <Badge variant={data.pret ? "ok" : "warn"}>{data.pret ? "Dossier prêt" : "Incomplet"}</Badge>
          </p>
        </div>
      ) : (
        <p className="text-slate-500">Chargement…</p>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-3xl bg-white p-4 shadow-sm">
      <p className="text-xs uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 font-serif text-3xl font-semibold">{value}</p>
    </div>
  );
}
