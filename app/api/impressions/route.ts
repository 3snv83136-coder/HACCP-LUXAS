import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { etablissementDeLaSession } from "@/lib/server/etab";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: Request) {
  const etab = await etablissementDeLaSession(request);
  if (!etab) return NextResponse.json({ items: [] });
  const { searchParams } = new URL(request.url);
  const statut = searchParams.get("statut") ?? undefined;
  const items = await prisma.impression.findMany({
    where: { etablissementId: etab.id, ...(statut ? { statut } : {}) },
    orderBy: { createdAt: "asc" },
    take: 50,
  });
  return NextResponse.json({ items, etablissement: { nom: etab.nom } });
}

export async function PATCH(request: Request) {
  const etab = await etablissementDeLaSession(request);
  if (!etab) return NextResponse.json({ error: "Établissement introuvable" }, { status: 404 });
  const body = (await request.json()) as { id?: string; statut?: string };
  if (!body.id) return NextResponse.json({ error: "id requis" }, { status: 400 });
  await prisma.impression.updateMany({
    where: { id: body.id, etablissementId: etab.id },
    data: {
      statut: body.statut === "imprime" ? "imprime" : "attente",
      imprimeAt: body.statut === "imprime" ? new Date() : null,
    },
  });
  return NextResponse.json({ ok: true });
}
