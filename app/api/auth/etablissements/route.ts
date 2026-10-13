import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { sessionDepuisRequete } from "@/lib/server/session-request";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: Request) {
  const session = await sessionDepuisRequete(request);
  if (!session) return NextResponse.json({ error: "Non connecté" }, { status: 401 });

  const membres = await prisma.membreEtablissement.findMany({
    where: { utilisateurId: session.utilisateurId, actif: true, etablissement: { actif: true } },
    include: { etablissement: true },
    orderBy: { etablissement: { nom: "asc" } },
  });

  return NextResponse.json({
    courantId: session.etablissementId,
    items: membres.map((m) => ({
      id: m.etablissementId,
      nom: m.etablissement.nom,
      adresse: m.etablissement.adresse,
      role: m.role,
    })),
  });
}
