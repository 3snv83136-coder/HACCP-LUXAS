import { prisma } from "@/lib/db";
import { pousserAlerte } from "@/lib/server/notify";
import { genererDossierSanitaire } from "@/lib/server/pdf";

function cleMois(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function bornesMois(d: Date) {
  const start = new Date(d.getFullYear(), d.getMonth(), 1, 0, 0, 0, 0);
  const end = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);
  return { start, end, cle: cleMois(start) };
}

async function archiverUnMois(etablissementId: string, nom: string, mois: Date) {
  const { start, end, cle } = bornesMois(mois);
  const deja = await prisma.documentPms.findFirst({
    where: { etablissementId, categorie: "archive_mois", version: cle },
  });
  if (deja) return false;

  const nbReleves = await prisma.releveTemperature.count({
    where: { etablissementId, createdAt: { gte: start, lte: end } },
  });
  if (nbReleves === 0) return false;

  const bytes = await genererDossierSanitaire(etablissementId, start, end);
  const fichierUrl = `data:application/pdf;base64,${Buffer.from(bytes).toString("base64")}`;
  const libelle = start.toLocaleDateString("fr-FR", { month: "long", year: "numeric" });

  await prisma.documentPms.create({
    data: {
      etablissementId,
      titre: `Relevés ${libelle}`,
      categorie: "archive_mois",
      version: cle,
      fichierUrl,
    },
  });

  await prisma.releveTemperature.deleteMany({
    where: { etablissementId, createdAt: { gte: start, lte: end } },
  });

  await pousserAlerte({
    etablissementId,
    type: "cloture_mois",
    message: `Les relevés de ${libelle} ont été transférés en PDF dans le Back-office (${nom}). Les relevés extraits ont donc été supprimés.`,
  });
  return true;
}

export async function assurerClotureMensuelle(etablissementId: string) {
  const etab = await prisma.etablissement.findUnique({ where: { id: etablissementId } });
  if (!etab) return;

  const maintenant = new Date();
  const debutMoisCourant = new Date(maintenant.getFullYear(), maintenant.getMonth(), 1);
  const plusAncien = await prisma.releveTemperature.findFirst({
    where: { etablissementId, createdAt: { lt: debutMoisCourant } },
    orderBy: { createdAt: "asc" },
    select: { createdAt: true },
  });
  if (!plusAncien) return;

  let curseur = new Date(plusAncien.createdAt.getFullYear(), plusAncien.createdAt.getMonth(), 1);
  while (curseur < debutMoisCourant) {
    await archiverUnMois(etablissementId, etab.nom, curseur);
    curseur = new Date(curseur.getFullYear(), curseur.getMonth() + 1, 1);
  }
}
