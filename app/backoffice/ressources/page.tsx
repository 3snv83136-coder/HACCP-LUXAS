"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

type Item = { id: string; nom?: string; bac?: string; zone?: string; type?: string; actif: boolean };

export default function RessourcesPage() {
  const [frigos, setFrigos] = useState<Item[]>([]);
  const [friteuses, setFriteuses] = useState<Item[]>([]);
  const [surfaces, setSurfaces] = useState<Item[]>([]);
  const [slug, setSlug] = useState<string | null>(null);
  const [nom, setNom] = useState("");
  const [kind, setKind] = useState<"frigo" | "friteuse" | "surface">("frigo");

  async function load() {
    const res = await fetch("/api/ressources");
    const data = (await res.json()) as {
      etablissement?: { slug?: string | null };
      frigos: Item[];
      friteuses: Item[];
      surfaces: Item[];
    };
    setFrigos(data.frigos ?? []);
    setFriteuses(data.friteuses ?? []);
    setSurfaces(data.surfaces ?? []);
    setSlug(data.etablissement?.slug ?? null);
  }

  useEffect(() => {
    void load();
  }, []);

  async function ajouter() {
    await fetch("/api/ressources", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kind, nom }),
    });
    setNom("");
    await load();
  }

  async function supprimer(k: string, id: string) {
    await fetch(`/api/ressources?kind=${k}&id=${id}`, { method: "DELETE" });
    await load();
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-teal-700">Administrateur</p>
        <h1 className="mt-1 font-serif text-3xl font-semibold">Ressources cuisine</h1>
        <p className="mt-1 text-slate-500">
          Ajoute ou retire frigos, friteuses et surfaces de nettoyage.
          {slug ? ` Identifiant établissement : ${slug}` : ""}
        </p>
      </div>

      <form
        className="flex flex-col gap-3 rounded-3xl border border-slate-200 bg-white p-4 sm:flex-row sm:items-end"
        onSubmit={(e) => {
          e.preventDefault();
          void ajouter();
        }}
      >
        <label className="flex-1 text-sm">
          Type
          <select
            className="mt-1 h-11 w-full rounded-2xl border border-slate-200 px-3"
            value={kind}
            onChange={(e) => setKind(e.target.value as typeof kind)}
          >
            <option value="frigo">Frigo / enceinte</option>
            <option value="friteuse">Friteuse</option>
            <option value="surface">Surface de nettoyage</option>
          </select>
        </label>
        <label className="flex-[2] text-sm">
          Nom
          <Input className="mt-1" required value={nom} onChange={(e) => setNom(e.target.value)} />
        </label>
        <Button>Ajouter</Button>
      </form>

      <Bloc titre="Frigos & enceintes" items={frigos} kind="frigo" label={(i) => i.nom ?? ""} onDel={supprimer} />
      <Bloc
        titre="Friteuses"
        items={friteuses}
        kind="friteuse"
        label={(i) => i.bac ?? ""}
        onDel={supprimer}
      />
      <Bloc
        titre="Surfaces de nettoyage"
        items={surfaces}
        kind="surface"
        label={(i) => i.zone ?? ""}
        onDel={supprimer}
      />

      <p className="text-sm text-slate-500">
        L’équipe se gère dans{" "}
        <Link href="/backoffice/personnel" className="text-teal-700">
          Salariés
        </Link>
        . Les QR des frigos sont dans{" "}
        <Link href="/backoffice/equipements" className="text-teal-700">
          Équipements
        </Link>
        .
      </p>
    </div>
  );
}

function Bloc({
  titre,
  items,
  kind,
  label,
  onDel,
}: {
  titre: string;
  items: Item[];
  kind: string;
  label: (i: Item) => string;
  onDel: (kind: string, id: string) => void;
}) {
  return (
    <section className="space-y-2">
      <h2 className="font-serif text-lg font-semibold">{titre}</h2>
      {items.length === 0 ? (
        <p className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-500">Aucun élément.</p>
      ) : (
        items.map((i) => (
          <article
            key={i.id}
            className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4"
          >
            <div>
              <p className="font-semibold">{label(i)}</p>
              <Badge variant={i.actif ? "ok" : "warn"}>{i.actif ? "Actif" : "Retiré"}</Badge>
            </div>
            {i.actif ? (
              <Button variant="ghost" onClick={() => onDel(kind, i.id)}>
                Supprimer
              </Button>
            ) : null}
          </article>
        ))
      )}
    </section>
  );
}
