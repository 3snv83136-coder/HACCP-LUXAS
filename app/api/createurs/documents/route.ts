import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { createurDepuisRequete } from "@/lib/server/createur-request";
import { TAILLE_MAX_PIECE } from "@/lib/fichiers";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: Request) {
  const createur = await createurDepuisRequete(request);
  if (!createur) return NextResponse.json({ error: "Non connecté" }, { status: 401 });
  const etablissementId = new URL(request.url).searchParams.get("etablissementId");
  if (!etablissementId) return NextResponse.json({ error: "Établissement requis" }, { status: 400 });
  const etab = await prisma.etablissement.findUnique({
    where: { id: etablissementId },
    select: { id: true, nom: true },
  });
  if (!etab) return NextResponse.json({ error: "Établissement introuvable" }, { status: 404 });
  const items = await prisma.documentPms.findMany({
    where: { etablissementId },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({
    etablissement: etab,
    items: items.map((d) => ({
      id: d.id,
      titre: d.titre,
      categorie: d.categorie,
      commentaire: d.commentaire,
      source: d.source,
      createdAt: d.createdAt.toISOString(),
      hasFichier: Boolean(d.fichierUrl),
    })),
  });
}

export async function POST(request: Request) {
  const createur = await createurDepuisRequete(request);
  if (!createur) return NextResponse.json({ error: "Non connecté" }, { status: 401 });
  const body = (await request.json()) as {
    etablissementId?: string;
    titre?: string;
    commentaire?: string;
    fichierUrl?: string;
  };
  const etablissementId = body.etablissementId ?? "";
  const titre = (body.titre ?? "").trim();
  const fichierUrl = body.fichierUrl ?? "";
  if (!etablissementId || !titre) {
    return NextResponse.json({ error: "Titre et établissement requis" }, { status: 400 });
  }
  if (!fichierUrl.startsWith("data:")) {
    return NextResponse.json({ error: "Joins un PDF ou une photo" }, { status: 400 });
  }
  if (fichierUrl.length > TAILLE_MAX_PIECE) {
    return NextResponse.json({ error: "Fichier trop lourd (max 3,5 Mo)" }, { status: 400 });
  }
  const etab = await prisma.etablissement.findUnique({ where: { id: etablissementId } });
  if (!etab) return NextResponse.json({ error: "Établissement introuvable" }, { status: 404 });

  const doc = await prisma.documentPms.create({
    data: {
      etablissementId,
      titre,
      categorie: "fiche_createur",
      version: "1",
      fichierUrl,
      commentaire: (body.commentaire ?? "").trim() || null,
      source: "createur",
    },
  });
  return NextResponse.json({ ok: true, id: doc.id });
}
