import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyCode } from "@/lib/crypto";
import { BACKOFFICE_PIN_COOKIE, signBackofficePin } from "@/lib/auth/backoffice";
import { optionsCookieAuth } from "@/lib/auth/cookie";
import { sessionDepuisRequete } from "@/lib/server/session-request";
import { backofficePinDepuisRequete } from "@/lib/server/backoffice-pin-request";
import { assurerCodesDemo, PIN_BACKOFFICE_ZINC } from "@/lib/server/assurer-codes-demo";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: Request) {
  const session = await sessionDepuisRequete(request);
  if (!session) return NextResponse.json({ ok: false }, { status: 401 });
  const pin = await backofficePinDepuisRequete(request);
  return NextResponse.json({
    ok: Boolean(pin && pin.etablissementId === session.etablissementId),
  });
}

export async function POST(request: Request) {
  const session = await sessionDepuisRequete(request);
  if (!session) return NextResponse.json({ error: "Non connecté" }, { status: 401 });
  await assurerCodesDemo();

  const body = (await request.json()) as { code?: string };
  const code = (body.code ?? "").replace(/\D/g, "").slice(0, 4);
  if (!/^\d{4}$/.test(code)) {
    return NextResponse.json({ error: "Code à 4 chiffres requis" }, { status: 400 });
  }

  const etab = await prisma.etablissement.findUnique({ where: { id: session.etablissementId } });
  if (!etab) return NextResponse.json({ error: "Établissement introuvable" }, { status: 404 });

  const hash = etab.codeBackofficeHash;
  const ok = hash ? await verifyCode(code, hash) : code === PIN_BACKOFFICE_ZINC;
  if (!ok) return NextResponse.json({ error: "Code back-office incorrect" }, { status: 401 });

  const token = await signBackofficePin(etab.id);
  const res = NextResponse.json({ ok: true });
  res.cookies.set(BACKOFFICE_PIN_COOKIE, token, optionsCookieAuth(12 * 3600));
  return res;
}
