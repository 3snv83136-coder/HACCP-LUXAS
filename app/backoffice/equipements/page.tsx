"use client";

import { useEffect, useState } from "react";

type Equipement = {
  id: string;
  nom: string;
  type: string;
  qrToken: string;
  seuilMin: number | null;
  seuilMax: number | null;
  qrDataUrl: string;
};

export default function EquipementsPage() {
  const [equipements, setEquipements] = useState<Equipement[]>([]);

  useEffect(() => {
    void fetch("/api/equipements")
      .then((r) => r.json())
      .then((d: { equipements: Equipement[] }) => setEquipements(d.equipements));
  }, []);

  return (
    <div className="space-y-5 pb-16">
      <div>
        <h1 className="text-3xl font-semibold">Équipements & QR</h1>
        <p className="text-slate-500">Imprime et colle le QR sur chaque enceinte. Scan = relevé pré-rempli.</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {equipements.map((eq) => (
          <article key={eq.id} className="rounded-3xl bg-white p-5 shadow-sm print:break-inside-avoid">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={eq.qrDataUrl} alt={`QR ${eq.nom}`} className="mx-auto h-44 w-44" />
            <h2 className="mt-3 text-lg font-semibold">{eq.nom}</h2>
            <p className="text-sm text-slate-500">
              {eq.type.replaceAll("_", " ")} · max {eq.seuilMax ?? "—"} °C
            </p>
            <p className="mt-1 font-mono text-xs text-slate-400">{eq.qrToken}</p>
          </article>
        ))}
      </div>
    </div>
  );
}
