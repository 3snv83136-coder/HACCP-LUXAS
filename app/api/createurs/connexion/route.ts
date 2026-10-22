import { NextResponse } from "next/server";
import { CREATEUR_COOKIE, readCreateur, signCreateur } from "@/lib/auth/createur";
import { optionsCookieAuth } from "@/lib/auth/cookie";
import { verifierAccesDashboard } from "@/lib/server/createur-acces";
import { assurerCodesDemo } from "@/lib/server/assurer-codes-demo";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function cookieDepuisRequete(request: Request) {
  const raw = request.headers.get("cookie") ?? "";
  const part = raw
    .split(";")
    .map((s) => s.trim())
    .find((s) => s.startsWith(`${CREATEUR_COOKIE}=`));
  return part ? decodeURIComponent(part.slice(CREATEUR_COOKIE.length + 1)) : null;
}

export async function GET(request: Request) {
  const createur = await readCreateur(cookieDepuisRequete(request));
  if (createur) {
    return NextResponse.redirect(new URL("/createurs", request.url));
  }
  return NextResponse.redirect(new URL("/createurs/connexion", request.url));
}

export async function POST(request: Request) {
  const body = (await request.json()) as { email?: string; code?: string; motDePasse?: string };
  await assurerCodesDemo();
  const compte = await verifierAccesDashboard(body.email ?? "", body.code ?? body.motDePasse ?? "");
  if (!compte) {
    return NextResponse.json({ error: "E-mail ou code incorrect" }, { status: 401 });
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
