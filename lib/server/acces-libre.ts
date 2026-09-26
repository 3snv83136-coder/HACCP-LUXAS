import { prisma } from "@/lib/db";
import { hashCode } from "@/lib/crypto";
import { SESSION_COOKIE, signSession, type SessionPayload } from "@/lib/auth/session";
import { CREATEUR_COOKIE, signCreateur, type CreateurPayload } from "@/lib/auth/createur";
import { optionsCookieAuth } from "@/lib/auth/cookie";
import type { SessionOperateur } from "@/lib/types";
import { NextResponse } from "next/server";

export function createurLibre(): CreateurPayload {
  return {
    createurId: "qg",
    email: "qg@sanitrace",
    prenom: "Q.G.",
    nom: "Sanitrace",
    exp: Date.now() + 24 * 3600 * 1000,
  };
}

export async function sessionLibre(): Promise<SessionPayload | null> {
  const membre =
    (await prisma.membreEtablissement.findFirst({
      where: { actif: true, role: { in: ["gerant", "responsable"] } },
      include: { utilisateur: true, codes: { where: { actif: true }, take: 1 }, etablissement: true },
      orderBy: { id: "asc" },
    })) ??
    (await prisma.membreEtablissement.findFirst({
      where: { actif: true },
      include: { utilisateur: true, codes: { where: { actif: true }, take: 1 }, etablissement: true },
      orderBy: { id: "asc" },
    }));
  if (!membre) return null;

  let codeId = membre.codes[0]?.id;
  if (!codeId) {
    const created = await prisma.codeOperateur.create({
      data: { membreEtablissementId: membre.id, codeHash: await hashCode("0000") },
    });
    codeId = created.id;
  }

  return {
    membreId: membre.id,
    utilisateurId: membre.utilisateurId,
    codeOperateurId: codeId,
    etablissementId: membre.etablissementId,
    role: "gerant",
    prenom: membre.utilisateur.prenom,
    nom: membre.utilisateur.nom,
    exp: Date.now() + 12 * 3600 * 1000,
  };
}

export async function sessionOperateurLibre(): Promise<SessionOperateur | null> {
  const session = await sessionLibre();
  if (!session) return null;
  const etab = await prisma.etablissement.findUnique({ where: { id: session.etablissementId } });
  return {
    etablissementId: session.etablissementId,
    etablissementNom: etab?.nom ?? "",
    logoUrl: etab?.logoUrl ?? null,
    organisationId: etab?.organisationId ?? "",
    membreId: session.membreId,
    utilisateurId: session.utilisateurId,
    codeOperateurId: session.codeOperateurId,
    nom: session.nom,
    prenom: session.prenom,
    role: "gerant",
    signedAt: new Date().toISOString(),
  };
}

export async function redirigerLibre(request: Request, dest: string) {
  const session = await sessionLibre();
  const res = NextResponse.redirect(new URL(dest, request.url));
  if (session) {
    const { exp: _exp, ...payload } = session;
    res.cookies.set(SESSION_COOKIE, await signSession(payload), optionsCookieAuth());
  }
  const token = await signCreateur({
    createurId: "qg",
    email: "qg@sanitrace",
    prenom: "Q.G.",
    nom: "Sanitrace",
  });
  res.cookies.set(CREATEUR_COOKIE, token, optionsCookieAuth(60 * 60 * 24));
  return res;
}
