import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const etab = await prisma.etablissement.findFirst({ orderBy: { createdAt: "asc" } });
  if (!etab) {
    return NextResponse.json({ error: "Aucun établissement. Lance le seed." }, { status: 404 });
  }

  const code =
    (await prisma.codeOperateur.findFirst({
      where: {
        actif: true,
        membre: { actif: true, etablissementId: etab.id, role: "operateur" },
      },
      include: { membre: { include: { utilisateur: true } } },
    })) ??
    (await prisma.codeOperateur.findFirst({
      where: { actif: true, membre: { actif: true, etablissementId: etab.id } },
      include: { membre: { include: { utilisateur: true } } },
    }));

  if (!code) {
    return NextResponse.json({ error: "Aucun opérateur de formation" }, { status: 404 });
  }

  const u = code.membre.utilisateur;
  return NextResponse.json({
    session: {
      etablissementId: etab.id,
      etablissementNom: etab.nom,
      organisationId: etab.organisationId,
      membreId: code.membre.id,
      utilisateurId: u.id,
      codeOperateurId: code.id,
      nom: u.nom,
      prenom: u.prenom,
      role: code.membre.role,
      signedAt: new Date().toISOString(),
    },
  });
}
