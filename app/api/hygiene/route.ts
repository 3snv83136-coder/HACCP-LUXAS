import { NextResponse } from "next/server";
import { dossierHygiene } from "@/lib/server/hygiene";
import type { PeriodeHygiene } from "@/lib/hygiene";
import { etablissementDeLaSession } from "@/lib/server/etab";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const periode = (searchParams.get("periode") ?? "jour") as PeriodeHygiene;
  if (!["jour", "semaine", "mois"].includes(periode)) {
    return NextResponse.json({ error: "Période invalide" }, { status: 400 });
  }
  const dateRaw = searchParams.get("date");
  const ref = dateRaw ? new Date(`${dateRaw}T12:00:00`) : new Date();
  if (Number.isNaN(ref.getTime())) {
    return NextResponse.json({ error: "Date invalide" }, { status: 400 });
  }
  const etab = await etablissementDeLaSession(request, searchParams.get("etablissementId"));
  if (!etab) return NextResponse.json({ error: "Établissement introuvable" }, { status: 404 });
  const data = await dossierHygiene(periode, ref, etab.id);
  return NextResponse.json(data);
}
