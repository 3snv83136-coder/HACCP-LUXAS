import { NextResponse } from "next/server";
import { getBootstrap } from "@/lib/server/bootstrap";
import { collecterAlertes } from "@/lib/server/alerts";
import { buildTachesDuJour } from "@/lib/tasks";
import { listEtablissements, resolveEtablissement } from "@/lib/server/etab";
import { prisma } from "@/lib/db";
import { startOfDay } from "@/lib/utils";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const etabs = await listEtablissements();
  const current = await resolveEtablissement(searchParams.get("etablissementId"));
  if (!current) return NextResponse.json({ error: "Aucun établissement" }, { status: 404 });

  const bootstrap = await getBootstrap(current.id);
  const taches = buildTachesDuJour(bootstrap, bootstrap.relevesRecents);
  const today = startOfDay();
  const alertes = await collecterAlertes(searchParams.get("etablissementId") ? current.id : undefined);

  const [receptionsToday, ncs, synthese] = await Promise.all([
    prisma.reception.count({
      where: { etablissementId: current.id, createdAt: { gte: today } },
    }),
    prisma.nonConformite.findMany({
      where: { etablissementId: current.id, statut: { not: "cloture" } },
      orderBy: { createdAt: "desc" },
      take: 8,
    }),
    Promise.all(
      etabs.map(async (e) => {
        const b = await getBootstrap(e.id);
        const t = buildTachesDuJour(b, b.relevesRecents);
        return {
          id: e.id,
          nom: e.nom,
          enRetard: t.filter((x) => x.statut === "en_retard").length,
          ncOuvertes: b.nonConformitesOuvertes,
        };
      }),
    ),
  ]);

  return NextResponse.json({
    etablissement: bootstrap.etablissement,
    etablissements: synthese,
    compteurs: {
      aFaire: taches.filter((t) => t.statut === "a_faire").length,
      enRetard: taches.filter((t) => t.statut === "en_retard").length,
      fait: taches.filter((t) => t.statut === "fait").length,
      ncOuvertes: ncs.length,
      receptionsToday,
      alertes: alertes.filter((a) => a.etablissementId === current.id).length,
    },
    taches: taches.slice(0, 12),
    nonConformites: ncs,
    alertes: alertes.slice(0, 20),
    params: bootstrap.params,
  });
}
