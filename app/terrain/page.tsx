"use client";

import Link from "next/link";
import { Camera, ClipboardList, Droplets, Flame, Images, Package, Tag, TriangleAlert, UtensilsCrossed } from "lucide-react";
import { TaskCard } from "@/components/terrain/task-card";
import { useTerrain } from "@/components/terrain/terrain-provider";

const shortcuts = [
  { href: "/terrain/scan", label: "Scan QR", icon: Camera },
  { href: "/terrain/tracabilite", label: "Traçabilité", icon: Images },
  { href: "/terrain/reception", label: "Réception", icon: Package },
  { href: "/terrain/menage", label: "Ménage", icon: Droplets },
  { href: "/terrain/etiquette", label: "Étiquette", icon: Tag },
  { href: "/terrain/temoins", label: "Témoins", icon: UtensilsCrossed },
  { href: "/terrain/huile", label: "Huile", icon: Flame },
  { href: "/terrain/nc", label: "Alerte", icon: TriangleAlert },
];

export default function TerrainHomePage() {
  const { taches, bootstrap, refresh } = useTerrain();
  const retard = taches.filter((t) => t.statut === "en_retard").length;
  const aFaire = taches.filter((t) => t.statut !== "fait").length;

  return (
    <div className="space-y-5 pb-8">
      <section className="rounded-3xl border border-slate-200 bg-teal-50 p-5">
        <p className="text-xs uppercase tracking-[0.18em] text-teal-700">Aujourd’hui</p>
        <h1 className="mt-1 text-3xl font-semibold text-slate-900">Mes tâches</h1>
        <p className="mt-2 text-sm text-slate-500">
          {aFaire} à faire
          {retard > 0 ? ` · ${retard} en retard` : ""} · {bootstrap.nonConformitesOuvertes} NC ouvertes
        </p>
        <button type="button" onClick={() => void refresh()} className="mt-3 text-xs text-slate-400">
          Actualiser
        </button>
      </section>

      <div className="grid grid-cols-4 gap-2 sm:grid-cols-4">
        {shortcuts.map((s) => (
          <Link
            key={s.href}
            href={s.href}
            className="flex flex-col items-center gap-2 rounded-2xl border border-slate-200 bg-white py-3 text-[10px] font-medium uppercase tracking-wide text-slate-600 shadow-sm"
          >
            <s.icon className="h-5 w-5 text-teal-700" />
            {s.label}
          </Link>
        ))}
      </div>

      <div className="space-y-2">
        {taches.length === 0 ? (
          <p className="flex items-center gap-2 text-sm text-slate-500">
            <ClipboardList className="h-4 w-4" /> Aucune tâche paramétrée
          </p>
        ) : (
          taches.map((tache) => <TaskCard key={tache.id} tache={tache} />)
        )}
      </div>
    </div>
  );
}
