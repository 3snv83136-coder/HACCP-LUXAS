"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

type Parametre = { id: string; cle: string; valeur: string };

export default function ParametresPage() {
  const [params, setParams] = useState<Parametre[]>([]);
  const [drafts, setDrafts] = useState<Record<string, string>>({});

  useEffect(() => {
    void fetch("/api/parametres")
      .then((r) => r.json())
      .then((d: { params: Parametre[] }) => {
        setParams(d.params);
        setDrafts(Object.fromEntries(d.params.map((p) => [p.id, p.valeur])));
      });
  }, []);

  async function save(id: string) {
    await fetch("/api/parametres", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, valeur: drafts[id] }),
    });
  }

  return (
    <div className="space-y-5 pb-16">
      <div>
        <h1 className="text-3xl font-semibold">Seuils & paramètres PMS</h1>
        <p className="max-w-2xl text-slate-500">
          Rien n’est codé en dur. Ces valeurs alimentent OK/NOK, DLC secondaires et rappels.
        </p>
      </div>
      <div className="overflow-hidden rounded-3xl bg-white shadow-sm">
        {params.map((p) => (
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
