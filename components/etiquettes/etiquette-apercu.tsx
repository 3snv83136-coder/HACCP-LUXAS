"use client";

import { barresCode39, codeBarresNormalise } from "@/lib/barcode";
import { cn } from "@/lib/utils";

export type EtiquetteDonnees = {
  produit: string;
  lot?: string | null;
  type?: string | null;
  createdAt?: string | null;
  code: string;
};

export function EtiquetteApercu({
  produit,
  lot,
  type,
  createdAt,
  code,
  className,
}: EtiquetteDonnees & { className?: string }) {
  const bars = barresCode39(code);
  const label = codeBarresNormalise(code);
  const date = createdAt
    ? new Date(createdAt).toLocaleString("fr-FR", {
        day: "2-digit",
        month: "2-digit",
        year: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      })
    : null;

  return (
    <div
      className={cn(
        "etiquette-ticket flex h-[40mm] w-[58mm] flex-col justify-between overflow-hidden rounded-sm border border-slate-800 bg-white p-1.5 text-slate-900",
        className,
      )}
    >
      <div>
        <p className="text-[7px] font-semibold uppercase tracking-[0.18em] text-teal-800">Sanitrace</p>
        <p className="mt-0.5 line-clamp-2 text-[11px] font-semibold leading-tight">{produit}</p>
        <p className="mt-0.5 text-[7.5px] uppercase tracking-wide text-slate-600">
          {(type ?? "ouverture").replaceAll("_", " ")}
          {lot ? ` · Lot ${lot}` : ""}
        </p>
        {date ? <p className="text-[7px] text-slate-500">{date}</p> : null}
      </div>
      <div>
        <div className="flex h-7 items-end overflow-hidden">
          {bars.map((b, i) =>
            b.gap ? (
              <span key={i} className="h-full w-[0.6px] bg-white" />
            ) : (
              <span
                key={i}
                className="h-full bg-slate-900"
                style={{ width: b.large ? 1.6 : 0.7 }}
              />
            ),
          )}
        </div>
        <p className="mt-0.5 text-center font-mono text-[6.5px] tracking-[0.12em]">{label}</p>
      </div>
    </div>
  );
}
