import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyCode } from "@/lib/crypto";
import { SESSION_COOKIE } from "@/lib/auth/session";
import { assurerCompteRestoDemo, heuresSession, payloadDepuisMembre, tokenSession } from "@/lib/server/auth-resto";
import { assurerCodesDemo } from "@/lib/server/assurer-codes-demo";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: Request) {
  return NextResponse.redirect(new URL("/connexion", request.url));
}

export async function POST(request: Request) {
  const body = (await request.json()) as {
    email?: string;
    motDePasse?: string;
    resterConnecte?: boolean;
    etablissementId?: string;
  };
  await assurerCompteRestoDemo();
  await assurerCodesDemo();
  const email = (body.email ?? "").trim().toLowerCase();
  const motDePasse = body.motDePasse ?? "";
  if (!email || !motDePasse) {
    return NextResponse.json({ error: "E-mail et mot de passe requis" }, { status: 400 });
  }

  const candidats = await prisma.utilisateur.findMany({
    where: { email: { equals: email, mode: "insensitive" }, actif: true, motDePasseHash: { not: null } },
    include: {
      membres: {
        where: { actif: true },
        include: { etablissement: true },
        orderBy: { id: "desc" },
      },
    },
  });

  let utilisateur = null as (typeof candidats)[number] | null;
  for (const u of candidats) {
    if (u.motDePasseHash && (await verifyCode(motDePasse, u.motDePasseHash))) {
      utilisateur = u;
      break;
    }
  }
  if (!utilisateur) {
    return NextResponse.json({ error: "E-mail ou mot de passe incorrect" }, { status: 401 });
  }

  const membres = utilisateur.membres.filter((m) => m.etablissement.actif);
  const choisi =
    membres.find((m) => m.etablissementId === body.etablissementId) ?? membres[0];
  if (!choisi) {
    return NextResponse.json({ error: "Aucun établissement sur ce compte" }, { status: 404 });
  }

  const payload = await payloadDepuisMembre(choisi.id);
  if (!payload) {
    return NextResponse.json({ error: "Session impossible" }, { status: 500 });
  }

  const hours = heuresSession(Boolean(body.resterConnecte));
  const { token, cookie } = await tokenSession(payload, hours);
  const res = NextResponse.json({
    ok: true,
    etablissementId: choisi.etablissementId,
    etablissements: membres.map((m) => ({ id: m.etablissementId, nom: m.etablissement.nom })),
  });
  res.cookies.set(SESSION_COOKIE, token, cookie);
  return res;
}
