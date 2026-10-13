import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { etablissementDeLaSession } from "@/lib/server/etab";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function PATCH(request: Request) {
  const etab = await etablissementDeLaSession(request);
  if (!etab) return NextResponse.json({ error: "Connexion requise" }, { status: 401 });

  const body = (await request.json()) as { logoUrl?: string | null };
  if (body.logoUrl && body.logoUrl.length > 700_000) {
    return NextResponse.json({ error: "Logo trop lourd (max ~500 Ko)" }, { status: 400 });
  }

  const updated = await prisma.etablissement.update({
    where: { id: etab.id },
    data: { logoUrl: body.logoUrl || null },
    select: { id: true, nom: true, logoUrl: true },
  });
  return NextResponse.json({ ok: true, etablissement: updated });
}
