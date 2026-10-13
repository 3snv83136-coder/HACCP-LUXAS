import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { SESSION_COOKIE } from "@/lib/auth/session";
import { sessionDepuisRequete } from "@/lib/server/session-request";
import { payloadDepuisMembre, tokenSession } from "@/lib/server/auth-resto";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: Request) {
  const session = await sessionDepuisRequete(request);
  if (!session) return NextResponse.json({ error: "Non connecté" }, { status: 401 });

  const body = (await request.json()) as { etablissementId?: string };
  if (!body.etablissementId) {
    return NextResponse.json({ error: "Établissement requis" }, { status: 400 });
  }

  const membre = await prisma.membreEtablissement.findFirst({
    where: {
      utilisateurId: session.utilisateurId,
      etablissementId: body.etablissementId,
      actif: true,
    },
  });
  if (!membre) {
    return NextResponse.json({ error: "Cet établissement n’est pas sur ton compte" }, { status: 403 });
  }

  const payload = await payloadDepuisMembre(membre.id);
  if (!payload) return NextResponse.json({ error: "Session impossible" }, { status: 500 });

  const hoursLeft = Math.max(1, Math.round((session.exp - Date.now()) / 3600_000));
  const { token, cookie } = await tokenSession(payload, hoursLeft);
  const res = NextResponse.json({ ok: true, etablissementId: membre.etablissementId });
  res.cookies.set(SESSION_COOKIE, token, cookie);
  return res;
}
