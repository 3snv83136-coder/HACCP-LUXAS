import {
  creneauCourant,
  isCreneauEnRetard,
  type CreneauReleve,
} from "@/lib/conformity";
import type { BootstrapPayload, ReleveLocal, TacheDuJour } from "@/lib/types";
import { startOfDay } from "@/lib/utils";

function releveDuCreneau(
  releves: ReleveLocal[],
  equipementId: string,
  creneau: CreneauReleve,
  now: Date,
): ReleveLocal | undefined {
  const start = startOfDay(now).getTime();
  const noon = new Date(now);
  noon.setHours(12, 0, 0, 0);
  const split = noon.getTime();
  return releves.find((r) => {
    if (r.equipementId !== equipementId) return false;
    const t = new Date(r.createdAt).getTime();
    if (t < start) return false;
    return creneau === "matin" ? t < split : t >= split;
  });
}

export function buildTachesDuJour(
  data: BootstrapPayload,
  releves: ReleveLocal[],
  now = new Date(),
): TacheDuJour[] {
  const creneau = creneauCourant(data.params, now);
  const retard = isCreneauEnRetard(creneau, data.params, now);
  const taches: TacheDuJour[] = [];

  for (const eq of data.equipements.filter((e) => e.actif)) {
    const last = releveDuCreneau(releves, eq.id, creneau, now);
    const statut = last ? "fait" : retard ? "en_retard" : "a_faire";
    taches.push({
      id: `eq-${eq.id}-${creneau}`,
      kind: "releve",
      titre: eq.nom,
      sousTitre: `${eq.type} · ${creneau} · ${eq.seuilMax != null ? `≤ ${eq.seuilMax} °C` : "seuil PMS"}`,
      creneau,
      statut,
      href: `/terrain/releve/${eq.qrToken}`,
      lastValue: last?.valeur ?? null,
      lastAt: last?.createdAt ?? null,
      conforme: last?.conforme ?? null,
    });
  }

  for (const pt of data.pointsControle.filter((p) => p.actif)) {
    const last = releves.find(
      (r) =>
        r.pointControleId === pt.id &&
        new Date(r.createdAt).getTime() >= startOfDay(now).getTime(),
    );
    taches.push({
      id: `pt-${pt.id}`,
      kind: "process",
      titre: pt.libelle,
      sousTitre: pt.type.replaceAll("_", " "),
      statut: last ? "fait" : "a_faire",
      href: `/terrain/releve/process-${pt.id}`,
      lastValue: last?.valeur ?? null,
      lastAt: last?.createdAt ?? null,
      conforme: last?.conforme ?? null,
    });
  }

  const todayStart = startOfDay(now).getTime();
  const weekStart = todayStart - 6 * 24 * 3600 * 1000;
  for (const tache of data.tachesNettoyage.filter((t) => t.actif)) {
    const windowStart = tache.frequence === "hebdo" || tache.frequence === "mensuel" ? weekStart : todayStart;
    const done = data.executionsNettoyage.some(
      (e) => e.tacheNettoyageId === tache.id && new Date(e.faitAt).getTime() >= windowStart,
    );
    const quotidien = tache.frequence === "quotidien" || tache.frequence === "par_service";
    taches.push({
      id: `mn-${tache.id}`,
      kind: "menage",
      titre: tache.zone,
      sousTitre: `${tache.frequence} · ${tache.produitNom ?? "sans produit"}`,
      statut: done ? "fait" : retard && quotidien ? "en_retard" : "a_faire",
      href: `/terrain/menage?tache=${tache.id}`,
    });
  }

  for (const cl of data.checklists) {
    const done = data.checklistExecutions.some(
      (e) => e.checklistId === cl.id && new Date(e.createdAt).getTime() >= todayStart,
    );
    const pertinente =
      cl.type === "ouverture" ? creneau === "matin" || done : cl.type === "fermeture" ? creneau === "soir" || done : true;
    if (!pertinente && !done) continue;
    taches.push({
      id: `cl-${cl.id}`,
      kind: "checklist",
      titre: cl.nom,
      sousTitre: cl.type,
      statut: done ? "fait" : retard ? "en_retard" : "a_faire",
      href: `/terrain/menage?checklist=${cl.id}`,
    });
  }

  const order = { en_retard: 0, a_faire: 1, fait: 2 };
  return taches.sort((a, b) => order[a.statut] - order[b.statut]);
}
