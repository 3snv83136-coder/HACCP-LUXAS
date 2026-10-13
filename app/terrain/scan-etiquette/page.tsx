"use client";

import { useCallback, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { QrScanner } from "@/components/terrain/qr-scanner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { extraireQrSanitrace } from "@/lib/qr-token";

export default function ScanEtiquettePage() {
  const router = useRouter();
  const lu = useRef(false);
  const [manuel, setManuel] = useState("");

  const onResult = useCallback(
    (text: string) => {
      if (lu.current) return;
      const token = extraireQrSanitrace(text);
      if (!token) return;
      lu.current = true;
      router.push(`/terrain/lot/${encodeURIComponent(token)}`);
    },
    [router],
  );

  function validerManuel() {
    const token = extraireQrSanitrace(manuel);
    if (!token) return;
    router.push(`/terrain/lot/${encodeURIComponent(token)}`);
  }

  return (
    <div className="space-y-4 pb-10">
      <h1 className="text-2xl font-semibold text-slate-900">Scanner les étiquettes</h1>
      <p className="text-sm text-slate-500">
        Vise le code-barres ou le QR imprimé sur l’étiquette. Le produit s’ouvre tout de suite.
      </p>
      <QrScanner onResult={onResult} etiquettes />
      <div className="space-y-2">
        <Input
          value={manuel}
          onChange={(e) => setManuel(e.target.value)}
          placeholder="Code lu à la main"
          onKeyDown={(e) => {
            if (e.key === "Enter") validerManuel();
          }}
        />
        <Button variant="outline" className="w-full" disabled={!manuel.trim()} onClick={validerManuel}>
          Ouvrir l’étiquette
        </Button>
      </div>
    </div>
  );
}
