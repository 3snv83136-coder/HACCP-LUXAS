import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyCode } from "@/lib/crypto";

export async function POST(request: Request) {
  const body = (await request.json()) as { code?: string; etablissementId?: string };
  const code = (body.code ?? "").trim();
  if (!/^\d{4}$/.test(code)) {
    return NextResponse.json({ error: "Code à 4 chiffres requis" }, { status: 400 });
  }

  const etab = body.etablissementId
    ? await prisma.etablissement.findUnique({ where: { id: body.etablissementId } })
    : await prisma.etablissement.findFirst();

  if (!etab) {
    return NextResponse.json({ error: "Établissement introuvable" }, { status: 404 });
  }

  const codes = await prisma.codeOperateur.findMany({
    where: {
      actif: true,
      membre: { actif: true, etablissementId: etab.id },
    },
    include: { membre: { include: { utilisateur: true } } },
  });

  for (const row of codes) {
    if (await verifyCode(code, row.codeHash)) {
      const u = row.membre.utilisateur;
      return NextResponse.json({
        session: {
          etablissementId: etab.id,
          etablissementNom: etab.nom,
          organisationId: etab.organisationId,
          membreId: row.membre.id,
          utilisateurId: u.id,
          codeOperateurId: row.id,
          nom: u.nom,
          prenom: u.prenom,
          role: row.membre.role,
          signedAt: new Date().toISOString(),
        },
      });
    }
  }

  return NextResponse.json({ error: "Code incorrect" }, { status: 401 });
}
