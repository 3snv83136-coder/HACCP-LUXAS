import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyCode } from "@/lib/crypto";
import { SESSION_COOKIE, signSession } from "@/lib/auth/session";
import { optionsCookieAuth } from "@/lib/auth/cookie";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const ADMIN = new Set(["responsable", "gerant"]);

export async function POST(request: Request) {
  const body = (await request.json()) as { email?: string; motDePasse?: string };
  const email = (body.email ?? "").trim().toLowerCase();
  const motDePasse = body.motDePasse ?? "";

  if (!email || motDePasse.length < 8) {
    return NextResponse.json({ error: "E-mail et mot de passe requis" }, { status: 400 });
  }

  const utilisateur = await prisma.utilisateur.findFirst({
    where: { email: { equals: email, mode: "insensitive" }, actif: true, motDePasseHash: { not: null } },
    include: {
      membres: {
        where: { actif: true, role: { in: ["gerant", "responsable"] } },
        include: { etablissement: true, codes: { where: { actif: true }, take: 1 } },
        orderBy: { id: "asc" },
      },
    },
  });

  if (!utilisateur?.motDePasseHash) {
    return NextResponse.json(
      { error: "Compte introuvable. Crée un compte ou utilise l’accès par code PIN." },
      { status: 401 },
    );
  }

  const ok = await verifyCode(motDePasse, utilisateur.motDePasseHash);
  if (!ok) {
    return NextResponse.json({ error: "Mot de passe incorrect" }, { status: 401 });
  }

  const membre = utilisateur.membres.find((m) => ADMIN.has(m.role) && m.etablissement.actif);
  const codeRow = membre?.codes[0];
  if (!membre || !codeRow) {
    return NextResponse.json({ error: "Aucun établissement administrateur sur ce compte" }, { status: 403 });
  }

  const token = await signSession({
    membreId: membre.id,
    utilisateurId: utilisateur.id,
    codeOperateurId: codeRow.id,
    etablissementId: membre.etablissementId,
    role: membre.role,
    prenom: utilisateur.prenom,
    nom: utilisateur.nom,
  });

  const res = NextResponse.json({
    ok: true,
    etablissementId: membre.etablissementId,
    slug: membre.etablissement.slug,
  });
  res.cookies.set(SESSION_COOKIE, token, optionsCookieAuth());
  return res;
}
