import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { etablissementDeLaSession } from "@/lib/server/etab";
import { sessionDepuisRequete } from "@/lib/server/session-request";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: Request) {
  const etab = await etablissementDeLaSession(request);
  if (!etab) return NextResponse.json({ items: [] });
  const items = await prisma.captureEtiquette.findMany({
    where: { etablissementId: etab.id },
    orderBy: { createdAt: "desc" },
    take: 80,
  });
  return NextResponse.json({ items });
}

export async function POST(request: Request) {
  const etab = await etablissementDeLaSession(request);
  const session = await sessionDepuisRequete(request);
  if (!etab || !session) return NextResponse.json({ error: "Connexion requise" }, { status: 401 });

  const body = (await request.json()) as {
    produit?: string;
    lot?: string;
    dlc?: string;
    type?: string;
    photoUrl?: string;
    imprimer?: boolean;
  };
  const produit = (body.produit ?? "").trim();
  const photoUrl = body.photoUrl ?? "";
  if (!produit || !photoUrl) {
    return NextResponse.json({ error: "Produit et photo requis" }, { status: 400 });
  }
  if (photoUrl.length > 1_200_000) {
    return NextResponse.json({ error: "Photo trop lourde" }, { status: 400 });
  }

  const capture = await prisma.captureEtiquette.create({
    data: {
      etablissementId: etab.id,
      produit,
      lot: body.lot?.trim() || null,
      dlc: body.dlc?.trim() || null,
      type: body.type?.trim() || "ouverture",
      photoUrl,
      createdBy: `${session.prenom} ${session.nom}`,
    },
  });

  let impressionId: string | null = null;
  if (body.imprimer !== false) {
    const job = await prisma.impression.create({
      data: {
        etablissementId: etab.id,
        captureId: capture.id,
        produit: capture.produit,
        lot: capture.lot,
        dlc: capture.dlc,
        type: capture.type,
        photoUrl: capture.photoUrl,
        statut: "attente",
      },
    });
    impressionId = job.id;
  }

  return NextResponse.json({ ok: true, id: capture.id, impressionId });
}
