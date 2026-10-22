"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { ChecklistsOuvertureFermeture } from "@/components/terrain/checklists-ouverture-fermeture";
import { useTerrain } from "@/components/terrain/terrain-provider";

function ChecklistInner() {
  const { session } = useTerrain();
  const params = useSearchParams();

  return (
    <div className="space-y-5 pb-10">
      <div>
        <h1 className="font-serif text-2xl font-semibold text-slate-900">Check-lists</h1>
        <p className="mt-1 text-sm text-slate-500">
          Ouverture et fermeture du service, signées par {session.prenom}. Chaque employé coche et
          signe les siennes.
        </p>
      </div>
      <ChecklistsOuvertureFermeture highlightId={params.get("checklist")} />
    </div>
  );
}

export default function ChecklistPage() {
  return (
    <Suspense fallback={<p className="text-slate-500">Chargement des check-lists…</p>}>
      <ChecklistInner />
    </Suspense>
  );
}
