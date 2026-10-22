"use client";

import { useCallback, useEffect, useState } from "react";
import { FilMessages } from "@/components/messagerie/fil";
import { MessageComposer } from "@/components/messagerie/composer";
import type { PieceSaisie } from "@/lib/fichiers";
import type { MessageVue } from "@/lib/types";

export default function MessagesBackofficePage() {
  const [equipe, setEquipe] = useState<MessageVue[]>([]);
  const [qg, setQg] = useState<MessageVue[]>([]);
  const [error, setError] = useState<string | null>(null);

  const charger = useCallback(async () => {
    const [a, b] = await Promise.all([
      fetch("/api/messages?canal=equipe"),
      fetch("/api/messages?canal=qg"),
    ]);
    const da = (await a.json()) as { items?: MessageVue[]; error?: string };
    const db = (await b.json()) as { items?: MessageVue[]; error?: string };
    if (!a.ok) throw new Error(da.error ?? "Équipe impossible");
    if (!b.ok) throw new Error(db.error ?? "Sanitrace impossible");
    setEquipe(da.items ?? []);
    setQg(db.items ?? []);
  }, []);

  useEffect(() => {
    void charger().catch((err: unknown) => setError(err instanceof Error ? err.message : "Erreur"));
  }, [charger]);

  async function envoyer(canal: "equipe" | "qg", texte: string, pieces: PieceSaisie[]) {
    const res = await fetch("/api/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ canal, texte, pieces }),
    });
    const data = (await res.json()) as { error?: string };
    if (!res.ok) throw new Error(data.error ?? "Envoi impossible");
    await charger();
  }

  return (
    <div className="space-y-10 pb-16">
      <div>
        <h1 className="font-serif text-3xl font-semibold text-slate-900">Messagerie</h1>
        <p className="mt-1 text-sm text-slate-500">
          Infos vers les employés (sans réponse) et échange avec Sanitrace (PDF, photos).
        </p>
      </div>
      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      <section className="space-y-4">
        <div>
          <h2 className="font-serif text-xl font-semibold">Infos employés</h2>
          <p className="text-sm text-slate-500">Ils voient le message dans Accès Employé, sans pouvoir répondre.</p>
        </div>
        <MessageComposer
          placeholder="Ex. fermeture exceptionnelle mardi soir…"
          onSend={(texte, pieces) => envoyer("equipe", texte, pieces)}
        />
        <FilMessages items={equipe} />
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="font-serif text-xl font-semibold">Sanitrace (créateurs)</h2>
          <p className="text-sm text-slate-500">Écris au Q.G. et joins un PDF ou une photo.</p>
        </div>
        <MessageComposer
          placeholder="Message pour l’équipe Sanitrace…"
          onSend={(texte, pieces) => envoyer("qg", texte, pieces)}
        />
        <FilMessages items={qg} />
      </section>
    </div>
  );
}
