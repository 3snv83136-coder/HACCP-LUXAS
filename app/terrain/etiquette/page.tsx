"use client";

import { useMemo, useState } from "react";
import { nanoid } from "nanoid";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useTerrain } from "@/components/terrain/terrain-provider";
import { enqueueGeneric } from "@/lib/offline/sync";
import { EtiquetteApercu } from "@/components/etiquettes/etiquette-apercu";
import { codeEtiquette } from "@/lib/etiquette-code";

type Kind = "decongelation" | "ouverture" | "fabrication";

export default function EtiquettePage() {
  const { session } = useTerrain();
  const [kind, setKind] = useState<Kind>("ouverture");
  const [produit, setProduit] = useState("");
  const [lot, setLot] = useState("");
  const [preview, setPreview] = useState<{
    qr: string;
    produit: string;
    kind: Kind;
    lot: string;
  } | null>(null);

  const debut = useMemo(() => new Date(), []);

  async function generer() {
    const qr = nanoid(10);
    await enqueueGeneric("lot_produit", qr, {
      etablissementId: session.etablissementId,
      type: kind,
      produit,
      lotSource: lot || null,
      dateDebut: debut.toISOString(),
      qrToken: qr,
      createdBy: session.codeOperateurId,
    });
    setPreview({ qr, produit, kind, lot });
  }

  function imprimer() {
    window.setTimeout(() => window.print(), 150);
  }

  return (
    <div className="etiquette-print-root space-y-4 pb-10">
      <div className="no-print space-y-4">
        <h1 className="text-2xl font-semibold text-slate-900">Étiquette</h1>
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
                kind === id ? "border-teal-500 bg-teal-50 text-slate-900" : "border-slate-200 text-slate-500"
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
        {produit ? (
          <div>
            <p className="mb-2 text-xs font-medium uppercase tracking-[0.16em] text-slate-500">
              Aperçu avant impression
            </p>
            <EtiquetteApercu
              produit={produit}
              lot={lot || null}
              type={kind}
              createdAt={debut.toISOString()}
              code={codeEtiquette("APERCU", lot)}
            />
          </div>
        ) : null}
        <Button className="w-full" size="lg" disabled={!produit} onClick={() => void generer()}>
          Générer l’étiquette
        </Button>
      </div>

      {preview ? (
        <div className="space-y-3">
          <EtiquetteApercu
            produit={preview.produit}
            lot={preview.lot || null}
            type={preview.kind}
            createdAt={debut.toISOString()}
            code={codeEtiquette(preview.qr, preview.lot)}
          />
          <div className="no-print grid gap-2">
            <Button className="w-full" variant="outline" onClick={imprimer}>
              Connecter l’imprimante et imprimer
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
