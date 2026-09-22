import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  try {
    const total = await prisma.comptePlateforme.count();
    return NextResponse.json({ initialise: total > 0 });
  } catch {
    return NextResponse.json({ initialise: false });
  }
}
