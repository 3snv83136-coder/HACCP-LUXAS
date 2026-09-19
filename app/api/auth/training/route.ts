import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(
    { error: "Le mode entraînement sans code est désactivé." },
    { status: 403 },
  );
}
