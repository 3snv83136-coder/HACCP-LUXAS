"use client";

import { useEffect, useState } from "react";
import { AccesDashboardForm } from "@/components/admin/acces-dashboard-form";
import { Button } from "@/components/ui/button";
import { PARAM_KEYS } from "@/lib/params";
import { JOURS_SEMAINE, parseJoursReleve, serialiserJoursReleve } from "@/lib/jours-releve";

type Parametre = { id: string; cle: string; valeur: string };

export default function ParametresPage() {
  const [params, setParams] = useState<Parametre[]>([]);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [joursOk, setJoursOk] = useState<string | null>(null);

  async function load() {
    const res = await fetch("/api/parametres");
    const d = (await res.json()) as { params: Parametre[] };
    setParams(d.params);
    setDrafts(Object.fromEntries(d.params.map((p) => [p.id, p.valeur])));
  }

  useEffect(() => {
    void load();
  }, []);

  function parCle(cle: string) {
    return params.find((p) => p.cle === cle) ?? null;
  }

  async function save(id: string) {
    await fetch("/api/parametres", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, valeur: drafts[id] }),
    });
  }

  async function saveJours(cle: string, jours: number[]) {
    await fetch("/api/parametres", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cle, valeur: serialiserJoursReleve(jours) }),
    });
    setJoursOk("Jours d’ouverture enregistrés.");
    await load();
  }

  const matin = parCle(PARAM_KEYS.RELEVE_MATIN_JOURS);
  const soir = parCle(PARAM_KEYS.RELEVE_SOIR_JOURS);
  const heureMatin = parCle(PARAM_KEYS.RELEVE_MATIN_LIMITE);
  const heureSoir = parCle(PARAM_KEYS.RELEVE_SOIR_LIMITE);
  const caches = new Set<string>([
    PARAM_KEYS.RELEVE_MATIN_JOURS,
    PARAM_KEYS.RELEVE_SOIR_JOURS,
    PARAM_KEYS.RELEVE_MATIN_LIMITE,
    PARAM_KEYS.RELEVE_SOIR_LIMITE,
  ]);

  return (
    <div className="space-y-5 pb-16">
      <div>
        <h1 className="text-3xl font-semibold">Seuils & paramètres PMS</h1>
        <p className="max-w-2xl text-slate-500">
          Rien n’est codé en dur. Ces valeurs alimentent OK/NOK, DLC secondaires et rappels.
        </p>
      </div>
      <AccesDashboardForm />

      <section className="rounded-3xl border border-slate-200 bg-white p-5">
        <h2 className="font-serif text-xl font-semibold">Relevés matin et soir</h2>
        <p className="mt-1 text-sm text-slate-500">
          Décoche les jours où l’établissement est fermé. Ex. lundi et mardi soir : pas de relevé du soir,
          pas de retard.
        </p>
        {heureMatin ? (
          <label className="mt-4 block max-w-xs text-sm">
            Heure limite matin
            <input
              className="mt-1 h-11 w-full rounded-xl border border-slate-200 px-3"
              value={drafts[heureMatin.id] ?? ""}
              onChange={(e) => setDrafts((d) => ({ ...d, [heureMatin.id]: e.target.value }))}
            />
            <Button className="mt-2" variant="light" size="sm" onClick={() => void save(heureMatin.id)}>
              Enregistrer l’heure
            </Button>
          </label>
        ) : null}
        <JoursBloc
          titre="Jours du relevé du matin"
          valeur={matin?.valeur}
          onSave={(jours) => void saveJours(PARAM_KEYS.RELEVE_MATIN_JOURS, jours)}
        />
        {heureSoir ? (
          <label className="mt-6 block max-w-xs text-sm">
            Heure limite soir
            <input
              className="mt-1 h-11 w-full rounded-xl border border-slate-200 px-3"
              value={drafts[heureSoir.id] ?? ""}
              onChange={(e) => setDrafts((d) => ({ ...d, [heureSoir.id]: e.target.value }))}
            />
            <Button className="mt-2" variant="light" size="sm" onClick={() => void save(heureSoir.id)}>
              Enregistrer l’heure
            </Button>
          </label>
        ) : null}
        <JoursBloc
          titre="Jours du relevé du soir"
          valeur={soir?.valeur}
          onSave={(jours) => void saveJours(PARAM_KEYS.RELEVE_SOIR_JOURS, jours)}
        />
        {joursOk ? <p className="mt-3 text-sm text-emerald-700">{joursOk}</p> : null}
      </section>

      <div className="overflow-hidden rounded-3xl bg-white shadow-sm">
        {params
          .filter((p) => !caches.has(p.cle))
          .map((p) => (
            <div key={p.id} className="flex flex-col gap-2 border-b border-slate-100 px-5 py-4 sm:flex-row sm:items-center">
              <p className="flex-1 font-mono text-sm text-slate-600">{p.cle}</p>
              <input
                className="h-11 rounded-xl border border-slate-200 px-3"
                value={drafts[p.id] ?? ""}
                onChange={(e) => setDrafts((d) => ({ ...d, [p.id]: e.target.value }))}
              />
              <Button variant="light" size="sm" onClick={() => void save(p.id)}>
                Enregistrer
              </Button>
            </div>
          ))}
      </div>
    </div>
  );
}

function JoursBloc({
  titre,
  valeur,
  onSave,
}: {
  titre: string;
  valeur?: string;
  onSave: (jours: number[]) => void;
}) {
  const [jours, setJours] = useState<number[]>(parseJoursReleve(valeur));

  useEffect(() => {
    setJours(parseJoursReleve(valeur));
  }, [valeur]);

  function toggle(n: number) {
    setJours((prev) => (prev.includes(n) ? prev.filter((x) => x !== n) : [...prev, n]));
  }

  return (
    <div className="mt-4">
      <p className="text-sm font-medium text-slate-800">{titre}</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {JOURS_SEMAINE.map((j) => {
          const on = jours.includes(j.n);
          return (
            <button
              key={j.n}
              type="button"
              onClick={() => toggle(j.n)}
              className={`rounded-full border px-3 py-1.5 text-sm ${
                on ? "border-teal-600 bg-teal-50 font-semibold text-teal-900" : "border-slate-200 text-slate-500"
              }`}
            >
              {j.label}
            </button>
          );
        })}
      </div>
      <Button className="mt-3" variant="light" size="sm" onClick={() => onSave(jours)}>
        Enregistrer ces jours
      </Button>
    </div>
  );
}
