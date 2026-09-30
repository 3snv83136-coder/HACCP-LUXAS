"use client";

import { useState } from "react";
import { nanoid } from "nanoid";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useTerrain } from "@/components/terrain/terrain-provider";
import { enqueueGeneric } from "@/lib/offline/sync";
import { libelleEtatHuile, type EtatHuile } from "@/lib/huile-etat";

export default function HuilePage() {
  const { bootstrap, session, refresh } = useTerrain();
  const [huileId, setHuileId] = useState(bootstrap.huiles[0]?.id ?? "");
  const [saving, setSaving] = useState(false);
  const [fait, setFait] = useState<EtatHuile | null>(null);

  async function save(etat: EtatHuile) {
    if (!huileId) return;
    setSaving(true);
    const clientUuid = nanoid();
    await enqueueGeneric("releve_huile", clientUuid, {
      clientUuid,
      etablissementId: session.etablissementId,
      codeOperateurId: session.codeOperateurId,
      huileId,
      composesPolaires: etat === "a_changer" ? 100 : 0,
      action: etat,
      horsSeuil: etat === "a_changer",
    });
    await refresh();
    setFait(etat);
    setSaving(false);
  }

  return (
    <div className="space-y-4 pb-10">
      <h1 className="text-2xl font-semibold text-slate-900">Huiles de friture</h1>
      <p className="text-sm text-slate-500">Contrôle visuel : l’huile est-elle encore bonne, ou à changer ?</p>
      <div className="grid gap-2">
        {bootstrap.huiles.map((h) => (
          <button
            key={h.id}
            type="button"
            onClick={() => {
              setHuileId(h.id);
              setFait(null);
            }}
            className={`rounded-2xl border px-4 py-3 text-left ${
              huileId === h.id ? "border-teal-500 bg-teal-50" : "border-slate-200"
            }`}
          >
            <p className="font-medium text-slate-900">{h.bac}</p>
            <p className="text-xs text-slate-500">{libelleEtatHuile(h.dernierAction, h.dernierPolaires)}</p>
          </button>
        ))}
      </div>

      {bootstrap.huiles.length === 0 ? (
        <p className="rounded-3xl bg-slate-50 p-5 text-sm text-slate-500">Aucune friteuse paramétrée.</p>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          <Button
            size="lg"
            className="h-24 w-full text-base"
            disabled={!huileId || saving}
            onClick={() => void save("bonne")}
          >
            Bonne
          </Button>
          <Button
            size="lg"
            variant="danger"
            className="h-24 w-full text-base"
            disabled={!huileId || saving}
            onClick={() => void save("a_changer")}
          >
            À changer
          </Button>
        </div>
      )}

      {fait ? (
        <div className="text-center">
          <Badge variant={fait === "bonne" ? "ok" : "nok"}>
            {fait === "bonne" ? "Huile bonne — signé" : "Huile à changer — signé"}
          </Badge>
        </div>
      ) : null}
    </div>
  );
}
