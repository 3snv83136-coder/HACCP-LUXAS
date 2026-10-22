"use client";

import { codeBarresNormalise, modulesCode39 } from "@/lib/barcode";
import { cn } from "@/lib/utils";

export type EtiquetteDonnees = {
  produit: string;
  lot?: string | null;
  type?: string | null;
  createdAt?: string | null;
  code: string;
};

const NARROW_MM = 0.42;
const WIDE_MM = 1.1;
const QUIET_MM = 2.4;
const BAR_H_MM = 12;

export function EtiquetteApercu({
  produit,
  lot,
  type,
  createdAt,
  code,
  className,
}: EtiquetteDonnees & { className?: string }) {
  const label = codeBarresNormalise(code);
  const modules = modulesCode39(code);
  const date = createdAt
    ? new Date(createdAt).toLocaleString("fr-FR", {
        day: "2-digit",
        month: "2-digit",
        year: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      })
    : null;

  let x = QUIET_MM;
  const rects: { x: number; w: number }[] = [];
  for (const mod of modules) {
    const w = mod.large ? WIDE_MM : NARROW_MM;
    if (mod.bar) rects.push({ x, w });
    x += w;
  }
  const svgW = x + QUIET_MM;

  return (
    <div
      className={cn(
        "etiquette-ticket flex h-[40mm] w-[58mm] flex-col justify-between overflow-hidden rounded-sm border border-slate-900 bg-white p-[1.5mm] text-slate-900",
        className,
      )}
    >
      <div>
        <p className="text-[6.5px] font-semibold uppercase tracking-[0.18em] text-teal-800">Sanitrace</p>
        <p className="mt-0.5 line-clamp-2 text-[11px] font-semibold leading-tight">{produit}</p>
        <p className="mt-0.5 text-[7.5px] uppercase tracking-wide text-slate-600">
          {(type ?? "ouverture").replaceAll("_", " ")}
          {lot ? ` · Lot ${lot}` : ""}
        </p>
        {date ? <p className="text-[7px] text-slate-500">{date}</p> : null}
      </div>
      <div className="mt-1">
        <svg
          viewBox={`0 0 ${svgW} ${BAR_H_MM}`}
          width="100%"
          height={`${BAR_H_MM}mm`}
          preserveAspectRatio="none"
          aria-hidden
        >
          <rect x="0" y="0" width={svgW} height={BAR_H_MM} fill="#ffffff" />
          {rects.map((r, i) => (
            <rect key={i} x={r.x} y="0" width={r.w} height={BAR_H_MM} fill="#000000" />
          ))}
        </svg>
        <p className="mt-[0.4mm] text-center font-mono text-[7px] font-semibold tracking-[0.18em] text-black">
          {label}
        </p>
      </div>
    </div>
  );
}
