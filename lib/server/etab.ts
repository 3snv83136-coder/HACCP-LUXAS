import { prisma } from "@/lib/db";

export async function resolveEtablissement(etablissementId?: string | null) {
  if (etablissementId) {
    const found = await prisma.etablissement.findUnique({ where: { id: etablissementId } });
    if (found) return found;
  }
  return prisma.etablissement.findFirst({ orderBy: { createdAt: "asc" } });
}

export async function listEtablissements() {
  return prisma.etablissement.findMany({
    where: { actif: true },
    orderBy: { nom: "asc" },
    include: { organisation: true },
  });
}
