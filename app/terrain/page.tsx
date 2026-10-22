"use client";

import Link from "next/link";
import { useState } from "react";
import {
  Camera,
  ClipboardCheck,
  ClipboardList,
  Droplets,
  Flame,
  Images,
  Package,
  Megaphone,
  ScanBarcode,
  TriangleAlert,
  UtensilsCrossed,
} from "lucide-react";
import { TaskCard } from "@/components/terrain/task-card";
import { useTerrain } from "@/components/terrain/terrain-provider";

const shortcuts = [
  { href: "/terrain/scan", label: "Scan QR", icon: Camera, tone: "border-sky-300 bg-sky-100 text-sky-900" },
  { href: "/terrain/scan-etiquette", label: "Scanner", icon: ScanBarcode, tone: "border-teal-300 bg-teal-100 text-teal-900" },
  { href: "/terrain/checklist", label: "Check-list", icon: ClipboardCheck, tone: "border-emerald-300 bg-emerald-100 text-emerald-900" },
  { href: "/terrain/infos", label: "Infos", icon: Megaphone, tone: "border-amber-300 bg-amber-100 text-amber-950" },
  { href: "/terrain/tracabilite", label: "Traçabilité", icon: Images, tone: "border-cyan-300 bg-cyan-100 text-cyan-950" },
  { href: "/terrain/reception", label: "Réception", icon: Package, tone: "border-lime-300 bg-lime-100 text-lime-950" },
  { href: "/terrain/menage", label: "Ménage", icon: Droplets, tone: "border-blue-300 bg-blue-100 text-blue-950" },
  { href: "/terrain/temoins", label: "Témoins", icon: UtensilsCrossed, tone: "border-orange-300 bg-orange-100 text-orange-950" },
  { href: "/terrain/huile", label: "Huile", icon: Flame, tone: "border-yellow-300 bg-yellow-100 text-yellow-950" },
  { href: "/terrain/nc", label: "Alerte", icon: TriangleAlert, tone: "border-rose-300 bg-rose-100 text-rose-950" },
];

export default function TerrainHomePage() {
  const { taches, bootstrap, refresh } = useTerrain();
  const retard = taches.filter((t) => t.statut === "en_retard").length;
  const aFaire = taches.filter((t) => t.statut !== "fait").length;
  const [masquees, setMasquees] = useState<string[]>([]);
  const notifs = (bootstrap.notifications ?? []).filter((n) => !masquees.includes(n.id));

  async function fermerNotif(id: string) {
    setMasquees((ids) => [...ids, id]);
    await fetch("/api/alertes", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    await refresh();
  }

  return (
    <div className="space-y-5 pb-8">
      {notifs.map((n) => (
        <section key={n.id} className="rounded-3xl border border-amber-200 bg-amber-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-amber-800">Notification</p>
          <p className="mt-1 text-sm text-slate-800">{n.message}</p>
          <button type="button" className="mt-2 text-xs text-amber-800 underline" onClick={() => void fermerNotif(n.id)}>
            J’ai compris
          </button>
        </section>
      ))}

      <section className="rounded-3xl border border-teal-300 bg-gradient-to-br from-teal-400 via-teal-300 to-emerald-200 p-5 text-teal-950 shadow-sm">
        <p className="text-xs uppercase tracking-[0.18em] text-teal-900/80">Aujourd’hui</p>
        <h1 className="mt-1 text-3xl font-semibold text-teal-950">Mes tâches</h1>
        <p className="mt-2 text-sm text-teal-900/80">
          {aFaire} à faire
          {retard > 0 ? ` · ${retard} en retard` : ""} · {bootstrap.nonConformitesOuvertes} NC ouvertes
        </p>
        <button type="button" onClick={() => void refresh()} className="mt-3 text-xs text-teal-800 underline">
          Actualiser
        </button>
      </section>

      <Link
        href="/terrain/scan-etiquette"
        className="flex items-center gap-4 rounded-3xl border border-teal-300 bg-gradient-to-r from-white/80 to-teal-100 p-4 shadow-sm backdrop-blur-xl"
      >
        <span className="inline-flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-teal-50 text-teal-800">
          <ScanBarcode className="h-7 w-7" />
        </span>
        <span>
          <span className="block font-serif text-xl font-semibold text-slate-900">Scanner les étiquettes</span>
          <span className="mt-0.5 block text-sm text-slate-500">Code-barres ou QR de l’étiquette produit</span>
        </span>
      </Link>

      <div className="grid grid-cols-4 gap-2 sm:grid-cols-4">
        {shortcuts.map((s) => (
          <Link
            key={s.href}
            href={s.href}
            className={`flex flex-col items-center gap-2 rounded-2xl border py-3 text-[10px] font-medium uppercase tracking-wide shadow-sm ${s.tone}`}
          >
            <s.icon className="h-5 w-5" />
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
