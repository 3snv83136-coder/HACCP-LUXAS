"use client";

import { useMemo, useState } from "react";
import { nanoid } from "nanoid";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useTerrain } from "@/components/terrain/terrain-provider";
import { dlcSecondaire } from "@/lib/conformity";
import { enqueueGeneric } from "@/lib/offline/sync";

type Kind = "decongelation" | "ouverture" | "fabrication";

export default function EtiquettePage() {
  const { session, bootstrap } = useTerrain();
  const [kind, setKind] = useState<Kind>("ouverture");
  const [produit, setProduit] = useState("");
  const [lot, setLot] = useState("");
  const [preview, setPreview] = useState<{
    qr: string;
    dlc: Date;
    produit: string;
    kind: Kind;
  } | null>(null);
  const [qrUrl, setQrUrl] = useState<string | null>(null);

  const debut = useMemo(() => new Date(), []);

  async function generer() {
    const dlc = dlcSecondaire(kind, debut, bootstrap.params);
    const qr = nanoid(10);
    await enqueueGeneric("lot_produit", qr, {
      etablissementId: session.etablissementId,
      type: kind,
      produit,
      lotSource: lot || null,
      dateDebut: debut.toISOString(),
      dlcSecondaire: dlc.toISOString(),
      qrToken: qr,
      createdBy: session.codeOperateurId,
    });
    const url = await import("qrcode").then((m) =>
      m.toDataURL(`sanitrace:lot:${qr}`, { margin: 1, width: 280 }),
    );
    setQrUrl(url);
    setPreview({ qr, dlc, produit, kind });
  }

  return (
    <div className="space-y-4 pb-10">
      <h1 className="text-2xl font-semibold text-white">Étiquette DLC secondaire</h1>
      <div className="grid grid-cols-3 gap-2">
        {(
          [
            ["decongelation", "Décongél."],
            ["ouverture", "Ouverture"],
            ["fabrication", "Maison"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setKind(id)}
            className={`rounded-2xl border py-3 text-xs font-semibold ${
              kind === id ? "border-teal-400 bg-teal-400/10 text-white" : "border-white/10 text-white/50"
            }`}
          >
            {label}
          </button>
        ))}
      </div>
      <label className="block space-y-2">
        <Label>Produit</Label>
        <Input value={produit} onChange={(e) => setProduit(e.target.value)} required />
      </label>
      <label className="block space-y-2">
        <Label>Lot source</Label>
        <Input value={lot} onChange={(e) => setLot(e.target.value)} />
      </label>
      <Button className="w-full" size="lg" disabled={!produit} onClick={() => void generer()}>
        Générer l’étiquette
      </Button>

      {preview && qrUrl ? (
        <div className="rounded-3xl border border-white/10 bg-white p-5 text-center text-slate-900">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={qrUrl} alt={`QR étiquette ${preview.produit}`} className="mx-auto h-40 w-40" />
          <p className="mt-2 text-lg font-bold">{preview.produit}</p>
          <p className="text-sm uppercase tracking-wide">{preview.kind}</p>
          <p className="mt-2 font-mono text-sm">
            DLC sec. {preview.dlc.toLocaleString("fr-FR")}
          </p>
          <p className="text-xs text-slate-500">{preview.qr}</p>
        </div>
      ) : null}
    </div>
  );
}
