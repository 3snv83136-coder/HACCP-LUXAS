"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { QrScanner } from "@/components/terrain/qr-scanner";
import { useTerrain } from "@/components/terrain/terrain-provider";
import { Button } from "@/components/ui/button";
import Link from "next/link";

function extractToken(raw: string): string {
  try {
    const url = new URL(raw);
    const parts = url.pathname.split("/").filter(Boolean);
    return parts[parts.length - 1] ?? raw;
  } catch {
    return raw.trim();
  }
}

export default function ScanPage() {
  const router = useRouter();
  const { bootstrap } = useTerrain();
  const [manual, setManual] = useState(false);

  const onResult = useCallback(
    (text: string) => {
      const token = extractToken(text);
      router.push(`/terrain/releve/${token}`);
    },
    [router],
  );

  return (
    <div className="space-y-4 pb-10">
      <h1 className="text-2xl font-semibold text-slate-900">Scanner un équipement</h1>
      <p className="text-sm text-slate-500">Vise le QR collé sur le frigo, la chambre ou la vitrine.</p>
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
