import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { hashCode, verifyCode } from "@/lib/crypto";
import { SESSION_COOKIE, signSession } from "@/lib/auth/session";
import { optionsCookieAuth } from "@/lib/auth/cookie";
import { trouverEtablissement } from "@/lib/server/etab";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const ADMIN = new Set(["responsable", "gerant"]);

export async function POST(request: Request) {
  const body = (await request.json()) as {
    email?: string;
    motDePasse?: string;
    identifiant?: string;
    code?: string;
  };
  const email = (body.email ?? "").trim().toLowerCase();
  const motDePasse = body.motDePasse ?? "";
  const identifiant = (body.identifiant ?? email).trim();
  const code = (body.code ?? "").replace(/\D/g, "").slice(0, 4);

  if (!email || motDePasse.length < 8 || !/^\d{4}$/.test(code)) {
    return NextResponse.json(
      { error: "E-mail, code PIN à 4 chiffres et mot de passe (8 caractères) requis" },
      { status: 400 },
    );
  }

  const etab = await trouverEtablissement(identifiant);
  if (!etab) {
    return NextResponse.json({ error: "Établissement introuvable" }, { status: 404 });
  }

  const codes = await prisma.codeOperateur.findMany({
    where: { actif: true, membre: { actif: true, etablissementId: etab.id } },
    include: { membre: { include: { utilisateur: true } } },
  });

  for (const row of codes) {
    if (!(await verifyCode(code, row.codeHash))) continue;
    if (!ADMIN.has(row.membre.role)) continue;
    const u = row.membre.utilisateur;
    const emailOk = (u.email ?? etab.email ?? "").toLowerCase() === email;
    if (!emailOk) {
      return NextResponse.json({ error: "Cet e-mail ne correspond pas au compte gérant" }, { status: 403 });
    }

    await prisma.utilisateur.update({
      where: { id: u.id },
      data: { email, motDePasseHash: await hashCode(motDePasse) },
    });

    const token = await signSession({
      membreId: row.membre.id,
      utilisateurId: u.id,
      codeOperateurId: row.id,
      etablissementId: etab.id,
      role: row.membre.role,
      prenom: u.prenom,
      nom: u.nom,
    });
    const res = NextResponse.json({ ok: true, slug: etab.slug });
    res.cookies.set(SESSION_COOKIE, token, optionsCookieAuth());
    return res;
  }

  return NextResponse.json({ error: "Code administrateur incorrect" }, { status: 401 });
}
