import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyCode } from "@/lib/crypto";
import { SESSION_COOKIE, signSession } from "@/lib/auth/session";
import { trouverEtablissement } from "@/lib/server/etab";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const ADMIN = new Set(["responsable", "gerant"]);

function safeNext(value: string | null, fallback: string, origin: string) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return new URL(fallback, origin);
  return new URL(value, origin);
}

function loginUrl(request: Request, erreur: string, identifiant = "") {
  const url = new URL("/acces/administrateur", request.url);
  url.searchParams.set("erreur", erreur);
  if (identifiant) url.searchParams.set("identifiant", identifiant);
  return url;
}

export async function POST(request: Request) {
  const form = await request.formData();
  const code = String(form.get("code") ?? "").replace(/\D/g, "").slice(0, 4);
  const identifiant = String(form.get("identifiant") ?? "").trim();
  const dest = String(form.get("next") ?? "/backoffice");
  const next = safeNext(dest, dest.startsWith("/hygiene") ? "/hygiene" : "/backoffice", request.url);

  if (!/^\d{4}$/.test(code)) {
    return NextResponse.redirect(loginUrl(request, "code", identifiant));
  }

  const etab = identifiant
    ? await trouverEtablissement(identifiant)
    : await prisma.etablissement.findFirst({ orderBy: { createdAt: "asc" } });
  if (!etab) {
    return NextResponse.redirect(loginUrl(request, "etab", identifiant));
  }

  const codes = await prisma.codeOperateur.findMany({
    where: { actif: true, membre: { actif: true, etablissementId: etab.id } },
    include: { membre: { include: { utilisateur: true } } },
  });

  for (const row of codes) {
    if (!(await verifyCode(code, row.codeHash))) continue;
    const role = row.membre.role;
    if (!ADMIN.has(role)) {
      return NextResponse.redirect(loginUrl(request, "role", identifiant));
    }
    const u = row.membre.utilisateur;
    const token = await signSession({
      membreId: row.membre.id,
      utilisateurId: u.id,
      codeOperateurId: row.id,
      etablissementId: etab.id,
      role,
      prenom: u.prenom,
      nom: u.nom,
    });
    const res = NextResponse.redirect(next);
    res.cookies.set(SESSION_COOKIE, token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 12,
    });
    return res;
  }

  return NextResponse.redirect(loginUrl(request, "code", identifiant));
}
