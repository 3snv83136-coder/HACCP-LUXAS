import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { sessionDepuisRequete } from "@/lib/server/session-request";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: Request) {
  const session = await sessionDepuisRequete(request);
  if (!session) return NextResponse.json({ error: "Non connecté" }, { status: 401 });
  const etab = await prisma.etablissement.findUnique({ where: { id: session.etablissementId } });
  return NextResponse.json({
    session: {
      etablissementId: session.etablissementId,
      etablissementNom: etab?.nom ?? "",
      logoUrl: etab?.logoUrl ?? null,
      organisationId: etab?.organisationId ?? "",
      membreId: session.membreId,
      utilisateurId: session.utilisateurId,
      codeOperateurId: session.codeOperateurId,
      nom: session.nom,
      prenom: session.prenom,
      role: session.role,
      signedAt: new Date().toISOString(),
    },
  });
}
