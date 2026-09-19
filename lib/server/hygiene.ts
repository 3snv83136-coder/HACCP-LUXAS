import { prisma } from "@/lib/db";
import { plageHygiene, type PeriodeHygiene } from "@/lib/hygiene";
import { resolveEtablissement } from "@/lib/server/etab";

export async function dossierHygiene(periode: PeriodeHygiene, dateRef: Date, etablissementId?: string) {
  const etab = await resolveEtablissement(etablissementId);
  if (!etab) throw new Error("Établissement introuvable");
  const { start, end } = plageHygiene(periode, dateRef);
  const range = { gte: start, lte: end };

  const [releves, menages, receptions, ncs, plats, huiles, checklists, lots, formations] =
    await Promise.all([
      prisma.releveTemperature.findMany({
        where: { etablissementId: etab.id, createdAt: range },
        include: {
          equipement: true,
          pointControle: true,
          codeOperateur: { include: { membre: { include: { utilisateur: true } } } },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.executionNettoyage.findMany({
        where: { etablissementId: etab.id, faitAt: range },
        include: {
          tache: true,
          codeOperateur: { include: { membre: { include: { utilisateur: true } } } },
        },
        orderBy: { faitAt: "desc" },
      }),
      prisma.reception.findMany({
        where: { etablissementId: etab.id, createdAt: range },
        include: { codeOperateur: { include: { membre: { include: { utilisateur: true } } } } },
        orderBy: { createdAt: "desc" },
      }),
      prisma.nonConformite.findMany({
        where: { etablissementId: etab.id, createdAt: range },
        orderBy: { createdAt: "desc" },
      }),
      prisma.platTemoin.findMany({
        where: { etablissementId: etab.id, createdAt: range },
        include: { codeOperateur: { include: { membre: { include: { utilisateur: true } } } } },
        orderBy: { serviceDate: "desc" },
      }),
      prisma.releveHuile.findMany({
        where: { createdAt: range, huile: { etablissementId: etab.id } },
        include: {
          huile: true,
          codeOperateur: { include: { membre: { include: { utilisateur: true } } } },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.checklistExecution.findMany({
        where: { createdAt: range, checklist: { etablissementId: etab.id } },
        include: {
          checklist: true,
          codeOperateur: { include: { membre: { include: { utilisateur: true } } } },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.lotProduit.findMany({
        where: { etablissementId: etab.id, createdAt: range },
        orderBy: { dlcSecondaire: "asc" },
      }),
      prisma.formation.findMany({
        where: { membre: { etablissementId: etab.id } },
        include: { membre: { include: { utilisateur: true } } },
        orderBy: { expireLe: "asc" },
      }),
    ]);

  const auteur = (row: {
    codeOperateur?: { membre: { utilisateur: { prenom: string; nom: string } } } | null;
  }) =>
    row.codeOperateur
      ? `${row.codeOperateur.membre.utilisateur.prenom} ${row.codeOperateur.membre.utilisateur.nom}`
      : "—";

  const nok = releves.filter((r) => !r.conforme).length;
  const ncOuvertes = ncs.filter((n) => n.statut !== "cloture").length;
  const receptionsNok = receptions.filter((r) => !r.conforme).length;
  const now = Date.now();
  const formationsARenouveler = formations.filter(
    (f) => f.expireLe && f.expireLe.getTime() - now < 90 * 24 * 3600 * 1000,
  ).length;

  const pointsAMontrer = nok + ncOuvertes + receptionsNok + formationsARenouveler;

  return {
    etablissement: { id: etab.id, nom: etab.nom },
    periode,
    debut: start.toISOString(),
    fin: end.toISOString(),
    pret: pointsAMontrer === 0,
    compteurs: {
      releves: releves.length,
      relevesNok: nok,
      menages: menages.length,
      receptions: receptions.length,
      receptionsNok,
      nc: ncs.length,
      ncOuvertes,
      plats: plats.length,
      huiles: huiles.length,
      checklists: checklists.length,
      lots: lots.length,
      formationsARenouveler,
    },
    releves: releves.map((r) => ({
      id: r.id,
      at: r.createdAt.toISOString(),
      cible: r.equipement?.nom ?? r.pointControle?.libelle ?? "Point de contrôle",
      valeur: r.valeur,
      conforme: r.conforme,
      auteur: auteur(r),
    })),
    menages: menages.map((m) => ({
      id: m.id,
      at: m.faitAt.toISOString(),
      zone: m.tache.zone,
      auteur: auteur(m),
    })),
    receptions: receptions.map((r) => ({
      id: r.id,
      at: r.createdAt.toISOString(),
      fournisseur: r.fournisseur,
      produit: r.produit,
      conforme: r.conforme,
      temperature: r.temperature,
      auteur: auteur(r),
    })),
    nonConformites: ncs.map((n) => ({
      id: n.id,
      at: n.createdAt.toISOString(),
      constat: n.constat,
      gravite: n.gravite,
      statut: n.statut,
      actionImmediate: n.actionImmediate,
    })),
    plats: plats.map((p) => ({
      id: p.id,
      plat: p.plat,
      service: p.serviceDate.toISOString(),
      destruction: p.destructionPrevue.toISOString(),
      detruit: Boolean(p.detruitAt),
      auteur: auteur(p),
    })),
    huiles: huiles.map((h) => ({
      id: h.id,
      at: h.createdAt.toISOString(),
      bac: h.huile.bac,
      polaires: h.composesPolaires,
      action: h.action,
      auteur: auteur(h),
    })),
    checklists: checklists.map((c) => ({
      id: c.id,
      at: c.createdAt.toISOString(),
      nom: c.checklist.nom,
      type: c.checklist.type,
      auteur: auteur(c),
    })),
    lots: lots.map((l) => ({
      id: l.id,
      produit: l.produit,
      type: l.type,
      dlc: l.dlcSecondaire.toISOString(),
    })),
    formations: formations.map((f) => ({
      id: f.id,
      nom: `${f.membre.utilisateur.prenom} ${f.membre.utilisateur.nom}`,
      type: f.type,
      expireLe: f.expireLe?.toISOString() ?? null,
      aRenouveler: Boolean(f.expireLe && f.expireLe.getTime() - now < 90 * 24 * 3600 * 1000),
    })),
  };
}
