"use client";

import Link from "next/link";
import { nanoid } from "nanoid";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { ClipboardCheck } from "lucide-react";
import { useTerrain } from "@/components/terrain/terrain-provider";
import { enqueueGeneric } from "@/lib/offline/sync";
import { startOfDay } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { isCreneauEnRetard, creneauCourant } from "@/lib/conformity";

function MenageInner() {
  const { bootstrap, session, refresh } = useTerrain();
  const params = useSearchParams();
  const today = startOfDay().getTime();
  const week = today - 6 * 24 * 3600 * 1000;
  const retard = isCreneauEnRetard(creneauCourant(bootstrap.params), bootstrap.params);

  async function cocher(tacheId: string) {
    const clientUuid = nanoid();
    await enqueueGeneric("execution_nettoyage", clientUuid, {
      clientUuid,
      tacheNettoyageId: tacheId,
      etablissementId: session.etablissementId,
      codeOperateurId: session.codeOperateurId,
      faitAt: new Date().toISOString(),
    });
    bootstrap.executionsNettoyage.push({
      tacheNettoyageId: tacheId,
      faitAt: new Date().toISOString(),
    });
    await refresh();
  }

  return (
    <div className="space-y-6 pb-10">
      <div>
        <h1 className="font-serif text-2xl font-semibold text-slate-900">Plan de nettoyage</h1>
        <p className="text-sm text-slate-500">
          Surfaces du jour à cocher et signer par {session.prenom}.
          {retard ? " Des tâches sont en retard." : ""}
        </p>
      </div>

      <Link
        href="/terrain/checklist"
        className="flex items-center gap-3 rounded-3xl border border-teal-200 bg-teal-50 p-4"
      >
        <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white text-teal-800">
          <ClipboardCheck className="h-5 w-5" />
        </span>
        <span>
          <span className="block font-semibold text-slate-900">Check-lists ouverture / fermeture</span>
          <span className="text-sm text-slate-500">Signature individuelle de {session.prenom}</span>
        </span>
      </Link>

      {bootstrap.tachesNettoyage.map((tache) => {
        const windowStart = tache.frequence === "hebdo" || tache.frequence === "mensuel" ? week : today;
        const done = bootstrap.executionsNettoyage.some(
          (e) => e.tacheNettoyageId === tache.id && new Date(e.faitAt).getTime() >= windowStart,
        );
        const highlight = params.get("tache") === tache.id;
        return (
          <div
            key={tache.id}
            id={tache.id}
            className={`rounded-3xl border bg-white p-4 shadow-sm ${
              highlight ? "border-teal-500" : "border-slate-200"
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-semibold text-slate-900">{tache.zone}</p>
                <p className="mt-1 text-xs text-slate-500">
                  {tache.frequence} · {tache.produitNom ?? "sans produit"}
                  {tache.produitDosage ? ` ${tache.produitDosage}` : ""} · {tache.roleResponsable}
                </p>
              </div>
              <Badge variant={done ? "ok" : retard ? "warn" : "info"}>{done ? "Fait" : "À faire"}</Badge>
            </div>
            <p className="mt-3 text-sm text-slate-600">{tache.methodeTact}</p>
            {tache.produitDangers ? (
              <p className="mt-2 text-xs text-amber-700">FDS / dangers : {tache.produitDangers}</p>
            ) : null}
            {!done ? (
              <Button className="mt-4 w-full" onClick={() => void cocher(tache.id)}>
                Cocher et signer · {session.prenom}
              </Button>
            ) : null}
          </div>
        );
      })}

      {bootstrap.checklists
        .filter((cl) => cl.type !== "ouverture" && cl.type !== "fermeture")
        .map((cl) => {
          const done = bootstrap.checklistExecutions.some(
            (e) =>
              e.checklistId === cl.id &&
              new Date(e.createdAt).getTime() >= today &&
              (!e.codeOperateurId || e.codeOperateurId === session.codeOperateurId),
          );
          return (
            <div key={cl.id} className="rounded-3xl border border-slate-200 bg-white p-4">
              <h2 className="font-semibold">{cl.nom}</h2>
              <Badge variant={done ? "ok" : "info"}>{cl.type}</Badge>
            </div>
          );
        })}
    </div>
  );
}

export default function MenagePage() {
  return (
    <Suspense fallback={<p className="text-slate-500">Chargement du plan de nettoyage…</p>}>
      <MenageInner />
    </Suspense>
  );
}
