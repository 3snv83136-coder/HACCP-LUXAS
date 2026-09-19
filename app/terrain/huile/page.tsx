"use client";

import { useState } from "react";
import { nanoid } from "nanoid";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { NumericPad } from "@/components/terrain/numeric-pad";
import { useTerrain } from "@/components/terrain/terrain-provider";
import { isHuileConforme } from "@/lib/conformity";
import { enqueueGeneric } from "@/lib/offline/sync";

export default function HuilePage() {
  const { bootstrap, session, refresh } = useTerrain();
  const [huileId, setHuileId] = useState(bootstrap.huiles[0]?.id ?? "");
  const [raw, setRaw] = useState("");
  const [saving, setSaving] = useState(false);
  const valeur = raw === "" ? null : Number(raw.replace(",", "."));
  const horsSeuil = valeur != null && Number.isFinite(valeur) ? !isHuileConforme(valeur, bootstrap.params) : null;

  async function save(action: "ok" | "vidange") {
    if (valeur == null || !huileId) return;
    setSaving(true);
    const clientUuid = nanoid();
    await enqueueGeneric("releve_huile", clientUuid, {
      clientUuid,
      etablissementId: session.etablissementId,
      codeOperateurId: session.codeOperateurId,
      huileId,
      composesPolaires: valeur,
      action: horsSeuil ? "vidange" : action,
      horsSeuil,
    });
    await refresh();
    setRaw("");
    setSaving(false);
  }

  return (
    <div className="space-y-4 pb-10">
      <h1 className="text-2xl font-semibold text-white">Huiles de friture</h1>
      <p className="text-sm text-white/55">Contrôle visuel + % composés polaires. Seuil issu du PMS.</p>
      <div className="grid gap-2">
        {bootstrap.huiles.map((h) => (
          <button
            key={h.id}
            type="button"
            onClick={() => setHuileId(h.id)}
            className={`rounded-2xl border px-4 py-3 text-left ${
              huileId === h.id ? "border-teal-400 bg-teal-400/10" : "border-white/10"
            }`}
          >
            <p className="font-medium text-white">{h.bac}</p>
            <p className="text-xs text-white/45">
              {h.dernierPolaires != null ? `Dernier : ${h.dernierPolaires} %` : "Pas encore de relevé"}
            </p>
          </button>
        ))}
      </div>
      <div className="rounded-3xl border border-white/10 p-5 text-center">
        <p className="font-mono text-5xl text-white">{raw || "—"} %</p>
        {horsSeuil != null ? (
          <div className="mt-2">
            <Badge variant={horsSeuil ? "nok" : "ok"}>{horsSeuil ? "NOK — vidange" : "OK"}</Badge>
          </div>
        ) : null}
      </div>
      <NumericPad value={raw} onChange={setRaw} allowNegative={false} />
      <Button
        className="w-full"
        size="lg"
        disabled={horsSeuil == null || saving}
        variant={horsSeuil ? "danger" : "default"}
        onClick={() => void save(horsSeuil ? "vidange" : "ok")}
      >
        {horsSeuil ? "Signer la vidange" : "Signer le contrôle"}
      </Button>
    </div>
  );
}
