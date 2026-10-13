import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { etablissementDeLaSession } from "@/lib/server/etab";
import { assurerClotureMensuelle } from "@/lib/server/cloture-mois";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: Request) {
  const etab = await etablissementDeLaSession(request);
  if (!etab) return NextResponse.json({ items: [] });
  await assurerClotureMensuelle(etab.id);
  const items = await prisma.alerte.findMany({
    where: { etablissementId: etab.id, lu: false },
    orderBy: { createdAt: "desc" },
    take: 20,
  });
  return NextResponse.json({ items });
}

export async function PATCH(request: Request) {
  const etab = await etablissementDeLaSession(request);
  if (!etab) return NextResponse.json({ error: "Connexion requise" }, { status: 401 });
  const body = (await request.json()) as { id?: string };
  if (!body.id) return NextResponse.json({ error: "id requis" }, { status: 400 });
  await prisma.alerte.updateMany({
    where: { id: body.id, etablissementId: etab.id },
    data: { lu: true },
  });
  return NextResponse.json({ ok: true });
}
