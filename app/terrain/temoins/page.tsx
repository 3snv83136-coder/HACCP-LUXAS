"use client";

import { useState } from "react";
import { nanoid } from "nanoid";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useTerrain } from "@/components/terrain/terrain-provider";
import { destructionPlatTemoin } from "@/lib/conformity";
import { enqueueGeneric } from "@/lib/offline/sync";

export default function TemoinsPage() {
  const { session, bootstrap, refresh } = useTerrain();
  const [plat, setPlat] = useState("");
  const [saving, setSaving] = useState(false);

  async function enregistrer() {
    setSaving(true);
    const service = new Date();
    const dest = destructionPlatTemoin(service, bootstrap.params);
    const clientUuid = nanoid();
    await enqueueGeneric("plat_temoin", clientUuid, {
      clientUuid,
      etablissementId: session.etablissementId,
      codeOperateurId: session.codeOperateurId,
      plat,
      serviceDate: service.toISOString(),
      destructionPrevue: dest.toISOString(),
    });
    bootstrap.platsTemoins.unshift({
      id: clientUuid,
      plat,
      serviceDate: service.toISOString(),
      destructionPrevue: dest.toISOString(),
      detruitAt: null,
    });
    setPlat("");
    await refresh();
    setSaving(false);
  }

  async function detruire(id: string) {
    await enqueueGeneric("plat_temoin_destruction", nanoid(), { id });
    await refresh();
  }

  return (
    <div className="space-y-4 pb-10">
      <h1 className="text-2xl font-semibold text-white">Plats témoins</h1>
      <p className="text-sm text-white/55">
        Conservation selon le PMS (paramètre PLAT_TEMOIN_JOURS), portions ~80–100 g, ≤ seuil froid.
      </p>
      <label className="block space-y-2">
        <Label>Plat du service</Label>
        <Input value={plat} onChange={(e) => setPlat(e.target.value)} placeholder="Ex. daube de bœuf" />
      </label>
      <Button className="w-full" size="lg" disabled={!plat || saving} onClick={() => void enregistrer()}>
        Enregistrer le témoin
      </Button>
      <div className="space-y-2">
        {bootstrap.platsTemoins.map((p) => {
          const due = !p.detruitAt && new Date(p.destructionPrevue) <= new Date();
          return (
            <article key={p.id} className="rounded-3xl border border-white/10 bg-white/[0.04] p-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-semibold text-white">{p.plat}</p>
                  <p className="text-xs text-white/45">
                    Service {new Date(p.serviceDate).toLocaleString("fr-FR")} · destruction{" "}
                    {new Date(p.destructionPrevue).toLocaleDateString("fr-FR")}
                  </p>
                </div>
                <Badge variant={p.detruitAt ? "ok" : due ? "warn" : "info"}>
                  {p.detruitAt ? "Détruit" : due ? "À détruire" : "En cours"}
                </Badge>
              </div>
              {!p.detruitAt ? (
                <Button className="mt-3 w-full" variant="outline" onClick={() => void detruire(p.id)}>
                  Marquer détruit
                </Button>
              ) : null}
            </article>
          );
        })}
      </div>
    </div>
  );
}
