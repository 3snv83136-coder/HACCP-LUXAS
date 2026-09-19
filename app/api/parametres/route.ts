import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  const etab = await prisma.etablissement.findFirst({ include: { organisation: true } });
  if (!etab) return NextResponse.json({ params: [] });
  const params = await prisma.parametre.findMany({
    where: { organisationId: etab.organisationId },
    orderBy: { cle: "asc" },
  });
  return NextResponse.json({ organisation: etab.organisation, etablissement: etab, params });
}

export async function PUT(request: Request) {
  const body = (await request.json()) as { id?: string; valeur?: string };
  if (!body.id || body.valeur == null) {
    return NextResponse.json({ error: "id et valeur requis" }, { status: 400 });
  }
  const param = await prisma.parametre.update({
    where: { id: body.id },
    data: { valeur: body.valeur },
  });
  return NextResponse.json({ param });
}
