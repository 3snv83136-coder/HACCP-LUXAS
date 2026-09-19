"use client";

import { useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { nanoid } from "nanoid";
import { NumericPad } from "@/components/terrain/numeric-pad";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useTerrain } from "@/components/terrain/terrain-provider";
import { isTemperatureConforme } from "@/lib/conformity";
import { enqueueReleve } from "@/lib/offline/sync";
import { formatHeure, formatTemp } from "@/lib/utils";

export default function RelevePage() {
  const params = useParams<{ qr: string }>();
  const router = useRouter();
  const { bootstrap, session, releves, refresh } = useTerrain();
  const [raw, setRaw] = useState("");
  const [methode, setMethode] = useState("sonde_manuelle");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState<{ conforme: boolean; valeur: number } | null>(null);

  const qr = decodeURIComponent(params.qr);
  const processId = qr.startsWith("process-") ? qr.slice("process-".length) : null;

  const equipement = bootstrap.equipements.find((e) => e.qrToken === qr) ?? null;
  const point = processId
    ? bootstrap.pointsControle.find((p) => p.id === processId) ?? null
    : null;

  const cible = useMemo(() => {
    if (equipement) {
      return {
        nom: equipement.nom,
        type: equipement.type,
        seuilMin: equipement.seuilMin,
        seuilMax: equipement.seuilMax,
        equipementId: equipement.id,
        pointControleId: null as string | null,
      };
    }
    if (point) {
      return {
        nom: point.libelle,
        type: point.type,
        seuilMin: point.seuilMin,
        seuilMax: point.seuilMax,
        equipementId: null as string | null,
        pointControleId: point.id,
      };
    }
    return null;
  }, [equipement, point]);

  const last = useMemo(() => {
    if (!cible) return null;
    return releves.find(
      (r) =>
        (cible.equipementId && r.equipementId === cible.equipementId) ||
        (cible.pointControleId && r.pointControleId === cible.pointControleId),
    );
  }, [cible, releves]);

  const valeur = raw === "" || raw === "-" || raw === "." || raw === "-." ? null : Number(raw.replace(",", "."));
  const preview =
    valeur != null && Number.isFinite(valeur) && cible
      ? isTemperatureConforme(valeur, { seuilMin: cible.seuilMin, seuilMax: cible.seuilMax })
      : null;

  async function save() {
    if (!cible || valeur == null || !Number.isFinite(valeur) || preview == null) return;
    setSaving(true);
    await enqueueReleve({
      session,
      clientUuid: nanoid(),
      equipementId: cible.equipementId,
      pointControleId: cible.pointControleId,
      valeur,
      conforme: preview,
      methode,
      note: note || null,
    });
    setDone({ conforme: preview, valeur });
    await refresh();
    setSaving(false);
  }

  if (!cible) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-semibold text-white">QR inconnu</h1>
        <p className="text-white/60">Aucun équipement pour « {qr} ».</p>
        <Button variant="outline" onClick={() => router.push("/terrain/scan")}>
          Retour au scan
        </Button>
      </div>
    );
  }

  if (done) {
    return (
      <div className="flex min-h-[70dvh] flex-col items-center justify-center text-center">
        <Badge variant={done.conforme ? "ok" : "nok"} className="px-4 py-2 text-sm">
          {done.conforme ? "Conforme" : "Non conforme"}
        </Badge>
        <p className="mt-4 font-mono text-6xl text-white">{formatTemp(done.valeur)}</p>
        <p className="mt-3 text-white/60">
          Signé {session.prenom} {session.nom}
          {!done.conforme ? " · non-conformité ouverte" : ""}
        </p>
        <Button className="mt-8" size="lg" onClick={() => router.push("/terrain")}>
          Retour aux tâches
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-5 pb-10">
      <div>
        <p className="text-xs uppercase tracking-[0.16em] text-teal-300">{cible.type.replaceAll("_", " ")}</p>
        <h1 className="mt-1 text-2xl font-semibold text-white">{cible.nom}</h1>
        <p className="mt-1 text-sm text-white/50">
          Seuil PMS : {cible.seuilMin != null ? `≥ ${cible.seuilMin} °C` : ""}
          {cible.seuilMin != null && cible.seuilMax != null ? " · " : ""}
          {cible.seuilMax != null ? `≤ ${cible.seuilMax} °C` : ""}
        </p>
        {last ? (
          <p className="mt-1 text-sm text-white/40">
            Dernier : {formatTemp(last.valeur)} · {formatHeure(last.createdAt)} · {last.auteurNom}
          </p>
        ) : null}
      </div>

      <div
        className={`rounded-3xl border p-5 text-center ${
          preview == null
            ? "border-white/10 bg-white/[0.03]"
            : preview
              ? "border-emerald-400/40 bg-emerald-500/10"
              : "border-red-400/40 bg-red-500/10"
        }`}
      >
        <p className="font-mono text-6xl tracking-tight text-white">{raw || "—"}</p>
        <p className="mt-2 text-sm text-white/50">°C</p>
        {preview != null ? (
          <div className="mt-3">
            <Badge variant={preview ? "ok" : "nok"}>{preview ? "OK" : "NOK — NC auto"}</Badge>
          </div>
        ) : null}
      </div>

      <NumericPad value={raw} onChange={setRaw} />

      <div className="grid grid-cols-2 gap-2">
        {[
          { id: "sonde_manuelle", label: "Sonde manuelle" },
          { id: "thermo_equipement", label: "Afficheur" },
        ].map((m) => (
          <button
            key={m.id}
            type="button"
            onClick={() => setMethode(m.id)}
            className={`rounded-2xl border px-3 py-3 text-sm ${
              methode === m.id ? "border-teal-400 bg-teal-400/10 text-white" : "border-white/10 text-white/60"
            }`}
          >
            {m.label}
          </button>
        ))}
      </div>

      <input
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="Note (optionnel)"
        className="h-12 w-full rounded-2xl border border-white/10 bg-black/30 px-4 text-white placeholder:text-white/30"
      />

      <Button
        size="xl"
        className="w-full"
        disabled={preview == null || saving}
        variant={preview === false ? "danger" : "default"}
        onClick={() => void save()}
      >
        {saving
          ? "Enregistrement…"
          : `Signer · ${session.prenom} ${preview === false ? "(NOK)" : ""}`}
      </Button>
    </div>
  );
}
