"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { formatDateHeure } from "@/lib/utils";

type LotItem = {
  produit: string;
  type: string;
  lot: string | null;
  createdAt: string;
  qrToken: string;
  dlc: string | null;
};

type EtiquetteItem = {
  id: string;
  produit: string;
  type: string;
  lot: string | null;
  photoUrl: string;
  createdAt: string;
  createdBy: string;
};

type Payload =
  | { kind: "lot"; item: LotItem }
  | { kind: "etiquette"; item: EtiquetteItem }
  | { kind: "equipement"; token: string }
  | { kind: "inconnu" }
  | { kind: "chargement" };

export default function LotScanPage() {
  const params = useParams<{ token: string }>();
  const router = useRouter();
  const token = decodeURIComponent(params.token);
  const [data, setData] = useState<Payload>({ kind: "chargement" });

  useEffect(() => {
    let cancelled = false;
    void fetch(`/api/qr?q=${encodeURIComponent(token)}`)
      .then(async (res) => {
        const payload = (await res.json()) as Payload;
        if (cancelled) return;
        if (payload.kind === "equipement") {
          router.replace(`/terrain/releve/${encodeURIComponent(payload.token)}`);
          return;
        }
        setData(res.ok ? payload : { kind: "inconnu" });
      })
      .catch(() => {
        if (!cancelled) setData({ kind: "inconnu" });
      });
    return () => {
      cancelled = true;
    };
  }, [router, token]);

  if (data.kind === "chargement") {
    return <p className="text-slate-500">Lecture de l’étiquette…</p>;
  }

  if (data.kind === "inconnu") {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-semibold text-slate-900">QR inconnu</h1>
        <p className="text-slate-500">Aucune étiquette pour « {token} ».</p>
        <Button variant="outline" onClick={() => router.push("/terrain/scan")}>
          Retour au scan
        </Button>
      </div>
    );
  }

  if (data.kind === "equipement") {
    return <p className="text-slate-500">Ouverture du relevé…</p>;
  }

  const item = data.item;
  const photo = data.kind === "etiquette" ? data.item.photoUrl : null;
  const auteur = data.kind === "etiquette" ? data.item.createdBy : null;

  return (
    <div className="space-y-4 pb-10">
      <p className="text-xs uppercase tracking-[0.16em] text-teal-700">Étiquette scannée</p>
      <h1 className="text-2xl font-semibold text-slate-900">{item.produit}</h1>
      {photo ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={photo} alt={item.produit} className="h-48 w-full rounded-3xl object-cover" />
      ) : null}
      <div className="rounded-3xl border border-slate-200 bg-white p-4 text-sm text-slate-600">
        <p>
          Type : <span className="font-medium text-slate-900">{item.type}</span>
        </p>
        {item.lot ? (
          <p className="mt-1">
            Lot : <span className="font-medium text-slate-900">{item.lot}</span>
          </p>
        ) : null}
        <p className="mt-1">Enregistrée {formatDateHeure(item.createdAt)}</p>
        {auteur ? <p className="mt-1">Par {auteur}</p> : null}
      </div>
      <Button variant="outline" className="w-full" onClick={() => router.push("/terrain/scan")}>
        Scanner un autre QR
      </Button>
    </div>
  );
}
