import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { hashCode } from "@/lib/crypto";
import { SESSION_COOKIE, signSession } from "@/lib/auth/session";
import { slugifier } from "@/lib/slug";
import { provisionnerEtablissement } from "@/lib/server/provision";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: Request) {
  const body = (await request.json()) as {
    nomEtablissement?: string;
    adresse?: string;
    email?: string;
    telephone?: string;
    typeCuisine?: string;
    logoUrl?: string;
    prenom?: string;
    nom?: string;
    code?: string;
  };

  const nomEtablissement = (body.nomEtablissement ?? "").trim();
  const prenom = (body.prenom ?? "").trim();
  const nom = (body.nom ?? "").trim();
  const email = (body.email ?? "").trim().toLowerCase();
  const code = (body.code ?? "").replace(/\D/g, "").slice(0, 4);

  if (!nomEtablissement || !prenom || !nom || !email) {
    return NextResponse.json({ error: "Établissement, contact et e-mail requis" }, { status: 400 });
  }
  if (!/^\d{4}$/.test(code)) {
    return NextResponse.json({ error: "Choisis un code administrateur à 4 chiffres" }, { status: 400 });
  }
  if (body.logoUrl && body.logoUrl.length > 700_000) {
    return NextResponse.json({ error: "Logo trop lourd (max ~500 Ko)" }, { status: 400 });
  }

  const deja = await prisma.etablissement.findFirst({
    where: { email: { equals: email, mode: "insensitive" } },
  });
  if (deja) {
    return NextResponse.json({ error: "Un établissement utilise déjà cet e-mail" }, { status: 409 });
  }

  const org = await prisma.organisation.create({ data: { nom: nomEtablissement } });
  const etab = await prisma.etablissement.create({
    data: {
      organisationId: org.id,
      nom: nomEtablissement,
      adresse: body.adresse?.trim() || null,
      email,
      telephone: body.telephone?.trim() || null,
      logoUrl: body.logoUrl || null,
      slug: slugifier(nomEtablissement),
      typeCuisine: body.typeCuisine?.trim() || "restauration_commerciale",
    },
  });
  const utilisateur = await prisma.utilisateur.create({
    data: { organisationId: org.id, prenom, nom, email },
  });
  const membre = await prisma.membreEtablissement.create({
    data: { utilisateurId: utilisateur.id, etablissementId: etab.id, role: "gerant" },
  });
  const codeRow = await prisma.codeOperateur.create({
    data: { membreEtablissementId: membre.id, codeHash: await hashCode(code) },
  });
  await provisionnerEtablissement(etab.id, org.id);

  const token = await signSession({
    membreId: membre.id,
    utilisateurId: utilisateur.id,
    codeOperateurId: codeRow.id,
    etablissementId: etab.id,
    role: "gerant",
    prenom,
    nom,
  });

  const res = NextResponse.json({
    ok: true,
    slug: etab.slug,
    etablissementId: etab.id,
  });
  res.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 12,
  });
  return res;
}
