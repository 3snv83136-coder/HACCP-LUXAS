"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { BackArrow } from "@/components/navigation/back-arrow";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { lireFichierDataUrl } from "@/lib/fichiers";

type DocItem = {
  id: string;
  titre: string;
  commentaire: string | null;
  source: string;
  createdAt: string;
  hasFichier: boolean;
};

export default function DeposerDocumentPage() {
  const params = useParams<{ etablissementId: string }>();
  const etablissementId = params.etablissementId;
  const [nom, setNom] = useState("Établissement");
  const [items, setItems] = useState<DocItem[]>([]);
  const [titre, setTitre] = useState("");
  const [commentaire, setCommentaire] = useState("");
  const [fichierUrl, setFichierUrl] = useState<string | null>(null);
  const [fichierNom, setFichierNom] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  const charger = useCallback(async () => {
    const res = await fetch(`/api/createurs/documents?etablissementId=${etablissementId}`);
    const data = (await res.json()) as {
      etablissement?: { nom: string };
      items?: DocItem[];
      error?: string;
    };
    if (!res.ok) throw new Error(data.error ?? "Chargement impossible");
    if (data.etablissement) setNom(data.etablissement.nom);
    setItems(data.items ?? []);
  }, [etablissementId]);

  useEffect(() => {
    void charger().catch((err: unknown) => setError(err instanceof Error ? err.message : "Erreur"));
  }, [charger]);

  async function deposer() {
    if (!titre.trim() || !fichierUrl) {
      setError("Titre et fichier requis");
      return;
    }
    setSaving(true);
    setError(null);
    setOk(null);
    const res = await fetch("/api/createurs/documents", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ etablissementId, titre, commentaire, fichierUrl }),
    });
    const data = (await res.json()) as { error?: string };
    setSaving(false);
    if (!res.ok) {
      setError(data.error ?? "Dépôt impossible");
      return;
    }
    setTitre("");
    setCommentaire("");
    setFichierUrl(null);
    setFichierNom(null);
    setOk("Fiche déposée dans le back-office.");
    await charger();
  }

  return (
    <main className="min-h-dvh bg-[#07090d] text-zinc-100">
      <div className="mx-auto max-w-2xl px-6 py-8">
        <BackArrow className="border-white/20 bg-white/10 text-white hover:bg-white/20" />
        <p className="mt-6 font-mono text-[11px] uppercase tracking-[0.22em] text-amber-300/80">Dépôt de document</p>
        <h1 className="mt-1 font-serif text-3xl text-white">{nom}</h1>
        <p className="mt-2 text-sm text-zinc-400">
          La fiche arrive dans Documentaire du back-office, avec ton commentaire.
        </p>

        <div className="mt-8 space-y-4 rounded-3xl border border-white/10 bg-black/40 p-5">
          <label className="block space-y-1.5">
            <Label className="text-zinc-300">Titre de la fiche</Label>
            <Input
              className="border-white/15 bg-black/40 text-white"
              value={titre}
              onChange={(e) => setTitre(e.target.value)}
              placeholder="Ex. Plan de maîtrise sanitaire"
            />
          </label>
          <label className="block space-y-1.5">
            <Label className="text-zinc-300">Petit commentaire</Label>
            <textarea
              value={commentaire}
              onChange={(e) => setCommentaire(e.target.value)}
              rows={3}
              className="w-full rounded-2xl border border-white/15 bg-black/40 px-3 py-3 text-sm text-white"
              placeholder="À classer dans le PMS, version octobre…"
            />
          </label>
          <label className="block space-y-1.5">
            <Label className="text-zinc-300">Fichier (PDF ou photo)</Label>
            <input
              type="file"
              accept="application/pdf,image/*"
              className="block w-full text-sm text-zinc-300"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                void lireFichierDataUrl(file)
                  .then((p) => {
                    setFichierUrl(p.contenu);
                    setFichierNom(p.nom);
                    setError(null);
                  })
                  .catch((err: unknown) => setError(err instanceof Error ? err.message : "Fichier refusé"));
              }}
            />
            {fichierNom ? <p className="text-xs text-emerald-300">{fichierNom}</p> : null}
          </label>
          {error ? <p className="text-sm text-red-400">{error}</p> : null}
          {ok ? <p className="text-sm text-emerald-300">{ok}</p> : null}
          <Button
            className="bg-amber-300 text-black hover:bg-amber-200"
            disabled={saving}
            onClick={() => void deposer()}
          >
            {saving ? "Dépôt…" : "Déposer dans le back-office"}
          </Button>
        </div>

        <h2 className="mt-10 font-serif text-xl text-white">Fiches déjà déposées</h2>
        <ul className="mt-4 space-y-2">
          {items.map((d) => (
            <li key={d.id} className="rounded-2xl border border-white/10 px-4 py-3">
              <p className="font-medium text-white">{d.titre}</p>
              <p className="text-xs text-zinc-500">
                {d.source === "createur" ? "Sanitrace" : "Établissement"} ·{" "}
                {new Date(d.createdAt).toLocaleDateString("fr-FR")}
              </p>
              {d.commentaire ? <p className="mt-1 text-sm text-zinc-400">{d.commentaire}</p> : null}
            </li>
          ))}
          {items.length === 0 ? <p className="text-sm text-zinc-500">Aucune fiche pour l’instant.</p> : null}
        </ul>
      </div>
    </main>
  );
}
