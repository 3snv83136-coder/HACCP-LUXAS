"use client";

import { useEffect, useState } from "react";
import { FilMessages } from "@/components/messagerie/fil";
import { useTerrain } from "@/components/terrain/terrain-provider";
import type { MessageVue } from "@/lib/types";

export default function InfosEmployePage() {
  const { session } = useTerrain();
  const [items, setItems] = useState<MessageVue[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void fetch("/api/messages?canal=equipe")
      .then(async (res) => {
        const data = (await res.json()) as { items?: MessageVue[]; error?: string };
        if (!res.ok) throw new Error(data.error ?? "Chargement impossible");
        setItems(data.items ?? []);
      })
      .catch((err: unknown) => setError(err instanceof Error ? err.message : "Erreur"));
  }, []);

  return (
    <div className="space-y-5 pb-10">
      <div>
        <h1 className="font-serif text-2xl font-semibold text-slate-900">Infos du gérant</h1>
        <p className="mt-1 text-sm text-slate-500">
          Messages pour l’équipe de {session.etablissementNom}. Lecture seule — {session.prenom} ne peut pas
          répondre.
        </p>
      </div>
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      <FilMessages items={items} vide="Aucune info du gérant pour le moment." />
    </div>
  );
}
