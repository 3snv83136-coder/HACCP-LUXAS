"use client";

import { useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { labelPlage, type PeriodeHygiene } from "@/lib/hygiene";
import { formatDateHeure, todayIsoDate } from "@/lib/utils";

type Reception = {
  id: string;
  at: string;
  produit: string;
  fournisseur: string;
  lot: string | null;
  dlc: string | null;
  temperature: number | null;
  conforme: boolean;
  auteur: string;
};

type Lot = {
  id: string;
  at: string;
  produit: string;
  type: string;
  lot: string | null;
  dlc: string;
};

type Nettoyage = {
  id: string;
  nom: string;
  dosage: string | null;
  tempsContact: string | null;
  dangers: string | null;
};

type Etab = { id: string; nom: string };

type Payload = {
  etablissement: Etab;
  etablissements?: Etab[];
  debut: string;
  fin: string;
  receptions: Reception[];
  lots: Lot[];
  nettoyage?: Nettoyage[];
};

const periodes: { id: PeriodeHygiene; label: string }[] = [
  { id: "jour", label: "Jour" },
  { id: "semaine", label: "Semaine" },
  { id: "mois", label: "Mois" },
];

const vues = [
  { id: "tous", label: "Tous" },
  { id: "receptions", label: "Réceptions" },
  { id: "lots", label: "Lots" },
  { id: "nettoyage", label: "Nettoyage" },
] as const;

type Vue = (typeof vues)[number]["id"];

export default function ProduitsPage() {
  const [periode, setPeriode] = useState<PeriodeHygiene>("jour");
  const [date, setDate] = useState(todayIsoDate());
  const [etabId, setEtabId] = useState("");
  const [vue, setVue] = useState<Vue>("tous");
  const [filtre, setFiltre] = useState("");
  const [data, setData] = useState<Payload | null>(null);
  const [loading, setLoading] = useState(true);
  const [nouveau, setNouveau] = useState({
    produit: "",
    type: "ouverture",
    lotSource: "",
    dlcSecondaire: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    const qs = new URLSearchParams({ periode, date });
    if (etabId) qs.set("etablissementId", etabId);
    const res = await fetch(`/api/produits?${qs.toString()}`);
    const json = (await res.json()) as Payload & { error?: string };
    if (!res.ok) {
      setError(json.error ?? "Impossible de charger les produits");
      setLoading(false);
      return;
    }
    setError(null);
    setData(json);
    if (!etabId && json.etablissement?.id) setEtabId(json.etablissement.id);
    setLoading(false);
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [periode, date, etabId]);

  const q = filtre.trim().toLowerCase();
  const receptions = useMemo(
    () =>
      (data?.receptions ?? []).filter(
        (r) =>
          !q ||
          r.produit.toLowerCase().includes(q) ||
          r.fournisseur.toLowerCase().includes(q) ||
          (r.lot ?? "").toLowerCase().includes(q),
      ),
    [data, q],
  );
  const lots = useMemo(
    () =>
      (data?.lots ?? []).filter(
        (l) => !q || l.produit.toLowerCase().includes(q) || (l.lot ?? "").toLowerCase().includes(q),
      ),
    [data, q],
  );
  const nettoyage = useMemo(
    () => (data?.nettoyage ?? []).filter((p) => !q || p.nom.toLowerCase().includes(q)),
    [data, q],
  );

  async function ajouter() {
    setSaving(true);
    setError(null);
    const res = await fetch("/api/produits", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...nouveau, etablissementId: etabId || undefined }),
    });
    const json = (await res.json()) as { error?: string };
    setSaving(false);
    if (!res.ok) {
      setError(json.error ?? "Impossible d’enregistrer le lot");
      return;
    }
    setNouveau({ produit: "", type: "ouverture", lotSource: "", dlcSecondaire: "" });
    await load();
  }

  const showReceptions = vue === "tous" || vue === "receptions";
  const showLots = vue === "tous" || vue === "lots";
  const showNettoyage = vue === "tous" || vue === "nettoyage";
  const total =
    (showReceptions ? receptions.length : 0) +
    (showLots ? lots.length : 0) +
    (showNettoyage ? nettoyage.length : 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-teal-700">Traçabilité</p>
          <h1 className="mt-1 text-2xl font-semibold sm:text-3xl">Produits</h1>
          <p className="mt-1 max-w-2xl text-sm text-slate-500 sm:text-base">
            Tout ce qui entre et ce qui est étiqueté : réceptions, lots, DLC et produits d’hygiène.
            Filtre par jour, semaine ou mois.
          </p>
        </div>
        {data?.etablissements && data.etablissements.length > 1 ? (
          <label className="block text-sm text-slate-600">
            Établissement
            <select
              className="mt-1 h-11 w-full rounded-2xl border border-slate-200 bg-white px-3 sm:w-64"
              value={etabId}
              onChange={(e) => setEtabId(e.target.value)}
            >
              {data.etablissements.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.nom}
                </option>
              ))}
            </select>
          </label>
        ) : null}
      </div>

      <div className="flex flex-col gap-3 rounded-3xl border border-slate-200 bg-white p-3 sm:p-4">
        <div className="flex rounded-2xl bg-slate-100 p-1">
          {periodes.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => setPeriode(p.id)}
              className={`flex-1 rounded-xl px-2 py-2.5 text-sm font-semibold sm:px-4 ${
                periode === p.id ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <label className="flex items-center gap-2 text-sm text-slate-600">
            Date
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="h-11 min-w-0 flex-1 rounded-2xl border border-slate-200 px-3"
            />
          </label>
          <Input
            value={filtre}
            onChange={(e) => setFiltre(e.target.value)}
            placeholder="Produit, lot, fournisseur…"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {vues.map((v) => (
            <button
              key={v.id}
              type="button"
              onClick={() => setVue(v.id)}
              className={`shrink-0 rounded-full px-3 py-2 text-sm font-semibold ${
                vue === v.id ? "bg-teal-700 text-white" : "bg-slate-100 text-slate-600"
              }`}
            >
              {v.label}
            </button>
          ))}
        </div>
      </div>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      {data && !loading ? (
        <p className="text-sm text-slate-500">
          {data.etablissement.nom} · {labelPlage(periode, new Date(data.debut), new Date(data.fin))} · {total}{" "}
          produit(s)
        </p>
      ) : (
        <p className="text-slate-500">Chargement…</p>
      )}

      <form
        className="space-y-3 rounded-3xl border border-slate-200 bg-white p-4 sm:p-5"
        onSubmit={(e) => {
          e.preventDefault();
          void ajouter();
        }}
      >
        <h2 className="font-semibold">Ajouter un produit / lot</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <label className="space-y-1.5">
            <Label>Produit</Label>
            <Input
              required
              value={nouveau.produit}
              onChange={(e) => setNouveau({ ...nouveau, produit: e.target.value })}
            />
          </label>
          <label className="space-y-1.5">
            <Label>Type</Label>
            <select
              className="h-12 w-full rounded-2xl border border-slate-200 px-3"
              value={nouveau.type}
              onChange={(e) => setNouveau({ ...nouveau, type: e.target.value })}
            >
              <option value="ouverture">Ouverture</option>
              <option value="decongelation">Décongélation</option>
              <option value="fabrication">Fabrication</option>
            </select>
          </label>
          <label className="space-y-1.5">
            <Label>Lot source</Label>
            <Input
              value={nouveau.lotSource}
              onChange={(e) => setNouveau({ ...nouveau, lotSource: e.target.value })}
            />
          </label>
          <label className="space-y-1.5">
            <Label>DLC secondaire</Label>
            <Input
              type="datetime-local"
              value={nouveau.dlcSecondaire}
              onChange={(e) => setNouveau({ ...nouveau, dlcSecondaire: e.target.value })}
            />
          </label>
        </div>
        <p className="text-xs text-slate-400">
          Si la DLC est vide, le délai PMS (ouverture / décongélation) est appliqué.
        </p>
        <Button className="w-full sm:w-auto" disabled={saving || !nouveau.produit}>
          {saving ? "…" : "Enregistrer le lot"}
        </Button>
      </form>

      {showReceptions ? (
        <section className="space-y-3">
          <h2 className="text-lg font-semibold">Réceptions ({receptions.length})</h2>
          {receptions.length === 0 ? (
            <p className="rounded-3xl bg-slate-50 p-4 text-sm text-slate-500">
              Aucune réception sur cette période.
            </p>
          ) : (
            receptions.map((r) => (
              <article key={r.id} className="rounded-3xl border border-slate-200 bg-white p-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-semibold">{r.produit}</p>
                    <p className="text-sm text-slate-500">
                      {r.fournisseur}
                      {r.lot ? ` · lot ${r.lot}` : ""}
                      {r.dlc ? ` · DLC ${r.dlc}` : ""}
                    </p>
                    <p className="mt-1 text-xs text-slate-400">
                      {formatDateHeure(r.at)} · {r.auteur}
                      {r.temperature != null ? ` · ${r.temperature} °C` : ""}
                    </p>
                  </div>
                  <Badge variant={r.conforme ? "ok" : "nok"}>{r.conforme ? "Conforme" : "NOK"}</Badge>
                </div>
              </article>
            ))
          )}
        </section>
      ) : null}

      {showLots ? (
        <section className="space-y-3">
          <h2 className="text-lg font-semibold">Lots & DLC secondaires ({lots.length})</h2>
          {lots.length === 0 ? (
            <p className="rounded-3xl bg-slate-50 p-4 text-sm text-slate-500">Aucun lot sur cette période.</p>
          ) : (
            lots.map((l) => {
              const perime = new Date(l.dlc) < new Date();
              return (
                <article key={l.id} className="rounded-3xl border border-slate-200 bg-white p-4">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-semibold">{l.produit}</p>
                      <p className="text-sm text-slate-500">
                        {l.type}
                        {l.lot ? ` · source ${l.lot}` : ""} · DLC {new Date(l.dlc).toLocaleString("fr-FR")}
                      </p>
                      <p className="mt-1 text-xs text-slate-400">{formatDateHeure(l.at)}</p>
                    </div>
                    <Badge variant={perime ? "nok" : "ok"}>{perime ? "DLC dépassée" : "En cours"}</Badge>
                  </div>
                </article>
              );
            })
          )}
        </section>
      ) : null}

      {showNettoyage ? (
        <section className="space-y-3">
          <h2 className="text-lg font-semibold">Produits d’hygiène ({nettoyage.length})</h2>
          {nettoyage.length === 0 ? (
            <p className="rounded-3xl bg-slate-50 p-4 text-sm text-slate-500">Aucun produit de nettoyage.</p>
          ) : (
            nettoyage.map((p) => (
              <article key={p.id} className="rounded-3xl border border-slate-200 bg-white p-4">
                <p className="font-semibold">{p.nom}</p>
                <p className="text-sm text-slate-500">
                  {p.dosage ? `Dosage ${p.dosage}` : "Dosage à renseigner"}
                  {p.tempsContact ? ` · contact ${p.tempsContact}` : ""}
                </p>
                {p.dangers ? <p className="mt-1 text-xs text-amber-700">{p.dangers}</p> : null}
              </article>
            ))
          )}
        </section>
      ) : null}
    </div>
  );
}
