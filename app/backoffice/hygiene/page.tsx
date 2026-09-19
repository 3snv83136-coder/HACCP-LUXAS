"use client";

import { useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { labelPlage, type PeriodeHygiene } from "@/lib/hygiene";
import { formatDateHeure, formatTemp, todayIsoDate } from "@/lib/utils";
import { Printer } from "lucide-react";

type Dossier = {
  etablissement: { id: string; nom: string };
  periode: PeriodeHygiene;
  debut: string;
  fin: string;
  pret: boolean;
  compteurs: {
    releves: number;
    relevesNok: number;
    menages: number;
    receptions: number;
    receptionsNok: number;
    nc: number;
    ncOuvertes: number;
    plats: number;
    huiles: number;
    checklists: number;
    lots: number;
    formationsARenouveler: number;
  };
  releves: { id: string; at: string; cible: string; valeur: number; conforme: boolean; auteur: string }[];
  menages: { id: string; at: string; zone: string; auteur: string }[];
  receptions: {
    id: string;
    at: string;
    fournisseur: string;
    produit: string;
    conforme: boolean;
    temperature: number | null;
    auteur: string;
  }[];
  nonConformites: {
    id: string;
    at: string;
    constat: string;
    gravite: string;
    statut: string;
    actionImmediate: string | null;
  }[];
  plats: {
    id: string;
    plat: string;
    service: string;
    destruction: string;
    detruit: boolean;
    auteur: string;
  }[];
  huiles: {
    id: string;
    at: string;
    bac: string;
    polaires: number;
    action: string;
    auteur: string;
  }[];
  checklists: { id: string; at: string; nom: string; type: string; auteur: string }[];
  lots: { id: string; produit: string; type: string; dlc: string }[];
  formations: { id: string; nom: string; type: string; expireLe: string | null; aRenouveler: boolean }[];
};

const periodes: { id: PeriodeHygiene; label: string; hint: string }[] = [
  { id: "jour", label: "Jour", hint: "La journée" },
  { id: "semaine", label: "Semaine", hint: "Lundi → dimanche" },
  { id: "mois", label: "Mois", hint: "Mois calendaire" },
];

export default function HygienePage() {
  const [periode, setPeriode] = useState<PeriodeHygiene>("jour");
  const [date, setDate] = useState(todayIsoDate());
  const [data, setData] = useState<Dossier | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    void fetch(`/api/hygiene?periode=${periode}&date=${date}`)
      .then((r) => r.json())
      .then((d: Dossier) => setData(d))
      .finally(() => setLoading(false));
  }, [periode, date]);

  const joursPdf = useMemo(() => {
    if (periode === "jour") return 1;
    if (periode === "semaine") return 7;
    return 31;
  }, [periode]);

  return (
    <div className="space-y-6 pb-24 lg:pb-16 print:pb-0">
      <div className="flex flex-wrap items-end justify-between gap-4 print:hidden">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-teal-700">
            Contrôle officiel
          </p>
          <h1 className="mt-1 text-3xl font-semibold">Récap hygiène</h1>
          <p className="mt-1 max-w-xl text-slate-500">
            Ce que l’inspecteur demandera : températures, ménage, réceptions, non-conformités,
            témoins, huiles, traçabilité et formations.
          </p>
        </div>
        <div className="flex gap-2">
          <a
            href={`/api/export-pdf?jours=${joursPdf}`}
            className="inline-flex h-11 items-center rounded-2xl bg-teal-700 px-4 text-sm font-semibold text-white"
          >
            PDF DDPP
          </a>
          <Button variant="outline" onClick={() => window.print()}>
            <Printer className="h-4 w-4" /> Imprimer
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-3 rounded-3xl border border-slate-200 bg-white p-3 sm:p-4 print:hidden">
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
        <label className="flex items-center gap-2 text-sm text-slate-600">
          Date
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="h-11 min-w-0 flex-1 rounded-2xl border border-slate-200 px-3"
          />
        </label>
      </div>

      {loading || !data ? (
        <p className="text-slate-500">Chargement du dossier…</p>
      ) : (
        <>
          <section
            className={`rounded-3xl p-5 ${
              data.pret ? "bg-emerald-50 text-emerald-900" : "bg-amber-50 text-amber-950"
            }`}
          >
            <p className="text-sm font-semibold uppercase tracking-wide">
              {data.etablissement.nom} · {labelPlage(periode, new Date(data.debut), new Date(data.fin))}
            </p>
            <p className="mt-2 text-2xl font-semibold">
              {data.pret
                ? "Rien de bloquant sur la période — dossier présentable."
                : "Points à montrer à l’inspecteur (NOK, NC ou formations)."}
            </p>
          </section>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Compteur label="Relevés T°" value={data.compteurs.releves} warn={data.compteurs.relevesNok} />
            <Compteur label="Ménage signé" value={data.compteurs.menages} />
            <Compteur label="Réceptions" value={data.compteurs.receptions} warn={data.compteurs.receptionsNok} />
            <Compteur label="NC ouvertes" value={data.compteurs.ncOuvertes} warn={data.compteurs.ncOuvertes} />
          </div>

          <Bloc titre="1. Températures des enceintes" vide={data.releves.length === 0}>
            {data.releves.map((r) => (
              <Ligne
                key={r.id}
                titre={r.cible}
                detail={`${formatTemp(r.valeur)} · ${r.auteur} · ${formatDateHeure(r.at)}`}
                ok={r.conforme}
              />
            ))}
          </Bloc>

          <Bloc titre="2. Nettoyage et désinfection" vide={data.menages.length === 0}>
            {data.menages.map((m) => (
              <Ligne key={m.id} titre={m.zone} detail={`${m.auteur} · ${formatDateHeure(m.at)}`} ok />
            ))}
          </Bloc>

          <Bloc titre="3. Réception des marchandises" vide={data.receptions.length === 0}>
            {data.receptions.map((r) => (
              <Ligne
                key={r.id}
                titre={`${r.fournisseur} — ${r.produit}`}
                detail={`${r.temperature != null ? formatTemp(r.temperature) : "T° n.r."} · ${r.auteur} · ${formatDateHeure(r.at)}`}
                ok={r.conforme}
              />
            ))}
          </Bloc>

          <Bloc titre="4. Non-conformités et actions" vide={data.nonConformites.length === 0}>
            {data.nonConformites.map((n) => (
              <Ligne
                key={n.id}
                titre={n.constat}
                detail={`${n.gravite} · ${n.statut}${n.actionImmediate ? ` · ${n.actionImmediate}` : ""} · ${formatDateHeure(n.at)}`}
                ok={n.statut === "cloture"}
              />
            ))}
          </Bloc>

          <Bloc titre="5. Plats témoins" vide={data.plats.length === 0}>
            {data.plats.map((p) => (
              <Ligne
                key={p.id}
                titre={p.plat}
                detail={`Service ${formatDateHeure(p.service)} · destruction ${new Date(p.destruction).toLocaleDateString("fr-FR")} · ${p.auteur}`}
                ok={p.detruit}
              />
            ))}
          </Bloc>

          <Bloc titre="6. Huiles de friture" vide={data.huiles.length === 0}>
            {data.huiles.map((h) => (
              <Ligne
                key={h.id}
                titre={h.bac}
                detail={`${h.polaires} % · ${h.action} · ${h.auteur} · ${formatDateHeure(h.at)}`}
                ok={h.action !== "vidange"}
              />
            ))}
          </Bloc>

          <Bloc titre="7. Check-lists ouverture / fermeture" vide={data.checklists.length === 0}>
            {data.checklists.map((c) => (
              <Ligne key={c.id} titre={c.nom} detail={`${c.type} · ${c.auteur} · ${formatDateHeure(c.at)}`} ok />
            ))}
          </Bloc>

          <Bloc titre="8. Traçabilité lots / DLC secondaires" vide={data.lots.length === 0}>
            {data.lots.map((l) => (
              <Ligne
                key={l.id}
                titre={l.produit}
                detail={`${l.type} · DLC ${new Date(l.dlc).toLocaleString("fr-FR")}`}
                ok={new Date(l.dlc) > new Date()}
              />
            ))}
          </Bloc>

          <Bloc titre="9. Formations du personnel" vide={data.formations.length === 0}>
            {data.formations.map((f) => (
              <Ligne
                key={f.id}
                titre={`${f.nom} — ${f.type.replaceAll("_", " ")}`}
                detail={f.expireLe ? `expire ${new Date(f.expireLe).toLocaleDateString("fr-FR")}` : "sans date d’expiration"}
                ok={!f.aRenouveler}
              />
            ))}
          </Bloc>
        </>
      )}
    </div>
  );
}

function Compteur({ label, value, warn }: { label: string; value: number; warn?: number }) {
  return (
    <div className="rounded-3xl bg-white p-4 shadow-sm">
      <p className="text-xs uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 text-3xl font-semibold">{value}</p>
      {warn ? <p className="mt-1 text-sm text-red-700">{warn} à justifier</p> : null}
    </div>
  );
}

function Bloc({ titre, vide, children }: { titre: string; vide: boolean; children: React.ReactNode }) {
  return (
    <section className="rounded-3xl bg-white p-5 shadow-sm">
      <h2 className="text-lg font-semibold">{titre}</h2>
      {vide ? (
        <p className="mt-3 text-sm text-slate-500">Aucun enregistrement sur cette période.</p>
      ) : (
        <ul className="mt-3 divide-y divide-slate-100">{children}</ul>
      )}
    </section>
  );
}

function Ligne({ titre, detail, ok }: { titre: string; detail: string; ok: boolean }) {
  return (
    <li className="flex items-start justify-between gap-3 py-3">
      <div className="min-w-0">
        <p className="font-medium">{titre}</p>
        <p className="text-sm text-slate-500">{detail}</p>
      </div>
      <Badge variant={ok ? "ok" : "nok"}>{ok ? "OK" : "À voir"}</Badge>
    </li>
  );
}
