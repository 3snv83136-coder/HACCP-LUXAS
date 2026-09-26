import { NextResponse } from "next/server";
import { SESSION_COOKIE, signSession } from "@/lib/auth/session";
import { optionsCookieAuth } from "@/lib/auth/cookie";
import { payloadSession, redirigerLibre, sessionLibre } from "@/lib/server/acces-libre";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: Request) {
  return redirigerLibre(request, "/backoffice");
}

export async function POST() {
  const payload = await sessionLibre();
  if (!payload) {
    return NextResponse.json({ error: "Aucun établissement" }, { status: 404 });
  }
  const rest = payloadSession(payload);
  const res = NextResponse.json({ ok: true, etablissementId: rest.etablissementId });
  res.cookies.set(SESSION_COOKIE, await signSession(rest), optionsCookieAuth());
  return res;
}
