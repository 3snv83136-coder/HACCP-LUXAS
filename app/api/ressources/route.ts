import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { etablissementDeLaSession } from "@/lib/server/etab";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: Request) {
  const etab = await etablissementDeLaSession(request);
  if (!etab) return NextResponse.json({ error: "Établissement introuvable" }, { status: 404 });

  const [frigos, friteuses, surfaces] = await Promise.all([
    prisma.equipement.findMany({
      where: { etablissementId: etab.id },
      orderBy: { nom: "asc" },
    }),
    prisma.huileFriture.findMany({
      where: { etablissementId: etab.id },
      orderBy: { bac: "asc" },
    }),
    prisma.tacheNettoyage.findMany({
      where: { etablissementId: etab.id },
      orderBy: { zone: "asc" },
    }),
  ]);

  return NextResponse.json({
    etablissement: { id: etab.id, nom: etab.nom, slug: etab.slug, email: etab.email },
    frigos,
    friteuses,
    surfaces,
  });
}

export async function POST(request: Request) {
  const etab = await etablissementDeLaSession(request);
  if (!etab) return NextResponse.json({ error: "Établissement introuvable" }, { status: 404 });
  const body = (await request.json()) as {
    kind?: string;
    nom?: string;
    type?: string;
    seuilMax?: number;
    frequence?: string;
  };
  const nom = (body.nom ?? "").trim();
  if (!nom) return NextResponse.json({ error: "Nom requis" }, { status: 400 });

  if (body.kind === "frigo") {
    const item = await prisma.equipement.create({
      data: {
        etablissementId: etab.id,
        nom,
        type: body.type?.trim() || "froid_positif",
        qrToken: `eq-${Date.now().toString(36)}`,
        seuilMax: body.seuilMax ?? 4,
      },
    });
    return NextResponse.json({ ok: true, item });
  }
  if (body.kind === "friteuse") {
    const item = await prisma.huileFriture.create({
      data: { etablissementId: etab.id, bac: nom },
    });
    return NextResponse.json({ ok: true, item });
  }
  if (body.kind === "surface") {
    const item = await prisma.tacheNettoyage.create({
      data: {
        etablissementId: etab.id,
        zone: nom,
        frequence: body.frequence?.trim() || "quotidien",
        methodeTact: "T.A.C.T. — nettoyer, rincer, désinfecter, sécher",
        roleResponsable: "operateur",
      },
    });
    return NextResponse.json({ ok: true, item });
  }
  return NextResponse.json({ error: "Type inconnu" }, { status: 400 });
}

export async function DELETE(request: Request) {
  const etab = await etablissementDeLaSession(request);
  if (!etab) return NextResponse.json({ error: "Établissement introuvable" }, { status: 404 });
  const { searchParams } = new URL(request.url);
  const kind = searchParams.get("kind");
  const id = searchParams.get("id");
  if (!kind || !id) return NextResponse.json({ error: "kind et id requis" }, { status: 400 });

  if (kind === "frigo") {
    await prisma.equipement.updateMany({
      where: { id, etablissementId: etab.id },
      data: { actif: false },
    });
  } else if (kind === "friteuse") {
    await prisma.huileFriture.updateMany({
      where: { id, etablissementId: etab.id },
      data: { actif: false },
    });
  } else if (kind === "surface") {
    await prisma.tacheNettoyage.updateMany({
      where: { id, etablissementId: etab.id },
      data: { actif: false },
    });
  } else {
    return NextResponse.json({ error: "Type inconnu" }, { status: 400 });
  }
  return NextResponse.json({ ok: true });
}
