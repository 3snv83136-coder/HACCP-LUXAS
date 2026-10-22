import { prisma } from "@/lib/db";
import { hashCode } from "@/lib/crypto";
import { signSession, type SessionPayload } from "@/lib/auth/session";
import { optionsCookieAuth } from "@/lib/auth/cookie";
import { roleDepuisFonction } from "@/lib/fonctions";
import { slugifier } from "@/lib/slug";
import { provisionnerEtablissement } from "@/lib/server/provision";
import type { SessionOperateur } from "@/lib/types";

export const EMAIL_RESTO_DEMO = "gerant@luxas.local";
export const MDP_RESTO_DEMO = "Sanitrace1";

export function heuresSession(resterConnecte: boolean) {
  return resterConnecte ? 24 * 30 : 12;
}

export async function retirerLogoZincBouillon() {
  await prisma.etablissement.updateMany({
    where: { logoUrl: { contains: "logo-le-zinc-bouillon" } },
    data: { logoUrl: null },
  });
}

export async function assurerCompteRestoDemo() {
  await retirerLogoZincBouillon();
  const gerant = await prisma.utilisateur.findFirst({
    where: { email: { equals: EMAIL_RESTO_DEMO, mode: "insensitive" } },
  });
  if (!gerant) return;
  await prisma.utilisateur.update({
    where: { id: gerant.id },
    data: { motDePasseHash: await hashCode(MDP_RESTO_DEMO), actif: true },
  });
}

export async function garantirCodeOperateur(membreId: string) {
  const existant = await prisma.codeOperateur.findFirst({
    where: { membreEtablissementId: membreId, actif: true },
  });
  if (existant) return existant.id;
  const pin = String(1000 + Math.floor(Math.random() * 9000));
  const created = await prisma.codeOperateur.create({
    data: { membreEtablissementId: membreId, codeHash: await hashCode(pin) },
  });
  return created.id;
}

export async function payloadDepuisMembre(membreId: string): Promise<SessionPayload | null> {
  const membre = await prisma.membreEtablissement.findUnique({
    where: { id: membreId },
    include: { utilisateur: true, etablissement: true },
  });
  if (!membre || !membre.actif || !membre.utilisateur.actif) return null;
  const codeOperateurId = await garantirCodeOperateur(membre.id);
  return {
    membreId: membre.id,
    utilisateurId: membre.utilisateurId,
    codeOperateurId,
    etablissementId: membre.etablissementId,
    role: roleDepuisFonction(membre.role),
    prenom: membre.utilisateur.prenom,
    nom: membre.utilisateur.nom,
    exp: Date.now() + 12 * 3600 * 1000,
  };
}

export async function vueDepuisPayload(session: SessionPayload): Promise<SessionOperateur | null> {
  const etab = await prisma.etablissement.findUnique({ where: { id: session.etablissementId } });
  if (!etab) return null;
  return {
    etablissementId: etab.id,
    etablissementNom: etab.nom,
    logoUrl: etab.logoUrl?.includes("logo-le-zinc-bouillon") ? null : etab.logoUrl,
    organisationId: etab.organisationId,
    membreId: session.membreId,
    utilisateurId: session.utilisateurId,
    codeOperateurId: session.codeOperateurId,
    nom: session.nom,
    prenom: session.prenom,
    role: session.role as SessionOperateur["role"],
    signedAt: new Date().toISOString(),
  };
}

export async function tokenSession(session: Omit<SessionPayload, "exp"> | SessionPayload, hours: number) {
  const { membreId, utilisateurId, codeOperateurId, etablissementId, role, prenom, nom } = session;
  const token = await signSession(
    { membreId, utilisateurId, codeOperateurId, etablissementId, role, prenom, nom },
    hours,
  );
  return { token, cookie: optionsCookieAuth(hours * 3600) };
}

export async function creerEtablissement(input: {
  organisationId: string;
  nom: string;
  adresse?: string | null;
  email: string;
  siren?: string | null;
  logoUrl?: string | null;
}) {
  const etab = await prisma.etablissement.create({
    data: {
      organisationId: input.organisationId,
      nom: input.nom,
      adresse: input.adresse?.trim() || null,
      email: input.email,
      logoUrl: input.logoUrl || null,
      slug: slugifier(input.nom),
      typeCuisine: "restauration_commerciale",
    },
  });
  if (input.siren) {
    const org = await prisma.organisation.findUnique({ where: { id: input.organisationId } });
    if (org && !org.siren) {
      await prisma.organisation.update({
        where: { id: input.organisationId },
        data: { siren: input.siren },
      });
    }
  }
  await provisionnerEtablissement(etab.id, input.organisationId);
  return etab;
}
