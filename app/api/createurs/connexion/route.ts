import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { hashCode, verifyCode } from "@/lib/crypto";
import { CREATEUR_COOKIE, signCreateur } from "@/lib/auth/createur";
import { optionsCookieAuth } from "@/lib/auth/cookie";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: Request) {
  const body = (await request.json()) as {
    email?: string;
    motDePasse?: string;
    prenom?: string;
    nom?: string;
  };
  const email = (body.email ?? "").trim().toLowerCase();
  const motDePasse = body.motDePasse ?? "";
  if (!email || motDePasse.length < 8) {
    return NextResponse.json({ error: "E-mail et mot de passe (8 caractères min.) requis" }, { status: 400 });
  }

  const total = await prisma.comptePlateforme.count();
  let compte = await prisma.comptePlateforme.findUnique({ where: { email } });

  if (total === 0) {
    const prenom = (body.prenom ?? "").trim() || "Équipe";
    const nom = (body.nom ?? "").trim() || "Sanitrace";
    compte = await prisma.comptePlateforme.create({
      data: {
        email,
        motDePasseHash: await hashCode(motDePasse),
        prenom,
        nom,
      },
    });
  } else if (!compte || !compte.actif) {
    return NextResponse.json({ error: "Accès créateur refusé" }, { status: 401 });
  } else {
    const ok = await verifyCode(motDePasse, compte.motDePasseHash);
    if (!ok) {
      return NextResponse.json({ error: "Mot de passe incorrect" }, { status: 401 });
    }
  }

  const token = await signCreateur({
    createurId: compte.id,
    email: compte.email,
    prenom: compte.prenom,
    nom: compte.nom,
  });
  const res = NextResponse.json({ ok: true });
  res.cookies.set(CREATEUR_COOKIE, token, optionsCookieAuth(60 * 60 * 24));
  return res;
}
