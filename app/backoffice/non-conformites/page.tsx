"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

type Nc = {
  id: string;
  constat: string;
  gravite: string;
  statut: string;
  source: string;
  cause: string | null;
  actionImmediate: string | null;
  actionPreventive: string | null;
  responsableId: string | null;
  createdAt: string;
};

type Membre = { id: string; role: string; utilisateur: { prenom: string; nom: string } };

const colonnes = ["ouvert", "traite", "cloture"] as const;

export default function NcKanbanPage() {
  const [items, setItems] = useState<Nc[]>([]);
  const [membres, setMembres] = useState<Membre[]>([]);
  const [openId, setOpenId] = useState<string | null>(null);

  async function load() {
    const res = await fetch("/api/non-conformites");
    const data = (await res.json()) as { items: Nc[]; membres: Membre[] };
    setItems(data.items);
    setMembres(data.membres ?? []);
  }

  useEffect(() => {
    void load();
  }, []);

  async function patch(id: string, body: Record<string, unknown>) {
    await fetch("/api/non-conformites", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, ...body }),
    });
    await load();
  }

  return (
    <div className="space-y-5 pb-16">
      <div>
        <h1 className="text-3xl font-semibold">CAPA — non-conformités</h1>
        <p className="text-slate-500">Ouvert → traité → clôturé. Cause, action immédiate, préventive, responsable.</p>
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        {colonnes.map((col) => (
          <section key={col} className="rounded-3xl bg-white p-4 shadow-sm">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
              {col === "ouvert" ? "Ouvert" : col === "traite" ? "Traité" : "Clôturé"}
            </h2>
            <div className="space-y-3">
              {items
                .filter((i) => i.statut === col)
                .map((nc) => (
                  <article key={nc.id} className="rounded-2xl border border-slate-100 p-4">
                    <p className="text-sm font-medium">{nc.constat}</p>
                    <p className="mt-1 text-xs uppercase text-slate-400">
                      {nc.source} · {nc.gravite}
                    </p>
                    {openId === nc.id ? (
                      <div className="mt-3 space-y-2">
                        <textarea
                          defaultValue={nc.cause ?? ""}
                          placeholder="Cause"
                          className="w-full rounded-xl border p-2 text-sm"
                          onBlur={(e) => void patch(nc.id, { cause: e.target.value })}
                        />
                        <textarea
                          defaultValue={nc.actionImmediate ?? ""}
                          placeholder="Action immédiate"
                          className="w-full rounded-xl border p-2 text-sm"
                          onBlur={(e) => void patch(nc.id, { actionImmediate: e.target.value })}
                        />
                        <textarea
                          defaultValue={nc.actionPreventive ?? ""}
                          placeholder="Action préventive"
                          className="w-full rounded-xl border p-2 text-sm"
                          onBlur={(e) => void patch(nc.id, { actionPreventive: e.target.value })}
                        />
                        <select
                          defaultValue={nc.responsableId ?? ""}
                          className="w-full rounded-xl border p-2 text-sm"
                          onChange={(e) => void patch(nc.id, { responsableId: e.target.value || null })}
                        >
                          <option value="">Responsable…</option>
                          {membres.map((m) => (
                            <option key={m.id} value={m.id}>
                              {m.utilisateur.prenom} {m.utilisateur.nom} ({m.role})
                            </option>
                          ))}
                        </select>
                      </div>
                    ) : null}
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Button size="sm" variant="light" onClick={() => setOpenId(openId === nc.id ? null : nc.id)}>
                        CAPA
                      </Button>
                      {col !== "cloture" ? (
                        <Button
                          size="sm"
                          variant="light"
                          onClick={() => void patch(nc.id, { statut: col === "ouvert" ? "traite" : "cloture" })}
                        >
                          {col === "ouvert" ? "Marquer traité" : "Clôturer"}
                        </Button>
                      ) : null}
                    </div>
                  </article>
                ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
