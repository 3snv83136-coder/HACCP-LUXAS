"use client";

import { nanoid } from "nanoid";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useTerrain } from "@/components/terrain/terrain-provider";
import { enqueueGeneric } from "@/lib/offline/sync";
import { startOfDay } from "@/lib/utils";

export function ChecklistsOuvertureFermeture({ highlightId }: { highlightId?: string | null }) {
  const { bootstrap, session, refresh } = useTerrain();
  const today = startOfDay().getTime();
  const [checks, setChecks] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState<string | null>(null);

  const listes = bootstrap.checklists
    .filter((cl) => cl.type === "ouverture" || cl.type === "fermeture")
    .sort((a, b) => (a.type === "ouverture" ? -1 : b.type === "ouverture" ? 1 : 0));

  async function signer(checklistId: string, itemIds: string[]) {
    setSaving(checklistId);
    const clientUuid = nanoid();
    await enqueueGeneric("checklist_execution", clientUuid, {
      clientUuid,
      etablissementId: session.etablissementId,
      codeOperateurId: session.codeOperateurId,
      checklistId,
      items: itemIds.filter((id) => checks[id]),
    });
    bootstrap.checklistExecutions.push({
      checklistId,
      createdAt: new Date().toISOString(),
      codeOperateurId: session.codeOperateurId,
    });
    await refresh();
    setSaving(null);
  }

  if (listes.length === 0) {
    return (
      <p className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-5 text-sm text-slate-500">
        Aucune check-list d’ouverture ou de fermeture pour cet établissement.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {listes.map((cl) => {
        const done = bootstrap.checklistExecutions.some(
          (e) =>
            e.checklistId === cl.id &&
            new Date(e.createdAt).getTime() >= today &&
            (!e.codeOperateurId || e.codeOperateurId === session.codeOperateurId),
        );
        const allChecked = cl.items.every((i) => checks[i.id]);
        const highlight = highlightId === cl.id;
        return (
          <div
            key={cl.id}
            id={cl.id}
            className={`rounded-3xl border-2 bg-white p-4 shadow-sm ${
              highlight
                ? "border-teal-500"
                : cl.type === "ouverture"
                  ? "border-teal-400"
                  : "border-slate-800"
            }`}
          >
            <div className="flex items-center justify-between gap-3">
              <h2 className="font-serif text-lg font-semibold text-slate-900">{cl.nom}</h2>
              <Badge variant={done ? "ok" : cl.type === "ouverture" ? "info" : "default"}>
                {cl.type === "ouverture" ? "Ouverture" : "Fermeture"}
              </Badge>
            </div>
            <p className="mt-1 text-xs text-slate-500">
              Signature individuelle de {session.prenom} {session.nom}
            </p>
            <ul className="mt-3 space-y-2">
              {cl.items.map((item) => (
                <li key={item.id}>
                  <label className="flex min-h-11 items-center gap-3 text-sm text-slate-700">
                    <input
                      type="checkbox"
                      checked={Boolean(checks[item.id]) || done}
                      disabled={done}
                      onChange={(e) => setChecks((c) => ({ ...c, [item.id]: e.target.checked }))}
                      className="h-5 w-5 accent-teal-700"
                    />
                    {item.libelle}
                  </label>
                </li>
              ))}
            </ul>
            {!done ? (
              <Button
                className="mt-4 w-full"
                disabled={!allChecked || saving === cl.id}
                onClick={() => void signer(cl.id, cl.items.map((i) => i.id))}
              >
                {saving === cl.id ? "Enregistrement…" : `Signer · ${session.prenom}`}
              </Button>
            ) : (
              <p className="mt-3 text-sm text-emerald-700">Signée aujourd’hui par {session.prenom}</p>
            )}
          </div>
        );
      })}
    </div>
  );
}
