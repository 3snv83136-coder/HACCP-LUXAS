"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { BackArrow } from "@/components/navigation/back-arrow";
import { FilMessages } from "@/components/messagerie/fil";
import { MessageComposer } from "@/components/messagerie/composer";
import { BrandLogo } from "@/components/brand/logo";
import type { PieceSaisie } from "@/lib/fichiers";
import type { MessageVue } from "@/lib/types";

export default function CreateursMessagesPage() {
  const params = useParams<{ etablissementId: string }>();
  const etablissementId = params.etablissementId;
  const [nom, setNom] = useState("Établissement");
  const [items, setItems] = useState<MessageVue[]>([]);
  const [tous, setTous] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const charger = useCallback(async () => {
    const res = await fetch(`/api/createurs/messages?etablissementId=${etablissementId}`);
    const data = (await res.json()) as { items?: MessageVue[]; error?: string };
    if (!res.ok) throw new Error(data.error ?? "Chargement impossible");
    setItems(data.items ?? []);
  }, [etablissementId]);

  useEffect(() => {
    void fetch("/api/createurs/etablissements")
      .then(async (res) => res.json() as Promise<{ etablissements?: { id: string; nom: string }[] }>)
      .then((data) => {
        const found = (data.etablissements ?? []).find((e) => e.id === etablissementId);
        if (found) setNom(found.nom);
      })
      .catch(() => undefined);
    void charger().catch((err: unknown) => setError(err instanceof Error ? err.message : "Erreur"));
  }, [charger, etablissementId]);

  async function envoyer(texte: string, pieces: PieceSaisie[]) {
    const res = await fetch("/api/createurs/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ etablissementId, tous, texte, pieces }),
    });
    const data = (await res.json()) as { error?: string };
    if (!res.ok) throw new Error(data.error ?? "Envoi impossible");
    setTous(false);
    await charger();
  }

  return (
    <main className="min-h-dvh bg-[#07090d] text-zinc-100">
      <div className="mx-auto max-w-3xl px-6 py-8">
        <BackArrow className="border-white/20 bg-white/10 text-white hover:bg-white/20" />
        <div className="mt-6 flex items-center gap-3">
          <BrandLogo size={44} />
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-amber-300/80">Messagerie Q.G.</p>
            <h1 className="font-serif text-2xl text-white">{nom}</h1>
          </div>
        </div>
        <p className="mt-2 text-sm text-zinc-400">PDF, photos et messages vers le back-office du gérant.</p>
        {error ? <p className="mt-4 text-sm text-red-400">{error}</p> : null}
        <label className="mt-6 flex items-center gap-3 text-sm text-zinc-300">
          <input type="checkbox" className="h-5 w-5" checked={tous} onChange={(e) => setTous(e.target.checked)} />
          Envoyer aussi à tous les établissements actifs
        </label>
        <div className="mt-4">
          <MessageComposer
            sombre
            placeholder="Message, consigne, fiche…"
            onSend={envoyer}
          />
        </div>
        <div className="mt-8">
          <FilMessages sombre items={items} />
        </div>
      </div>
    </main>
  );
}
