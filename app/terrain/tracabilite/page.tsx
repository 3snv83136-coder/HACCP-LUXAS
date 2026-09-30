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
  const [saving, setSaving] = useState(false);
  const [ok, setOk] = useState<"sauve" | "imprime" | null>(null);
  const [qrUrl, setQrUrl] = useState<string | null>(null);

  async function enregistrer(imprimer: boolean) {
    if (!photo || !produit) return;
    setSaving(true);
    setOk(null);
    const res = await fetch("/api/etiquettes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        produit,
        lot,
        type: "ouverture",
        photoUrl: photo,
        imprimer,
      }),
    });
    const data = (await res.json()) as { id?: string };
    if (data.id) {
      const url = await import("qrcode").then((m) =>
        m.toDataURL(`sanitrace:etiquette:${data.id}`, { margin: 1, width: 280 }),
      );
      setQrUrl(url);
    }
    setOk(imprimer ? "imprime" : "sauve");
    setProduit("");
    setLot("");
    setPhoto(null);
    setSaving(false);
  }

  useEffect(() => {
    if (!ok) return;
    const t = window.setTimeout(() => setOk(null), 4000);
    return () => window.clearTimeout(t);
  }, [ok]);

  return (
    <div className="space-y-4 pb-10">
      <h1 className="font-serif text-2xl font-semibold text-slate-900">Traçabilité étiquette</h1>
      <p className="text-sm text-slate-500">
        Photo de l’étiquette d’origine, enregistrement au dossier. L’envoi à l’imprimante est optionnel.
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
      <div className="grid gap-2">
        <Button
          className="w-full"
          size="lg"
          disabled={!photo || !produit || saving}
          onClick={() => void enregistrer(false)}
        >
          {saving ? "Enregistrement…" : "Enregistrer"}
        </Button>
        <Button
          className="w-full"
          size="lg"
          variant="outline"
          disabled={!photo || !produit || saving}
          onClick={() => void enregistrer(true)}
        >
          Envoyer à l’imprimante
        </Button>
      </div>
      {ok === "sauve" ? <p className="text-sm text-emerald-700">Étiquette enregistrée.</p> : null}
      {ok === "imprime" ? <p className="text-sm text-emerald-700">Étiquette enregistrée et envoyée à l’imprimante.</p> : null}
      {qrUrl ? (
        <div className="rounded-3xl border border-slate-200 bg-white p-5 text-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={qrUrl} alt="QR de l’étiquette" className="mx-auto h-40 w-40" />
          <p className="mt-2 text-sm text-slate-500">QR à coller / scanner plus tard</p>
        </div>
      ) : null}
    </div>
  );
}
