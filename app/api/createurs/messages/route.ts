import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { createurDepuisRequete } from "@/lib/server/createur-request";
import { creerMessage, listerMessages } from "@/lib/server/messages";
import type { PieceSaisie } from "@/lib/fichiers";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: Request) {
  const createur = await createurDepuisRequete(request);
  if (!createur) return NextResponse.json({ error: "Non connecté" }, { status: 401 });
  const etablissementId = new URL(request.url).searchParams.get("etablissementId");
  if (!etablissementId) return NextResponse.json({ error: "Établissement requis" }, { status: 400 });
  const items = await listerMessages(etablissementId, "qg");
  return NextResponse.json({ items });
}

export async function POST(request: Request) {
  const createur = await createurDepuisRequete(request);
  if (!createur) return NextResponse.json({ error: "Non connecté" }, { status: 401 });
  const body = (await request.json()) as {
    etablissementId?: string;
    tous?: boolean;
    texte?: string;
    pieces?: PieceSaisie[];
  };

  const cibles = body.tous
    ? await prisma.etablissement.findMany({ where: { actif: true }, select: { id: true } })
    : body.etablissementId
      ? [{ id: body.etablissementId }]
      : [];
  if (cibles.length === 0) {
    return NextResponse.json({ error: "Choisis un établissement" }, { status: 400 });
  }

  try {
    const items = [];
    for (const cible of cibles) {
      items.push(
        await creerMessage({
          canal: "qg",
          etablissementId: cible.id,
          auteurType: "createur",
          auteurNom: `${createur.prenom} ${createur.nom}`.trim() || createur.email,
          texte: body.texte ?? "",
          pieces: body.pieces,
        }),
      );
    }
    return NextResponse.json({ ok: true, items });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Envoi impossible" },
      { status: 400 },
    );
  }
}
