import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { etablissementDeLaSession } from "@/lib/server/etab";
import { assurerParamsJoursReleve } from "@/lib/server/params-assurer";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: Request) {
  const etab = await etablissementDeLaSession(request);
  if (!etab) return NextResponse.json({ params: [] });
  const paramsMap: Record<string, string> = {};
  const rows = await prisma.parametre.findMany({
    where: { organisationId: etab.organisationId },
    orderBy: { cle: "asc" },
  });
  for (const p of rows) paramsMap[p.cle] = p.valeur;
  await assurerParamsJoursReleve(etab.organisationId, paramsMap);
  const params = await prisma.parametre.findMany({
    where: { organisationId: etab.organisationId },
    orderBy: { cle: "asc" },
  });
  return NextResponse.json({ etablissement: etab, params });
}

export async function PUT(request: Request) {
  const etab = await etablissementDeLaSession(request);
  if (!etab) return NextResponse.json({ error: "Connexion requise" }, { status: 401 });
  const body = (await request.json()) as { id?: string; cle?: string; valeur?: string };
  if (body.valeur == null) {
    return NextResponse.json({ error: "valeur requise" }, { status: 400 });
  }
  if (body.id) {
    const param = await prisma.parametre.update({
      where: { id: body.id },
      data: { valeur: body.valeur },
    });
    return NextResponse.json({ param });
  }
  if (!body.cle) {
    return NextResponse.json({ error: "id ou cle requis" }, { status: 400 });
  }
  const param = await prisma.parametre.upsert({
    where: { organisationId_cle: { organisationId: etab.organisationId, cle: body.cle } },
    update: { valeur: body.valeur },
    create: { organisationId: etab.organisationId, cle: body.cle, valeur: body.valeur },
  });
  return NextResponse.json({ param });
}
