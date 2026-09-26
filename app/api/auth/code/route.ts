import { NextResponse } from "next/server";
import { SESSION_COOKIE, signSession } from "@/lib/auth/session";
import { optionsCookieAuth } from "@/lib/auth/cookie";
import { payloadSession, redirigerLibre, sessionLibre, sessionOperateurLibre } from "@/lib/server/acces-libre";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: Request) {
  return redirigerLibre(request, "/terrain");
}

export async function POST() {
  const payload = await sessionLibre();
  const session = await sessionOperateurLibre();
  if (!payload || !session) {
    return NextResponse.json({ error: "Aucun établissement" }, { status: 404 });
  }
  const res = NextResponse.json({ session });
  res.cookies.set(SESSION_COOKIE, await signSession(payloadSession(payload)), optionsCookieAuth());
  return res;
}
