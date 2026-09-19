import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { resolveEtablissement } from "@/lib/server/etab";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const etab = await resolveEtablissement(searchParams.get("etablissementId"));
  if (!etab) return NextResponse.json({ items: [] });
  const items = await prisma.nonConformite.findMany({
    where: { etablissementId: etab.id },
    include: {
      responsable: { include: { utilisateur: true } },
    },
    orderBy: { createdAt: "desc" },
  });
  const membres = await prisma.membreEtablissement.findMany({
    where: { etablissementId: etab.id, actif: true },
    include: { utilisateur: true },
  });
  return NextResponse.json({ items, membres });
}

export async function PATCH(request: Request) {
  const body = (await request.json()) as {
    id?: string;
    statut?: string;
    actionImmediate?: string;
    actionPreventive?: string;
    cause?: string;
    responsableId?: string | null;
    echeance?: string | null;
    valideParId?: string | null;
  };
  if (!body.id) return NextResponse.json({ error: "id requis" }, { status: 400 });

  const statut = body.statut;
  const item = await prisma.nonConformite.update({
    where: { id: body.id },
    data: {
      statut,
      actionImmediate: body.actionImmediate,
      actionPreventive: body.actionPreventive,
      cause: body.cause,
      responsableId: body.responsableId,
      echeance: body.echeance ? new Date(body.echeance) : undefined,
      valideParId: body.valideParId,
      clotureAt: statut === "cloture" ? new Date() : undefined,
    },
  });
  return NextResponse.json({ item });
}
