import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { CREATEUR_COOKIE, signCreateur } from "@/lib/auth/createur";
import { optionsCookieAuth } from "@/lib/auth/cookie";
import { compteDashboardCourant, mettreAJourAccesDashboard } from "@/lib/server/createur-acces";
import { createurDepuisRequete } from "@/lib/server/createur-request";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: Request) {
  const createur = await createurDepuisRequete(request);
  if (!createur) return NextResponse.json({ error: "Non connecté" }, { status: 401 });

  const compte =
    (createur.createurId !== "qg"
      ? await prisma.comptePlateforme.findUnique({ where: { id: createur.createurId } })
      : null) ?? (await compteDashboardCourant());
  if (!compte) return NextResponse.json({ error: "Aucun compte admin" }, { status: 404 });

  return NextResponse.json({
    email: compte.email,
    prenom: compte.prenom,
    nom: compte.nom,
  });
}

export async function PATCH(request: Request) {
  const createur = await createurDepuisRequete(request);
  if (!createur) return NextResponse.json({ error: "Non connecté" }, { status: 401 });

  const body = (await request.json()) as { email?: string; code?: string };
  try {
    const compte = await mettreAJourAccesDashboard({
      compteId: createur.createurId !== "qg" ? createur.createurId : undefined,
      email: body.email,
      code: body.code,
    });
    const res = NextResponse.json({ ok: true, email: compte.email });
    res.cookies.set(
      CREATEUR_COOKIE,
      await signCreateur({
        createurId: compte.id,
        email: compte.email,
        prenom: compte.prenom,
        nom: compte.nom,
      }),
      optionsCookieAuth(60 * 60 * 24),
    );
    return res;
  } catch (e) {
    const message = e instanceof Error ? e.message : "Mise à jour impossible";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
