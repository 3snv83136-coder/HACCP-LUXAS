"use client";

import { useEffect, useState } from "react";
import { PhotoCapture } from "@/components/terrain/photo-capture";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";

type Capture = {
  id: string;
  produit: string;
  lot: string | null;
  dlc: string | null;
  type: string;
  photoUrl: string;
  createdAt: string;
};

export default function TracabilitePage() {
  const [photo, setPhoto] = useState<string | null>(null);
  const [produit, setProduit] = useState("");
  const [lot, setLot] = useState("");
  const [dlc, setDlc] = useState("");
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

  async function enregistrer() {
    if (!photo || !produit) return;
    await fetch("/api/etiquettes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ produit, lot, dlc, type, photoUrl: photo, imprimer: true }),
    });
    setProduit("");
    setLot("");
    setDlc("");
    setPhoto(null);
    await load();
  }

  function imprimer(item: Capture) {
    setPrintItem(item);
    window.setTimeout(() => window.print(), 150);
  }

  return (
    <div className="etiquette-print-root space-y-6">
      <div className="no-print">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-teal-700">Traçabilité</p>
        <h1 className="mt-1 font-serif text-3xl font-semibold">Photo → étiquette</h1>
        <p className="mt-1 max-w-2xl text-slate-500">
          Photographie l’étiquette d’origine. L’app la recadre au format imprimante 58×40 mm et
          l’envoie à la file d’impression, utilisable depuis n’importe quel appareil.
        </p>
      </div>

      <form
        className="no-print space-y-4 rounded-3xl border border-slate-200 bg-white p-4 sm:p-5"
        onSubmit={(e) => {
          e.preventDefault();
          void enregistrer();
        }}
      >
        <PhotoCapture value={photo} onChange={setPhoto} label="Photo de l’étiquette" />
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
          <label className="space-y-1.5">
            <Label>Lot</Label>
            <Input value={lot} onChange={(e) => setLot(e.target.value)} />
          </label>
          <label className="space-y-1.5">
            <Label>DLC</Label>
            <Input value={dlc} onChange={(e) => setDlc(e.target.value)} placeholder="ex. 24/09 12:00" />
          </label>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button disabled={!photo || !produit}>Enregistrer et envoyer à l’imprimante</Button>
          <Link href="/station-impression" className="inline-flex h-11 items-center text-sm text-teal-800">
            Ouvrir la station d’impression →
          </Link>
        </div>
      </form>

      <section className="no-print space-y-3">
        <h2 className="font-serif text-lg font-semibold">Dernières captures</h2>
        {items.map((item) => (
          <article key={item.id} className="flex flex-col gap-3 rounded-3xl border border-slate-200 bg-white p-4 sm:flex-row">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={item.photoUrl} alt={item.produit} className="h-28 w-full rounded-2xl object-cover sm:w-40" />
            <div className="min-w-0 flex-1">
              <p className="font-semibold">{item.produit}</p>
              <p className="text-sm text-slate-500">
                {item.type}
                {item.lot ? ` · lot ${item.lot}` : ""}
                {item.dlc ? ` · DLC ${item.dlc}` : ""}
              </p>
              <Button variant="outline" className="mt-3" onClick={() => imprimer(item)}>
                Imprimer 58×40 mm
              </Button>
            </div>
          </article>
        ))}
      </section>

      {printItem ? (
        <div className="etiquette-ticket mx-auto hidden h-[40mm] w-[58mm] overflow-hidden rounded-sm border border-slate-900 bg-white p-1 print:block">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={printItem.photoUrl} alt="" className="h-12 w-full object-cover" />
          <p className="mt-1 text-[10px] font-bold leading-tight">{printItem.produit}</p>
          <p className="text-[8px] uppercase">{printItem.type}</p>
          <p className="font-mono text-[8px]">
            {printItem.lot ? `Lot ${printItem.lot} · ` : ""}
            {printItem.dlc ? `DLC ${printItem.dlc}` : ""}
          </p>
        </div>
      ) : null}
    </div>
  );
}
