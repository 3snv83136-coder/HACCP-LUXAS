"use client";

import { useCallback, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { QrScanner } from "@/components/terrain/qr-scanner";
import { useTerrain } from "@/components/terrain/terrain-provider";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { estQrEtiquette, extraireQrSanitrace } from "@/lib/qr-token";

export default function ScanPage() {
  const router = useRouter();
  const { bootstrap } = useTerrain();
  const [manual, setManual] = useState(false);
  const lu = useRef(false);

  const onResult = useCallback(
    (text: string) => {
      if (lu.current) return;
      lu.current = true;
      const token = extraireQrSanitrace(text);
      if (estQrEtiquette(token)) {
        router.push(`/terrain/lot/${encodeURIComponent(token)}`);
        return;
      }
      router.push(`/terrain/releve/${encodeURIComponent(token)}`);
    },
    [router],
  );

  return (
    <div className="space-y-4 pb-10">
      <h1 className="text-2xl font-semibold text-slate-900">Scanner un QR</h1>
      <p className="text-sm text-slate-500">
        Vise le QR d’un équipement (frigo, chambre, vitrine) ou d’une étiquette produit.
      </p>
      {!manual ? <QrScanner onResult={onResult} /> : null}
      <Button variant="outline" className="w-full" onClick={() => setManual((v) => !v)}>
        {manual ? "Revenir au scan" : "Choisir dans la liste"}
      </Button>
      {manual ? (
        <div className="space-y-2">
          {bootstrap.equipements.map((eq) => (
            <Link
              key={eq.id}
              href={`/terrain/releve/${eq.qrToken}`}
              className="block rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 shadow-sm"
            >
              <p className="font-medium">{eq.nom}</p>
              <p className="text-xs text-slate-500">{eq.qrToken}</p>
            </Link>
          ))}
        </div>
      ) : null}
    </div>
  );
}
