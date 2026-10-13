import { NextResponse } from "next/server";
import { SESSION_COOKIE, signSession } from "@/lib/auth/session";
import { optionsCookieAuth } from "@/lib/auth/cookie";
import { sessionDepuisRequete } from "@/lib/server/session-request";
import { vueDepuisPayload } from "@/lib/server/auth-resto";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: Request) {
  const session = await sessionDepuisRequete(request);
  if (!session) {
    return NextResponse.json({ error: "Non connecté" }, { status: 401 });
  }
  const vue = await vueDepuisPayload(session);
  if (!vue) {
    return NextResponse.json({ error: "Établissement introuvable" }, { status: 404 });
  }

  const hoursLeft = Math.max(1, Math.round((session.exp - Date.now()) / 3600_000));
  const res = NextResponse.json({ session: vue });
  res.cookies.set(
    SESSION_COOKIE,
    await signSession(
      {
        membreId: session.membreId,
        utilisateurId: session.utilisateurId,
        codeOperateurId: session.codeOperateurId,
        etablissementId: session.etablissementId,
        role: session.role,
        prenom: session.prenom,
        nom: session.nom,
      },
      hoursLeft,
    ),
    optionsCookieAuth(hoursLeft * 3600),
  );
  return res;
}
