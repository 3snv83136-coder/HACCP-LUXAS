import { prisma } from "@/lib/db";
import { sessionDepuisRequete } from "@/lib/server/session-request";

export async function resolveEtablissement(etablissementId?: string | null) {
  if (etablissementId) {
    const found = await prisma.etablissement.findUnique({ where: { id: etablissementId } });
    if (found) return found;
  }
  return prisma.etablissement.findFirst({ orderBy: { createdAt: "asc" } });
}

export async function etablissementDeLaSession(request: Request, explicitId?: string | null) {
  const session = await sessionDepuisRequete(request);
  if (explicitId && session) {
    const found = await prisma.etablissement.findUnique({ where: { id: explicitId } });
    if (found && found.organisationId) {
      const current = await prisma.etablissement.findUnique({ where: { id: session.etablissementId } });
      if (found && current && found.organisationId === current.organisationId) return found;
    }
  }
  if (session?.etablissementId) {
    const own = await prisma.etablissement.findUnique({ where: { id: session.etablissementId } });
    if (own) return own;
  }
  if (explicitId) return prisma.etablissement.findUnique({ where: { id: explicitId } });
  return null;
}

export async function trouverEtablissement(identifiant: string) {
  const q = identifiant.trim();
  if (!q) return null;
  return prisma.etablissement.findFirst({
    where: {
      actif: true,
      OR: [
        { slug: q.toLowerCase() },
        { email: { equals: q, mode: "insensitive" } },
        { nom: { equals: q, mode: "insensitive" } },
      ],
    },
  });
}

export async function listEtablissements(organisationId?: string | null) {
  return prisma.etablissement.findMany({
    where: { actif: true, ...(organisationId ? { organisationId } : {}) },
    orderBy: { nom: "asc" },
    include: { organisation: true },
  });
}
