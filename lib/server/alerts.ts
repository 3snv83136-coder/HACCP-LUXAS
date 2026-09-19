import { prisma } from "@/lib/db";
import { getBootstrap } from "@/lib/server/bootstrap";
import { pousserAlerte } from "@/lib/server/notify";
import { buildTachesDuJour } from "@/lib/tasks";
import { PARAM_KEYS, requireParamNumber } from "@/lib/params";
import { startOfDay } from "@/lib/utils";
import { listEtablissements } from "@/lib/server/etab";

export type AlerteVue = {
  type: string;
  gravite: "info" | "warn" | "haute";
  message: string;
  href: string;
  etablissementId: string;
  etablissementNom: string;
};

export async function declarerRetardsMenage(etablissementId: string) {
  const bootstrap = await getBootstrap(etablissementId);
  const taches = buildTachesDuJour(bootstrap, bootstrap.relevesRecents);
  const today = startOfDay();
  let created = 0;

  for (const tache of taches.filter((t) => t.kind === "menage" && t.statut === "en_retard")) {
    const sourceId = tache.id.replace("mn-", "");
    const existing = await prisma.nonConformite.findFirst({
      where: {
        etablissementId,
        source: "nettoyage",
        sourceId,
        createdAt: { gte: today },
      },
    });
    if (existing) continue;
    await prisma.nonConformite.create({
      data: {
        etablissementId,
        source: "nettoyage",
        sourceId,
        constat: `Tâche de ménage en retard : ${tache.titre}.`,
        gravite: "moyenne",
        statut: "ouvert",
      },
    });
    await pousserAlerte({
      etablissementId,
      type: "menage_retard",
      message: `Ménage en retard — ${tache.titre}`,
    });
    created += 1;
  }
  return created;
}

export async function collecterAlertes(etablissementId?: string): Promise<AlerteVue[]> {
  const etabs = etablissementId
    ? [(await prisma.etablissement.findUnique({ where: { id: etablissementId } }))].filter(
        (e): e is NonNullable<typeof e> => Boolean(e),
      )
    : await listEtablissements();

  const out: AlerteVue[] = [];

  for (const etab of etabs) {
    await declarerRetardsMenage(etab.id);
    const bootstrap = await getBootstrap(etab.id);
    const taches = buildTachesDuJour(bootstrap, bootstrap.relevesRecents);

    for (const t of taches.filter((x) => x.statut === "en_retard")) {
      out.push({
        type: t.kind === "menage" ? "menage_retard" : "releve_oublie",
        gravite: "haute",
        message: `${t.titre} — ${t.sousTitre}`,
        href: t.href,
        etablissementId: etab.id,
        etablissementNom: etab.nom,
      });
    }

    const ncs = await prisma.nonConformite.count({
      where: { etablissementId: etab.id, statut: "ouvert" },
    });
    if (ncs > 0) {
      out.push({
        type: "nc_ouverte",
        gravite: "warn",
        message: `${ncs} non-conformité(s) ouverte(s)`,
        href: "/backoffice/non-conformites",
        etablissementId: etab.id,
        etablissementNom: etab.nom,
      });
    }

    const now = new Date();
    for (const plat of bootstrap.platsTemoins.filter((p) => !p.detruitAt)) {
      if (new Date(plat.destructionPrevue) <= now) {
        out.push({
          type: "plat_temoin",
          gravite: "warn",
          message: `Plat témoin à détruire : ${plat.plat}`,
          href: "/terrain/temoins",
          etablissementId: etab.id,
          etablissementNom: etab.nom,
        });
      }
    }

    const lots = await prisma.lotProduit.findMany({
      where: { etablissementId: etab.id, dlcSecondaire: { lte: new Date(Date.now() + 12 * 3600 * 1000) } },
      take: 8,
    });
    for (const lot of lots) {
      if (lot.dlcSecondaire < now) {
        out.push({
          type: "dlc",
          gravite: "haute",
          message: `DLC secondaire dépassée — ${lot.produit}`,
          href: "/backoffice/tracabilite",
          etablissementId: etab.id,
          etablissementNom: etab.nom,
        });
      }
    }

    const jours = requireParamNumber(bootstrap.params, PARAM_KEYS.FORMATION_ALERTE_JOURS);
    const limite = new Date(Date.now() + jours * 24 * 3600 * 1000);
    const formations = await prisma.formation.findMany({
      where: {
        membre: { etablissementId: etab.id },
        expireLe: { lte: limite, gte: now },
      },
      include: { membre: { include: { utilisateur: true } } },
    });
    for (const f of formations) {
      out.push({
        type: "formation",
        gravite: "warn",
        message: `Recyclage ${f.type.replaceAll("_", " ")} — ${f.membre.utilisateur.prenom} ${f.membre.utilisateur.nom}`,
        href: "/backoffice/formations",
        etablissementId: etab.id,
        etablissementNom: etab.nom,
      });
    }

    const seuilHuile = requireParamNumber(bootstrap.params, PARAM_KEYS.HUILE_COMPOSES_POLAIRES_MAX);
    for (const h of bootstrap.huiles) {
      if (h.dernierPolaires != null && h.dernierPolaires >= seuilHuile) {
        out.push({
          type: "huile",
          gravite: "haute",
          message: `${h.bac} : ${h.dernierPolaires} % de composés polaires (seuil ${seuilHuile} %)`,
          href: "/terrain/huile",
          etablissementId: etab.id,
          etablissementNom: etab.nom,
        });
      }
    }
  }

  return out;
}
