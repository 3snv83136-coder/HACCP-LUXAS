import { NextResponse } from "next/server";
import { collecterAlertes } from "@/lib/server/alerts";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const alertes = await collecterAlertes(searchParams.get("etablissementId") ?? undefined);
  return NextResponse.json({ alertes });
}
