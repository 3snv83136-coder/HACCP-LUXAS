import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyCode } from "@/lib/crypto";
import { SESSION_COOKIE, signSession } from "@/lib/auth/session";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function safeNext(value: string | null, origin: string) {
  if (!value || !value.startsWith("/backoffice")) return new URL("/backoffice", origin);
  return new URL(value, origin);
}

export async function POST(request: Request) {
  const form = await request.formData();
  const code = String(form.get("code") ?? "").replace(/\D/g, "").slice(0, 4);
  const next = safeNext(String(form.get("next") ?? "/backoffice"), request.url);

  if (!/^\d{4}$/.test(code)) {
    next.searchParams.set("erreur", "code");
    return NextResponse.redirect(new URL("/backoffice/login?erreur=code", request.url));
  }

  const etab = await prisma.etablissement.findFirst({ orderBy: { createdAt: "asc" } });
  if (!etab) {
    return NextResponse.redirect(new URL("/backoffice/login?erreur=etab", request.url));
  }

  const codes = await prisma.codeOperateur.findMany({
    where: { actif: true, membre: { actif: true, etablissementId: etab.id } },
    include: { membre: { include: { utilisateur: true } } },
  });

  for (const row of codes) {
    if (!(await verifyCode(code, row.codeHash))) continue;
    const role = row.membre.role;
    if (role !== "responsable" && role !== "gerant") {
      return NextResponse.redirect(new URL("/backoffice/login?erreur=role", request.url));
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

  return NextResponse.redirect(new URL("/backoffice/login?erreur=code", request.url));
}
