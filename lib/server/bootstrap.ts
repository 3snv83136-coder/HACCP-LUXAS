import { prisma } from "@/lib/db";
import type { BootstrapPayload, ReleveLocal } from "@/lib/types";
import { resolveEtablissement } from "@/lib/server/etab";

export async function getBootstrap(etablissementId?: string): Promise<BootstrapPayload> {
  const etab = await resolveEtablissement(etablissementId);
  if (!etab) {
    throw new Error("Aucun établissement. Lance `npx prisma db seed`.");
  }

  const since = new Date(Date.now() - 48 * 3600 * 1000);

  const [
    paramsRows,
    equipements,
    points,
    taches,
    checklists,
    releves,
    executions,
    checklistExecs,
    plats,
    huiles,
    ncCount,
    plans,
  ] = await Promise.all([
    prisma.parametre.findMany({ where: { organisationId: etab.organisationId } }),
    prisma.equipement.findMany({
      where: { etablissementId: etab.id, actif: true },
      orderBy: { nom: "asc" },
    }),
    prisma.pointControle.findMany({
      where: { etablissementId: etab.id, actif: true },
      orderBy: { libelle: "asc" },
    }),
    prisma.tacheNettoyage.findMany({
      where: { etablissementId: etab.id, actif: true },
      include: { produit: true },
      orderBy: { zone: "asc" },
    }),
    prisma.checklist.findMany({
      where: { etablissementId: etab.id, actif: true },
      include: { items: { orderBy: { ordre: "asc" } } },
    }),
    prisma.releveTemperature.findMany({
      where: { etablissementId: etab.id, createdAt: { gte: since } },
      include: {
        codeOperateur: { include: { membre: { include: { utilisateur: true } } } },
      },
      orderBy: { createdAt: "desc" },
      take: 200,
    }),
    prisma.executionNettoyage.findMany({
      where: { etablissementId: etab.id, faitAt: { gte: new Date(Date.now() - 14 * 24 * 3600 * 1000) } },
      select: { tacheNettoyageId: true, faitAt: true },
    }),
    prisma.checklistExecution.findMany({
      where: { checklist: { etablissementId: etab.id }, createdAt: { gte: since } },
      select: { checklistId: true, createdAt: true, codeOperateurId: true },
    }),
    prisma.platTemoin.findMany({
      where: { etablissementId: etab.id, createdAt: { gte: new Date(Date.now() - 10 * 24 * 3600 * 1000) } },
      orderBy: { serviceDate: "desc" },
    }),
    prisma.huileFriture.findMany({
      where: { etablissementId: etab.id, actif: true },
      include: { releves: { orderBy: { createdAt: "desc" }, take: 1 } },
    }),
    prisma.nonConformite.count({
      where: { etablissementId: etab.id, statut: { not: "cloture" } },
    }),
    prisma.planFrequence.findMany({ where: { etablissementId: etab.id, actif: true } }),
  ]);

  const planByCible = new Map(plans.map((p) => [`${p.cibleType}:${p.cibleId}`, p]));
  const params: Record<string, string> = {};
  for (const p of paramsRows) params[p.cle] = p.valeur;

  const relevesRecents: ReleveLocal[] = releves.map((r) => ({
    id: r.id,
    clientUuid: r.clientUuid,
    etablissementId: r.etablissementId,
    equipementId: r.equipementId,
    pointControleId: r.pointControleId,
    valeur: r.valeur,
    conforme: r.conforme,
    methode: r.methode,
    codeOperateurId: r.codeOperateurId,
    note: r.note,
    createdAt: r.createdAt.toISOString(),
    syncStatus: "synced",
    auteurNom: `${r.codeOperateur.membre.utilisateur.prenom} ${r.codeOperateur.membre.utilisateur.nom}`,
  }));

  return {
    organisationId: etab.organisationId,
    etablissement: { id: etab.id, nom: etab.nom, adresse: etab.adresse },
    params,
    equipements: equipements.map((e) => {
      const plan = planByCible.get(`equipement:${e.id}`);
      return {
        id: e.id,
        nom: e.nom,
        type: e.type,
        qrToken: e.qrToken,
        seuilMin: e.seuilMin,
        seuilMax: e.seuilMax,
        actif: e.actif,
        frequence: plan?.frequence ?? "2x_jour",
        horaires: plan?.horaires ?? "",
      };
    }),
    pointsControle: points.map((p) => ({
      id: p.id,
      libelle: p.libelle,
      type: p.type,
      seuilMin: p.seuilMin,
      seuilMax: p.seuilMax,
      regleTemps: p.regleTemps,
      actif: p.actif,
    })),
    tachesNettoyage: taches.map((t) => ({
      id: t.id,
      zone: t.zone,
      frequence: t.frequence,
      methodeTact: t.methodeTact,
      roleResponsable: t.roleResponsable,
      produitNom: t.produit?.nom ?? null,
      produitDosage: t.produit?.dosage ?? null,
      produitDangers: t.produit?.dangers ?? null,
      actif: t.actif,
    })),
    checklists: checklists.map((c) => ({
      id: c.id,
      nom: c.nom,
      type: c.type,
      items: c.items.map((i) => ({ id: i.id, libelle: i.libelle, ordre: i.ordre })),
    })),
    relevesRecents,
    executionsNettoyage: executions.map((e) => ({
      tacheNettoyageId: e.tacheNettoyageId,
      faitAt: e.faitAt.toISOString(),
    })),
    checklistExecutions: checklistExecs.map((e) => ({
      checklistId: e.checklistId,
      createdAt: e.createdAt.toISOString(),
      codeOperateurId: e.codeOperateurId,
    })),
    platsTemoins: plats.map((p) => ({
      id: p.id,
      plat: p.plat,
      serviceDate: p.serviceDate.toISOString(),
      destructionPrevue: p.destructionPrevue.toISOString(),
      detruitAt: p.detruitAt?.toISOString() ?? null,
    })),
    huiles: huiles.map((h) => ({
      id: h.id,
      bac: h.bac,
      dernierPolaires: h.releves[0]?.composesPolaires ?? null,
      dernierAt: h.releves[0]?.createdAt.toISOString() ?? null,
    })),
    nonConformitesOuvertes: ncCount,
  };
}
