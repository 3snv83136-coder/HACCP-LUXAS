"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { PhotoCapture } from "@/components/terrain/photo-capture";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { EtiquetteApercu } from "@/components/etiquettes/etiquette-apercu";
import { codeEtiquette } from "@/lib/etiquette-code";
import Link from "next/link";

type Capture = {
  id: string;
  produit: string;
  lot: string | null;
  type: string;
  photoUrl: string;
  createdAt: string;
};

export default function TracabilitePage() {
  const router = useRouter();
  const [photo, setPhoto] = useState<string | null>(null);
  const [produit, setProduit] = useState("");
  const [lot, setLot] = useState("");
  const [type, setType] = useState("ouverture");
  const [items, setItems] = useState<Capture[]>([]);
  const [printItem, setPrintItem] = useState<Capture | null>(null);

  async function load() {
    const res = await fetch("/api/etiquettes");
    const data = (await res.json()) as { items?: Capture[] };
    setItems(data.items ?? []);
  }

  useEffect(() => {
    void load();
  }, []);

  async function enregistrer(imprimer: boolean) {
    if (!produit) return;
    const res = await fetch("/api/etiquettes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ produit, lot, type, photoUrl: photo ?? "", imprimer }),
    });
    const data = (await res.json()) as { impressionId?: string | null };
    setProduit("");
    setLot("");
    setPhoto(null);
    await load();
    if (imprimer && data.impressionId) {
      router.push(`/station-impression?auto=${data.impressionId}`);
    }
  }

  function imprimer(item: Capture) {
    setPrintItem(item);
    window.setTimeout(() => window.print(), 150);
  }

  async function supprimer(item: Capture) {
    if (!window.confirm(`Supprimer l’étiquette « ${item.produit} » ?`)) return;
    await fetch(`/api/etiquettes?id=${encodeURIComponent(item.id)}`, { method: "DELETE" });
    await load();
  }

  return (
    <div className="etiquette-print-root space-y-6">
      <div className="no-print">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-teal-700">Traçabilité</p>
        <h1 className="mt-1 font-serif text-3xl font-semibold">Créer une étiquette</h1>
        <p className="mt-1 max-w-2xl text-slate-500">
          Aperçu 58×40 mm avant impression. Code-barres + infos saisies. La photo n’est pas imprimée.
        </p>
      </div>

      <form
        className="no-print space-y-4 rounded-3xl border border-slate-200 bg-white p-4 sm:p-5"
        onSubmit={(e) => {
          e.preventDefault();
          void enregistrer(false);
        }}
      >
        <PhotoCapture value={photo} onChange={setPhoto} label="Photo (optionnelle, non imprimée)" />
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="space-y-1.5">
            <Label>Produit</Label>
            <Input required value={produit} onChange={(e) => setProduit(e.target.value)} />
          </label>
          <label className="space-y-1.5">
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
          <label className="space-y-1.5 sm:col-span-2">
            <Label>Lot</Label>
            <Input value={lot} onChange={(e) => setLot(e.target.value)} />
          </label>
        </div>
        {produit ? (
          <div className="no-print">
            <EtiquetteApercu
              produit={produit}
              lot={lot || null}
              type={type}
              createdAt={new Date().toISOString()}
              code={codeEtiquette("APERCU", lot)}
            />
          </div>
        ) : null}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <Button disabled={!produit}>Enregistrer</Button>
          <Button type="button" variant="outline" disabled={!produit} onClick={() => void enregistrer(true)}>
            Connecter l’imprimante et imprimer
          </Button>
          <Link href="/station-impression" className="inline-flex h-11 items-center text-sm text-teal-800">
            Ouvrir la station d’impression →
          </Link>
        </div>
      </form>

      <section className="no-print space-y-3">
        <h2 className="font-serif text-lg font-semibold">Dernières captures</h2>
        {items.map((item) => (
          <article key={item.id} className="flex flex-col gap-3 rounded-3xl border border-slate-200 bg-white p-4 sm:flex-row">
            {item.photoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={item.photoUrl} alt={item.produit} className="h-28 w-full rounded-2xl object-cover sm:w-40" />
            ) : null}
            <div className="min-w-0 flex-1">
              <p className="font-semibold">{item.produit}</p>
              <p className="text-sm text-slate-500">
                {item.type}
                {item.lot ? ` · lot ${item.lot}` : ""}
              </p>
              <div className="mt-3 no-print">
                <EtiquetteApercu
                  produit={item.produit}
                  lot={item.lot}
                  type={item.type}
                  createdAt={item.createdAt}
                  code={codeEtiquette(item.id, item.lot)}
                />
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <Button variant="outline" onClick={() => imprimer(item)}>
                  Imprimer
                </Button>
                <Button variant="ghost" onClick={() => void supprimer(item)}>
                  Supprimer
                </Button>
              </div>
            </div>
          </article>
        ))}
      </section>

      {printItem ? (
        <div className="hidden justify-center print:flex">
          <EtiquetteApercu
            produit={printItem.produit}
            lot={printItem.lot}
            type={printItem.type}
            createdAt={printItem.createdAt}
            code={codeEtiquette(printItem.id, printItem.lot)}
            className="print:block"
          />
        </div>
      ) : null}
    </div>
  );
}
