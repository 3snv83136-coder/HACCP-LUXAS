"use client";

import { useEffect, useState } from "react";
import { PhotoCapture } from "@/components/terrain/photo-capture";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function TerrainTracabilitePage() {
  const [photo, setPhoto] = useState<string | null>(null);
  const [produit, setProduit] = useState("");
  const [lot, setLot] = useState("");
  const [dlc, setDlc] = useState("");
  const [ok, setOk] = useState(false);

  async function envoyer() {
    await fetch("/api/etiquettes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        produit,
        lot,
        dlc,
        type: "ouverture",
        photoUrl: photo,
        imprimer: true,
      }),
    });
    setOk(true);
    setProduit("");
    setLot("");
    setDlc("");
    setPhoto(null);
  }

  useEffect(() => {
    if (!ok) return;
    const t = window.setTimeout(() => setOk(false), 2500);
    return () => window.clearTimeout(t);
  }, [ok]);

  return (
    <div className="space-y-4 pb-10">
      <h1 className="font-serif text-2xl font-semibold text-slate-900">Traçabilité étiquette</h1>
      <p className="text-sm text-slate-500">
        Photo de l’étiquette, format imprimante, envoi à la station d’impression.
      </p>
      <PhotoCapture value={photo} onChange={setPhoto} label="Photo étiquette" />
      <label className="block space-y-1.5">
        <Label>Produit</Label>
        <Input required value={produit} onChange={(e) => setProduit(e.target.value)} />
      </label>
      <label className="block space-y-1.5">
        <Label>Lot</Label>
        <Input value={lot} onChange={(e) => setLot(e.target.value)} />
      </label>
      <label className="block space-y-1.5">
        <Label>DLC</Label>
        <Input value={dlc} onChange={(e) => setDlc(e.target.value)} />
      </label>
      <Button className="w-full" size="lg" disabled={!photo || !produit} onClick={() => void envoyer()}>
        Envoyer à l’imprimante
      </Button>
      {ok ? <p className="text-sm text-emerald-700">Étiquette dans la file d’impression.</p> : null}
    </div>
  );
}
