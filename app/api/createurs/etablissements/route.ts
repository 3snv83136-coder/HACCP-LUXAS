import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { createurDepuisRequete } from "@/lib/server/createur-request";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: Request) {
  const createur = await createurDepuisRequete(request);
  if (!createur) return NextResponse.json({ error: "Non connecté" }, { status: 401 });

  const depuis = new Date();
  depuis.setDate(depuis.getDate() - 30);

  const [etablissements, totalActifs, nouveaux30j] = await Promise.all([
    prisma.etablissement.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        organisation: { select: { nom: true } },
        _count: {
          select: {
            membres: true,
            relevesTemperature: true,
            capturesEtiquette: true,
          },
        },
      },
    }),
    prisma.etablissement.count({ where: { actif: true } }),
    prisma.etablissement.count({ where: { createdAt: { gte: depuis } } }),
  ]);

  return NextResponse.json({
    synthese: {
      total: etablissements.length,
      actifs: totalActifs,
      nouveaux30j,
    },
    etablissements: etablissements.map((e) => ({
      id: e.id,
      nom: e.nom,
      email: e.email,
      telephone: e.telephone,
      slug: e.slug,
      logoUrl: e.logoUrl,
      actif: e.actif,
      createdAt: e.createdAt.toISOString(),
      organisation: e.organisation.nom,
      membres: e._count.membres,
      releves: e._count.relevesTemperature,
      etiquettes: e._count.capturesEtiquette,
    })),
  });
}

export async function PATCH(request: Request) {
  const createur = await createurDepuisRequete(request);
  if (!createur) return NextResponse.json({ error: "Non connecté" }, { status: 401 });

  const body = (await request.json()) as { id?: string; actif?: boolean };
  if (!body.id || typeof body.actif !== "boolean") {
    return NextResponse.json({ error: "id et actif requis" }, { status: 400 });
  }

  const etab = await prisma.etablissement.update({
    where: { id: body.id },
    data: { actif: body.actif },
    select: { id: true, nom: true, actif: true },
  });
  return NextResponse.json({ ok: true, etablissement: etab });
}
