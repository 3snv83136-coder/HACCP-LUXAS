import { NextResponse } from "next/server";
import { createurDepuisRequete } from "@/lib/server/createur-request";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: Request) {
  const createur = await createurDepuisRequete(request);
  if (!createur) return NextResponse.json({ error: "Non connecté" }, { status: 401 });
  return NextResponse.json({
    createur: {
      id: createur.createurId,
      email: createur.email,
      prenom: createur.prenom,
      nom: createur.nom,
    },
  });
}
