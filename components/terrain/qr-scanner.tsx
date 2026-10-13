"use client";

import { useEffect, useRef, useState } from "react";
import { Html5Qrcode, Html5QrcodeSupportedFormats } from "html5-qrcode";
import { Button } from "@/components/ui/button";

type QrScannerProps = {
  onResult: (text: string) => void;
  etiquettes?: boolean;
};

export function QrScanner({ onResult, etiquettes = false }: QrScannerProps) {
  const [error, setError] = useState<string | null>(null);
  const [running, setRunning] = useState(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);

  useEffect(() => {
    let cancelled = false;
    const scanner = new Html5Qrcode("sanitrace-qr-reader", {
      formatsToSupport: etiquettes
        ? [
            Html5QrcodeSupportedFormats.QR_CODE,
            Html5QrcodeSupportedFormats.CODE_39,
            Html5QrcodeSupportedFormats.CODE_128,
            Html5QrcodeSupportedFormats.CODE_93,
          ]
        : [Html5QrcodeSupportedFormats.QR_CODE],
      verbose: false,
    });
    scannerRef.current = scanner;
    scanner
      .start(
        { facingMode: "environment" },
        { fps: 8, qrbox: etiquettes ? { width: 280, height: 120 } : { width: 240, height: 240 } },
        (decoded) => {
          if (!cancelled) onResult(decoded);
        },
        () => undefined,
      )
      .then(() => {
        if (!cancelled) setRunning(true);
      })
      .catch(() => {
        if (!cancelled) {
          setError(
            etiquettes
              ? "Caméra indisponible. Autorise l’accès photo ou saisis le code à la main."
              : "Caméra indisponible. Choisis l’équipement dans la liste.",
          );
        }
      });

    return () => {
      cancelled = true;
      void Promise.resolve(scanner.stop()).finally(() => {
        scanner.clear();
      });
    };
  }, [onResult, etiquettes]);

  return (
    <div className="space-y-3">
      <div
        id="sanitrace-qr-reader"
        className="min-h-64 overflow-hidden rounded-3xl border border-slate-200 bg-black"
      />
      {error ? <p className="text-sm text-amber-700">{error}</p> : null}
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
