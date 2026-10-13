import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyCode } from "@/lib/crypto";
import { SESSION_COOKIE } from "@/lib/auth/session";
import { sessionDepuisRequete } from "@/lib/server/session-request";
import { payloadDepuisMembre, tokenSession, vueDepuisPayload } from "@/lib/server/auth-resto";
import { trouverEtablissement } from "@/lib/server/etab";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: Request) {
  return NextResponse.redirect(new URL("/terrain", request.url));
}

export async function POST(request: Request) {
  const body = (await request.json()) as { code?: string; identifiant?: string };
  const code = (body.code ?? "").replace(/\D/g, "").slice(0, 4);
  if (!/^\d{4}$/.test(code)) {
    return NextResponse.json({ error: "Code à 4 chiffres requis" }, { status: 400 });
  }

  const session = await sessionDepuisRequete(request);
  const etab =
    (body.identifiant ? await trouverEtablissement(body.identifiant) : null) ??
    (session ? await prisma.etablissement.findUnique({ where: { id: session.etablissementId } }) : null);
  if (!etab) {
    return NextResponse.json({ error: "Établissement introuvable" }, { status: 404 });
  }

  const membres = await prisma.membreEtablissement.findMany({
    where: { etablissementId: etab.id, actif: true },
    include: { codes: { where: { actif: true } } },
  });

  let membreId: string | null = null;
  for (const membre of membres) {
    for (const row of membre.codes) {
      if (await verifyCode(code, row.codeHash)) {
        membreId = membre.id;
        break;
      }
    }
    if (membreId) break;
  }
  if (!membreId) {
    return NextResponse.json({ error: "Code incorrect" }, { status: 401 });
  }

  const payload = await payloadDepuisMembre(membreId);
  if (!payload) return NextResponse.json({ error: "Session impossible" }, { status: 500 });
  const vue = await vueDepuisPayload(payload);
  const hours = session ? Math.max(1, Math.round((session.exp - Date.now()) / 3600_000)) : 12;
  const { token, cookie } = await tokenSession(payload, hours);
  const res = NextResponse.json({ session: vue });
  res.cookies.set(SESSION_COOKIE, token, cookie);
  return res;
}
