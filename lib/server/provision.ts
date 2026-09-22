import { prisma } from "@/lib/db";
import { PARAM_KEYS, SEED_PARAMETRES } from "@/lib/params";

export async function provisionnerEtablissement(etabId: string, organisationId: string) {
  const exist = await prisma.parametre.count({ where: { organisationId } });
  if (exist === 0) {
    await prisma.parametre.createMany({
      data: Object.entries(SEED_PARAMETRES).map(([cle, valeur]) => ({
        organisationId,
        cle,
        valeur,
      })),
    });
  }

  const froid = Number(SEED_PARAMETRES[PARAM_KEYS.TEMP_FROID_POSITIF]);
  await prisma.equipement.create({
    data: {
      etablissementId: etabId,
      nom: "Frigo positif 1",
      type: "froid_positif",
      qrToken: `frigo-${etabId.slice(-6)}`,
      seuilMax: froid,
    },
  });
  await prisma.huileFriture.create({
    data: { etablissementId: etabId, bac: "Friteuse 1" },
  });
  await prisma.tacheNettoyage.create({
    data: {
      etablissementId: etabId,
      zone: "Plan de travail",
      frequence: "quotidien",
      methodeTact: "T.A.C.T. — nettoyer, rincer, désinfecter, sécher",
      roleResponsable: "operateur",
    },
  });
  await prisma.checklist.create({
    data: {
      etablissementId: etabId,
      nom: "Ouverture cuisine",
      type: "ouverture",
      items: {
        create: [
          { libelle: "Lavage des mains + tenue propre", ordre: 1 },
          { libelle: "Contrôle visuel des enceintes froides", ordre: 2 },
          { libelle: "Relevés T° du matin", ordre: 3 },
          { libelle: "DLC secondaires vérifiées", ordre: 4 },
        ],
      },
    },
  });
  await prisma.checklist.create({
    data: {
      etablissementId: etabId,
      nom: "Fermeture cuisine",
      type: "fermeture",
      items: {
        create: [
          { libelle: "Relevés T° du soir", ordre: 1 },
          { libelle: "Plats témoins étiquetés", ordre: 2 },
          { libelle: "Nettoyage de fin de service", ordre: 3 },
          { libelle: "Locaux fermés / poubelles vidées", ordre: 4 },
        ],
      },
    },
  });
}
