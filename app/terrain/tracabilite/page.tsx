"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { PhotoCapture } from "@/components/terrain/photo-capture";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { EtiquetteApercu } from "@/components/etiquettes/etiquette-apercu";
import { codeEtiquette } from "@/lib/etiquette-code";

export default function TerrainTracabilitePage() {
  const router = useRouter();
  const [photo, setPhoto] = useState<string | null>(null);
  const [produit, setProduit] = useState("");
  const [lot, setLot] = useState("");
  const [type, setType] = useState("ouverture");
  const [saving, setSaving] = useState(false);
  const [ok, setOk] = useState<"sauve" | "imprime" | null>(null);

  async function enregistrer(imprimer: boolean) {
    if (!produit) return;
    setSaving(true);
    setOk(null);
    const res = await fetch("/api/etiquettes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        produit,
        lot,
        type,
        photoUrl: photo ?? "",
        imprimer,
      }),
    });
    const data = (await res.json()) as { id?: string; impressionId?: string | null };
    setSaving(false);
    if (!res.ok) return;
    if (imprimer && data.impressionId) {
      router.push(`/station-impression?auto=${data.impressionId}`);
      return;
    }
    setOk(imprimer ? "imprime" : "sauve");
    setProduit("");
    setLot("");
    setPhoto(null);
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
        Saisis les infos, vérifie l’aperçu 58×40 mm, puis enregistre ou envoie à l’imprimante.
        La photo reste au dossier et n’est pas imprimée.
      </p>
      <PhotoCapture value={photo} onChange={setPhoto} label="Photo (optionnelle, non imprimée)" />
      <label className="block space-y-1.5">
        <Label>Produit</Label>
        <Input required value={produit} onChange={(e) => setProduit(e.target.value)} />
      </label>
      <label className="block space-y-1.5">
        <Label>Type</Label>
        <select
          className="h-12 w-full rounded-2xl border border-slate-200 px-3"
          value={type}
          onChange={(e) => setType(e.target.value)}
        >
          <option value="ouverture">Ouverture</option>
          <option value="decongelation">Décongélation</option>
          <option value="fabrication">Fabrication</option>
          <option value="reception">Réception</option>
        </select>
      </label>
      <label className="block space-y-1.5">
        <Label>Lot</Label>
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
            type={type}
            createdAt={new Date().toISOString()}
            code={codeEtiquette("APERCU", lot)}
          />
        </div>
      ) : null}

      <div className="grid gap-2">
        <Button className="w-full" size="lg" disabled={!produit || saving} onClick={() => void enregistrer(false)}>
          {saving ? "Enregistrement…" : "Enregistrer"}
        </Button>
        <Button
          className="w-full"
          size="lg"
          variant="outline"
          disabled={!produit || saving}
          onClick={() => void enregistrer(true)}
        >
          Connecter l’imprimante et imprimer
        </Button>
      </div>
      {ok === "sauve" ? <p className="text-sm text-emerald-700">Étiquette enregistrée.</p> : null}
    </div>
  );
}
