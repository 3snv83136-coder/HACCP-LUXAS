"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { BackArrow } from "@/components/navigation/back-arrow";
import { EtiquetteApercu } from "@/components/etiquettes/etiquette-apercu";
import { codeEtiquette } from "@/lib/etiquette-code";

type Job = {
  id: string;
  produit: string;
  lot: string | null;
  type: string;
  statut: string;
  createdAt?: string;
};

export function StationImpressionClient() {
  const search = useSearchParams();
  const autoId = search.get("auto");
  const [items, setItems] = useState<Job[]>([]);
  const [courant, setCourant] = useState<Job | null>(null);
  const [connecte, setConnecte] = useState(false);

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

  useEffect(() => {
    if (!autoId) return;
    void (async () => {
      const res = await fetch(`/api/impressions?id=${encodeURIComponent(autoId)}`);
      const data = (await res.json()) as { item?: Job | null };
      if (data.item) {
        setCourant(data.item);
        window.setTimeout(() => window.print(), 400);
        await fetch("/api/impressions", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: data.item.id, statut: "imprime" }),
        });
        await load();
      }
    })();
  }, [autoId]);

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

  function connecterImprimante() {
    setCourant({
      id: "test",
      produit: "Test imprimante",
      lot: "TEST",
      type: "ouverture",
      statut: "attente",
      createdAt: new Date().toISOString(),
    });
    setConnecte(true);
    window.setTimeout(() => window.print(), 250);
  }

  return (
    <main className="etiquette-print-root mx-auto min-h-dvh w-full max-w-3xl px-4 py-6 sm:py-8">
      <div className="no-print space-y-4">
        <BackArrow />
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-teal-700">Station</p>
        <h1 className="font-serif text-3xl font-semibold">Imprimante d’étiquettes</h1>
        <p className="text-slate-500">
          Branche ou associe l’imprimante (Bluetooth, Wi-Fi ou USB) via l’application du fabricant,
          puis choisis-la dans la fenêtre d’impression. L’étiquette s’imprime ensuite toute seule.
        </p>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button onClick={connecterImprimante}>Connecter l’imprimante</Button>
          {connecte ? (
            <p className="self-center text-sm text-emerald-700">Fenêtre d’impression ouverte — choisis l’imprimante.</p>
          ) : null}
        </div>
        {items.length === 0 ? (
          <p className="rounded-3xl bg-slate-50 p-6 text-slate-500">File vide — en attente.</p>
        ) : (
          items.map((job) => (
            <article key={job.id} className="flex flex-col gap-3 rounded-3xl border border-slate-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-semibold">{job.produit}</p>
                <p className="text-sm text-slate-500">
                  {job.type}
                  {job.lot ? ` · ${job.lot}` : ""}
                </p>
              </div>
              <Button onClick={() => void imprimer(job)}>Imprimer maintenant</Button>
            </article>
          ))
        )}
      </div>
      {courant ? (
        <div className="mt-8 flex justify-center print:mt-0">
          <EtiquetteApercu
            produit={courant.produit}
            lot={courant.lot}
            type={courant.type}
            createdAt={courant.createdAt}
            code={codeEtiquette(courant.id, courant.lot)}
          />
        </div>
      ) : null}
    </main>
  );
}
