"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

type Job = {
  id: string;
  produit: string;
  lot: string | null;
  dlc: string | null;
  type: string;
  photoUrl: string | null;
  statut: string;
};

export default function StationImpressionPage() {
  const [items, setItems] = useState<Job[]>([]);
  const [courant, setCourant] = useState<Job | null>(null);

  async function load() {
    const res = await fetch("/api/impressions?statut=attente");
    const data = (await res.json()) as { items?: Job[] };
    setItems(data.items ?? []);
  }

  useEffect(() => {
    void load();
    const id = window.setInterval(() => void load(), 4000);
    return () => window.clearInterval(id);
  }, []);

  async function imprimer(job: Job) {
    setCourant(job);
    window.setTimeout(() => window.print(), 200);
    await fetch("/api/impressions", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: job.id, statut: "imprime" }),
    });
    await load();
  }

  return (
    <main className="etiquette-print-root mx-auto min-h-dvh max-w-3xl px-4 py-8">
      <div className="no-print space-y-4">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-teal-700">Station</p>
        <h1 className="font-serif text-3xl font-semibold">Imprimante d’étiquettes</h1>
        <p className="text-slate-500">
          Laisse cette page ouverte sur l’appareil branché à l’imprimante. Les étiquettes envoyées
          depuis n’importe quel téléphone apparaissent ici.
        </p>
        {items.length === 0 ? (
          <p className="rounded-3xl bg-slate-50 p-6 text-slate-500">File vide — en attente.</p>
        ) : (
          items.map((job) => (
            <article key={job.id} className="flex items-center justify-between gap-3 rounded-3xl border border-slate-200 bg-white p-4">
              <div>
                <p className="font-semibold">{job.produit}</p>
                <p className="text-sm text-slate-500">
                  {job.type}
                  {job.dlc ? ` · ${job.dlc}` : ""}
                </p>
              </div>
              <Button onClick={() => void imprimer(job)}>Imprimer</Button>
            </article>
          ))
        )}
      </div>
      {courant ? (
        <div className="etiquette-ticket mx-auto hidden h-[40mm] w-[58mm] overflow-hidden border border-slate-900 bg-white p-1 print:block">
          {courant.photoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={courant.photoUrl} alt="" className="h-12 w-full object-cover" />
          ) : null}
          <p className="mt-1 text-[10px] font-bold">{courant.produit}</p>
          <p className="text-[8px] uppercase">{courant.type}</p>
          <p className="font-mono text-[8px]">
            {courant.lot ? `Lot ${courant.lot}` : ""} {courant.dlc ?? ""}
          </p>
        </div>
      ) : null}
    </main>
  );
}
