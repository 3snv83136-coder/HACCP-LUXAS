import { NextResponse } from "next/server";
import { CREATEUR_COOKIE, signCreateur } from "@/lib/auth/createur";
import { optionsCookieAuth } from "@/lib/auth/cookie";
import { codeQgValide } from "@/lib/auth/code-qg";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: Request) {
  const body = (await request.json()) as { code?: string };
  const code = body.code ?? "";

  if (!codeQgValide(code)) {
    return NextResponse.json({ error: "Code incorrect" }, { status: 401 });
  }

  const token = await signCreateur({
    createurId: "qg",
    email: "qg@sanitrace",
    prenom: "Q.G.",
    nom: "Sanitrace",
  });
  const res = NextResponse.json({ ok: true });
  res.cookies.set(CREATEUR_COOKIE, token, optionsCookieAuth(60 * 60 * 24));
  return res;
}
