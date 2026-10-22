"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { lireFichierDataUrl, type PieceSaisie } from "@/lib/fichiers";

type ComposerProps = {
  placeholder: string;
  onSend: (texte: string, pieces: PieceSaisie[]) => Promise<void>;
  sombre?: boolean;
};

export function MessageComposer({ placeholder, onSend, sombre = false }: ComposerProps) {
  const [texte, setTexte] = useState("");
  const [pieces, setPieces] = useState<PieceSaisie[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function ajouter(files: FileList | null) {
    if (!files) return;
    setError(null);
    try {
      const next: PieceSaisie[] = [];
      for (const file of Array.from(files).slice(0, 4 - pieces.length)) {
        next.push(await lireFichierDataUrl(file));
      }
      setPieces((p) => [...p, ...next].slice(0, 4));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Fichier refusé");
    }
  }

  async function envoyer() {
    if (!texte.trim() && pieces.length === 0) return;
    setSaving(true);
    setError(null);
    try {
      await onSend(texte.trim(), pieces);
      setTexte("");
      setPieces([]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Envoi impossible");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className={sombre ? "space-y-3 rounded-3xl border border-white/10 bg-black/40 p-4" : "space-y-3 rounded-3xl border border-slate-200 bg-white p-4"}>
      <textarea
        value={texte}
        onChange={(e) => setTexte(e.target.value)}
        placeholder={placeholder}
        rows={4}
        className={
          sombre
            ? "w-full rounded-2xl border border-white/15 bg-black/40 px-3 py-3 text-sm text-white"
            : "w-full rounded-2xl border border-slate-200 px-3 py-3 text-sm"
        }
      />
      {pieces.length > 0 ? (
        <ul className={sombre ? "space-y-1 text-xs text-zinc-400" : "space-y-1 text-xs text-slate-500"}>
          {pieces.map((p, i) => (
            <li key={`${p.nom}-${i}`} className="flex items-center justify-between gap-2">
              <span className="truncate">{p.nom}</span>
              <button type="button" className="text-red-500" onClick={() => setPieces((all) => all.filter((_, j) => j !== i))}>
                Retirer
              </button>
            </li>
          ))}
        </ul>
      ) : null}
      {error ? <p className={sombre ? "text-sm text-red-400" : "text-sm text-red-600"}>{error}</p> : null}
      <div className="flex flex-wrap items-center gap-2">
        <label className={sombre ? "cursor-pointer rounded-full border border-white/20 px-3 py-2 text-xs text-zinc-200" : "cursor-pointer rounded-full border border-slate-200 px-3 py-2 text-xs text-slate-600"}>
          PDF / photo
          <input
            type="file"
            accept="image/*,application/pdf"
            multiple
            className="hidden"
            onChange={(e) => {
              void ajouter(e.target.files);
              e.target.value = "";
            }}
          />
        </label>
        <Button className={sombre ? "bg-amber-300 text-black hover:bg-amber-200" : undefined} disabled={saving} onClick={() => void envoyer()}>
          {saving ? "Envoi…" : "Envoyer"}
        </Button>
      </div>
    </div>
  );
}
