import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyCode } from "@/lib/crypto";
import { SESSION_COOKIE, signSession } from "@/lib/auth/session";
import { trouverEtablissement } from "@/lib/server/etab";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: Request) {
  const body = (await request.json()) as {
    code?: string;
    etablissementId?: string;
    identifiant?: string;
  };
  const code = (body.code ?? "").replace(/\D/g, "").slice(0, 4);
  if (!/^\d{4}$/.test(code)) {
    return NextResponse.json({ error: "Code à 4 chiffres requis" }, { status: 400 });
  }

  const etab = body.identifiant
    ? await trouverEtablissement(body.identifiant)
    : body.etablissementId
      ? await prisma.etablissement.findUnique({ where: { id: body.etablissementId } })
      : null;

  if (!etab) {
    return NextResponse.json({ error: "Établissement introuvable. Indique le slug ou l’e-mail." }, { status: 404 });
  }

  const codes = await prisma.codeOperateur.findMany({
    where: { actif: true, membre: { actif: true, etablissementId: etab.id } },
    include: { membre: { include: { utilisateur: true } } },
  });

  for (const row of codes) {
    if (!(await verifyCode(code, row.codeHash))) continue;
    const u = row.membre.utilisateur;
    const session = {
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
    };
    const token = await signSession({
      membreId: row.membre.id,
      utilisateurId: u.id,
      codeOperateurId: row.id,
      etablissementId: etab.id,
      role: row.membre.role,
      prenom: u.prenom,
      nom: u.nom,
    });
    const res = NextResponse.json({ session });
    res.cookies.set(SESSION_COOKIE, token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 12,
    });
    return res;
  }

  return NextResponse.json({ error: "Code incorrect" }, { status: 401 });
}
