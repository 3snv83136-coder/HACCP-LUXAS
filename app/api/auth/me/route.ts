import { NextResponse } from "next/server";
import { SESSION_COOKIE, signSession } from "@/lib/auth/session";
import { optionsCookieAuth } from "@/lib/auth/cookie";
import { sessionDepuisRequete } from "@/lib/server/session-request";
import { payloadSession, sessionOperateurLibre } from "@/lib/server/acces-libre";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: Request) {
  const session = await sessionDepuisRequete(request);
  const vue = await sessionOperateurLibre();
  if (!session || !vue) {
    return NextResponse.json({ error: "Aucun établissement. Crée un compte d’abord." }, { status: 404 });
  }

  const res = NextResponse.json({
    session: {
      ...vue,
      etablissementId: session.etablissementId,
      membreId: session.membreId,
      utilisateurId: session.utilisateurId,
      codeOperateurId: session.codeOperateurId,
      nom: session.nom,
      prenom: session.prenom,
      role: session.role,
    },
  });
  res.cookies.set(SESSION_COOKIE, await signSession(payloadSession(session)), optionsCookieAuth());
  return res;
}
