import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { dlcEstAffichee } from "@/lib/dlc";
import { extraireQrSanitrace, tokenEtiquette, tokenLot } from "@/lib/qr-token";
import { etablissementDeLaSession } from "@/lib/server/etab";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: Request) {
  const etab = await etablissementDeLaSession(request);
  if (!etab) return NextResponse.json({ error: "Connexion requise" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const q = extraireQrSanitrace(searchParams.get("q") ?? "");
  if (!q) return NextResponse.json({ kind: "inconnu" }, { status: 404 });

  const lot = await prisma.lotProduit.findFirst({
    where: { etablissementId: etab.id, qrToken: tokenLot(q) },
  });
  if (lot) {
    return NextResponse.json({
      kind: "lot",
      item: {
        produit: lot.produit,
        type: lot.type,
        lot: lot.lotSource,
        createdAt: lot.createdAt.toISOString(),
        qrToken: lot.qrToken,
        dlc: dlcEstAffichee(lot.dlcSecondaire) ? lot.dlcSecondaire.toISOString() : null,
      },
    });
  }

  const capture = await prisma.captureEtiquette.findFirst({
    where: { etablissementId: etab.id, id: tokenEtiquette(q) },
  });
  if (capture) {
    return NextResponse.json({
      kind: "etiquette",
      item: {
        id: capture.id,
        produit: capture.produit,
        type: capture.type,
        lot: capture.lot,
        photoUrl: capture.photoUrl,
        createdAt: capture.createdAt.toISOString(),
        createdBy: capture.createdBy,
      },
    });
  }

  const eq = await prisma.equipement.findFirst({
    where: { etablissementId: etab.id, qrToken: q, actif: true },
  });
  if (eq) {
    return NextResponse.json({ kind: "equipement", token: eq.qrToken, nom: eq.nom });
  }

  return NextResponse.json({ kind: "inconnu" }, { status: 404 });
}
