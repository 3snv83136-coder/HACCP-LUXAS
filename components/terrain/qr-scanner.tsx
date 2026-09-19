"use client";

import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { Button } from "@/components/ui/button";

type QrScannerProps = {
  onResult: (text: string) => void;
};

export function QrScanner({ onResult }: QrScannerProps) {
  const [error, setError] = useState<string | null>(null);
  const [running, setRunning] = useState(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);

  useEffect(() => {
    let cancelled = false;
    const scanner = new Html5Qrcode("sanitrace-qr-reader");
    scannerRef.current = scanner;
    scanner
      .start(
        { facingMode: "environment" },
        { fps: 8, qrbox: { width: 240, height: 240 } },
        (decoded) => {
          if (!cancelled) onResult(decoded);
        },
        () => undefined,
      )
      .then(() => {
        if (!cancelled) setRunning(true);
      })
      .catch(() => {
        if (!cancelled) setError("Caméra indisponible. Choisis l’équipement dans la liste.");
      });

    return () => {
      cancelled = true;
      void Promise.resolve(scanner.stop()).finally(() => {
        scanner.clear();
      });
    };
  }, [onResult]);

  return (
    <div className="space-y-3">
      <div
        id="sanitrace-qr-reader"
        className="min-h-64 overflow-hidden rounded-3xl border border-white/10 bg-black"
      />
      {error ? <p className="text-sm text-amber-200">{error}</p> : null}
      {running ? (
        <Button
          variant="outline"
          className="w-full"
          onClick={() => {
            scannerRef.current?.stop();
          }}
        >
          Couper la caméra
        </Button>
      ) : null}
    </div>
  );
}
