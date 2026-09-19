import { Badge } from "@/components/ui/badge";
import type { TacheDuJour } from "@/lib/types";
import { formatHeure, formatTemp } from "@/lib/utils";
import { ChevronRight } from "lucide-react";
import Link from "next/link";

const statutBadge = {
  a_faire: { variant: "info" as const, label: "À faire" },
  en_retard: { variant: "warn" as const, label: "En retard" },
  fait: { variant: "ok" as const, label: "Fait" },
};

export function TaskCard({ tache }: { tache: TacheDuJour }) {
  const badge = statutBadge[tache.statut];
  return (
    <Link
      href={tache.href}
      className="flex items-center gap-3 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm active:scale-[0.99]"
    >
      <div
        className={`h-12 w-1.5 rounded-full ${
          tache.statut === "en_retard"
            ? "bg-amber-400"
            : tache.statut === "fait"
              ? tache.conforme === false
                ? "bg-red-400"
                : "bg-emerald-400"
              : "bg-teal-400"
        }`}
      />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate font-semibold text-slate-900">{tache.titre}</p>
          <Badge variant={badge.variant}>{badge.label}</Badge>
        </div>
        <p className="mt-1 truncate text-sm text-slate-500">{tache.sousTitre}</p>
        {tache.lastValue != null ? (
          <p className="mt-1 font-mono text-sm text-slate-600">
            {formatTemp(tache.lastValue)}
            {tache.lastAt ? ` · ${formatHeure(tache.lastAt)}` : ""}
          </p>
        ) : null}
      </div>
      <ChevronRight className="h-5 w-5 text-slate-300" />
    </Link>
  );
}
