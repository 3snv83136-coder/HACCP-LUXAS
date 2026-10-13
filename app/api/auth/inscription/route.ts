import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { hashCode, verifyCode } from "@/lib/crypto";
import { SESSION_COOKIE } from "@/lib/auth/session";
import { estFonction, roleDepuisFonction, sirenOuSiretValide } from "@/lib/fonctions";
import { creerEtablissement, heuresSession, payloadDepuisMembre, tokenSession } from "@/lib/server/auth-resto";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: Request) {
  const body = (await request.json()) as {
    nomEtablissement?: string;
    siren?: string;
    adresse?: string;
    email?: string;
    motDePasse?: string;
    prenom?: string;
    nom?: string;
    fonction?: string;
    resterConnecte?: boolean;
    logoUrl?: string;
  };

  const nomEtablissement = (body.nomEtablissement ?? "").trim();
  const prenom = (body.prenom ?? "").trim();
  const nom = (body.nom ?? "").trim();
  const email = (body.email ?? "").trim().toLowerCase();
  const motDePasse = body.motDePasse ?? "";
  const siren = (body.siren ?? "").replace(/\D/g, "");
  const fonction = estFonction(body.fonction ?? "") ? body.fonction! : "gerant";

  const adresse = (body.adresse ?? "").trim();
  if (!nomEtablissement || !prenom || !nom || !email || !adresse) {
    return NextResponse.json({ error: "Établissement, adresse, contact et e-mail requis" }, { status: 400 });
  }
  if (!sirenOuSiretValide(siren)) {
    return NextResponse.json({ error: "SIREN (9 chiffres) ou SIRET (14 chiffres) requis" }, { status: 400 });
  }
  if (motDePasse.length < 8) {
    return NextResponse.json({ error: "Le mot de passe doit faire au moins 8 caractères" }, { status: 400 });
  }
  if (body.logoUrl && body.logoUrl.length > 700_000) {
    return NextResponse.json({ error: "Logo trop lourd (max ~500 Ko)" }, { status: 400 });
  }

  const existants = await prisma.utilisateur.findMany({
    where: { email: { equals: email, mode: "insensitive" }, motDePasseHash: { not: null } },
  });

  let utilisateur = null as (typeof existants)[number] | null;
  for (const u of existants) {
    if (u.motDePasseHash && (await verifyCode(motDePasse, u.motDePasseHash))) {
      utilisateur = u;
      break;
    }
  }
  if (existants.length > 0 && !utilisateur) {
    return NextResponse.json(
      { error: "Cet e-mail existe déjà. Utilise le même mot de passe pour ajouter un établissement." },
      { status: 409 },
    );
  }

  if (!utilisateur) {
    const org = await prisma.organisation.create({
      data: { nom: nomEtablissement, siren },
    });
    const etab = await creerEtablissement({
      organisationId: org.id,
      nom: nomEtablissement,
      adresse,
      email,
      siren,
      logoUrl: body.logoUrl,
    });
    utilisateur = await prisma.utilisateur.create({
      data: {
        organisationId: org.id,
        prenom,
        nom,
        email,
        motDePasseHash: await hashCode(motDePasse),
      },
    });
    const membre = await prisma.membreEtablissement.create({
      data: { utilisateurId: utilisateur.id, etablissementId: etab.id, role: fonction },
    });
    return repondreSession(membre.id, etab.id, etab.slug, Boolean(body.resterConnecte));
  }

  const etab = await creerEtablissement({
    organisationId: utilisateur.organisationId,
    nom: nomEtablissement,
    adresse,
    email,
    siren,
    logoUrl: body.logoUrl,
  });
  await prisma.utilisateur.update({
    where: { id: utilisateur.id },
    data: { prenom, nom },
  });
  const dejaMembre = await prisma.membreEtablissement.findUnique({
    where: { utilisateurId_etablissementId: { utilisateurId: utilisateur.id, etablissementId: etab.id } },
  });
  const membre =
    dejaMembre ??
    (await prisma.membreEtablissement.create({
      data: { utilisateurId: utilisateur.id, etablissementId: etab.id, role: fonction },
    }));

  return repondreSession(membre.id, etab.id, etab.slug, Boolean(body.resterConnecte));
}

async function repondreSession(membreId: string, etablissementId: string, slug: string | null, resterConnecte: boolean) {
  const payload = await payloadDepuisMembre(membreId);
  if (!payload) {
    return NextResponse.json({ error: "Session impossible" }, { status: 500 });
  }
  const hours = heuresSession(resterConnecte);
  const { token, cookie } = await tokenSession(payload, hours);
  const res = NextResponse.json({
    ok: true,
    slug,
    etablissementId,
    role: roleDepuisFonction(payload.role),
  });
  res.cookies.set(SESSION_COOKIE, token, cookie);
  return res;
}
