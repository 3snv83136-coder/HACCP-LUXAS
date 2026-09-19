import { NextResponse } from "next/server";
import { getBootstrap } from "@/lib/server/bootstrap";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  try {
    const payload = await getBootstrap(searchParams.get("etablissementId") ?? undefined);
    return NextResponse.json(payload);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erreur bootstrap";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
