"use client";

import type { MessageVue } from "@/lib/types";

export function FilMessages({
  items,
  sombre = false,
  vide = "Aucun message pour le moment.",
}: {
  items: MessageVue[];
  sombre?: boolean;
  vide?: string;
}) {
  if (items.length === 0) {
    return <p className={sombre ? "text-sm text-zinc-500" : "text-sm text-slate-500"}>{vide}</p>;
  }

  return (
    <ul className="space-y-3">
      {items.map((m) => (
        <li
          key={m.id}
          className={
            sombre
              ? "rounded-3xl border border-white/10 bg-black/40 p-4"
              : "rounded-3xl border border-slate-200 bg-white p-4 shadow-sm"
          }
        >
          <div className="flex items-baseline justify-between gap-3">
            <p className={sombre ? "text-sm font-semibold text-amber-200" : "text-sm font-semibold text-teal-800"}>
              {m.auteurType === "createur" ? "Sanitrace" : m.auteurNom}
            </p>
            <p className={sombre ? "text-[11px] text-zinc-500" : "text-[11px] text-slate-400"}>
              {new Date(m.createdAt).toLocaleString("fr-FR", {
                day: "2-digit",
                month: "short",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          </div>
          <p className={sombre ? "mt-2 whitespace-pre-wrap text-sm text-zinc-200" : "mt-2 whitespace-pre-wrap text-sm text-slate-700"}>
            {m.texte}
          </p>
          {m.pieces.length > 0 ? (
            <ul className="mt-3 space-y-2">
              {m.pieces.map((p) => (
                <li key={p.id}>
                  {p.mime.startsWith("image/") ? (
                    // Pièce en data URL.
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p.contenu} alt={p.nom} className="max-h-56 rounded-2xl object-contain" />
                  ) : (
                    <a
                      href={p.contenu}
                      download={p.nom}
                      className={sombre ? "text-sm text-amber-300 underline" : "text-sm text-teal-800 underline"}
                    >
                      {p.nom}
                    </a>
                  )}
                </li>
              ))}
            </ul>
          ) : null}
        </li>
      ))}
    </ul>
  );
}
