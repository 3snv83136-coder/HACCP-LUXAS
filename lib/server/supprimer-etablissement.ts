import { prisma } from "@/lib/db";

export async function supprimerEtablissement(id: string) {
  const etab = await prisma.etablissement.findUnique({
    where: { id },
    include: { membres: { select: { id: true } } },
  });
  if (!etab) return { ok: false as const, error: "Établissement introuvable" };

  const membreIds = etab.membres.map((m) => m.id);
  const orgId = etab.organisationId;

  await prisma.$transaction(
    async (tx) => {
      await tx.impression.deleteMany({ where: { etablissementId: id } });
      await tx.captureEtiquette.deleteMany({ where: { etablissementId: id } });
      await tx.alerte.deleteMany({ where: { etablissementId: id } });
      await tx.auditLog.deleteMany({ where: { etablissementId: id } });
      await tx.nonConformite.deleteMany({ where: { etablissementId: id } });
      await tx.releveHuile.deleteMany({ where: { huile: { etablissementId: id } } });
      await tx.huileFriture.deleteMany({ where: { etablissementId: id } });
      await tx.checklistExecution.deleteMany({ where: { checklist: { etablissementId: id } } });
      await tx.checklistItem.deleteMany({ where: { checklist: { etablissementId: id } } });
      await tx.checklist.deleteMany({ where: { etablissementId: id } });
      await tx.executionNettoyage.deleteMany({ where: { etablissementId: id } });
      await tx.tacheNettoyage.deleteMany({ where: { etablissementId: id } });
      await tx.produitNettoyage.deleteMany({ where: { etablissementId: id } });
      await tx.platTemoin.deleteMany({ where: { etablissementId: id } });
      await tx.lotProduit.deleteMany({ where: { etablissementId: id } });
      await tx.reception.deleteMany({ where: { etablissementId: id } });
      await tx.releveTemperature.updateMany({ where: { etablissementId: id }, data: { corrigeParId: null } });
      await tx.releveTemperature.deleteMany({ where: { etablissementId: id } });
      await tx.planFrequence.deleteMany({ where: { etablissementId: id } });
      await tx.pointControle.deleteMany({ where: { etablissementId: id } });
      await tx.equipement.deleteMany({ where: { etablissementId: id } });
      if (membreIds.length > 0) {
        await tx.formation.deleteMany({ where: { membreEtablissementId: { in: membreIds } } });
        await tx.codeOperateur.deleteMany({ where: { membreEtablissementId: { in: membreIds } } });
      }
      await tx.nuisiblesPassage.deleteMany({ where: { etablissementId: id } });
      await tx.documentPms.deleteMany({ where: { etablissementId: id } });
      await tx.membreEtablissement.deleteMany({ where: { etablissementId: id } });
      await tx.etablissement.delete({ where: { id } });

      const restants = await tx.etablissement.count({ where: { organisationId: orgId } });
      if (restants === 0) {
        await tx.utilisateur.deleteMany({ where: { organisationId: orgId } });
        await tx.parametre.deleteMany({ where: { organisationId: orgId } });
        await tx.organisation.delete({ where: { id: orgId } });
      }
    },
    { timeout: 30_000 },
  );

  return { ok: true as const, nom: etab.nom };
}
