import { NextResponse } from "next/server";
import { sessionDepuisRequete } from "@/lib/server/session-request";
import { creerMessage, listerMessages } from "@/lib/server/messages";
import type { PieceSaisie } from "@/lib/fichiers";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: Request) {
  const session = await sessionDepuisRequete(request);
  if (!session) return NextResponse.json({ error: "Non connecté" }, { status: 401 });
  const canal = new URL(request.url).searchParams.get("canal") === "qg" ? "qg" : "equipe";
  if (canal === "qg" && session.role === "operateur") {
    return NextResponse.json({ error: "Accès réservé à la gérance" }, { status: 403 });
  }
  const items = await listerMessages(session.etablissementId, canal);
  return NextResponse.json({ items });
}

export async function POST(request: Request) {
  const session = await sessionDepuisRequete(request);
  if (!session) return NextResponse.json({ error: "Non connecté" }, { status: 401 });
  const body = (await request.json()) as {
    canal?: string;
    texte?: string;
    pieces?: PieceSaisie[];
  };
  const canal = body.canal === "qg" ? "qg" : "equipe";
  if (session.role === "operateur") {
    return NextResponse.json({ error: "Les employés reçoivent les infos, sans réponse" }, { status: 403 });
  }
  try {
    const item = await creerMessage({
      canal,
      etablissementId: session.etablissementId,
      auteurType: "gerant",
      auteurNom: `${session.prenom} ${session.nom}`.trim(),
      texte: body.texte ?? "",
      pieces: body.pieces,
    });
    return NextResponse.json({ ok: true, item });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Envoi impossible" },
      { status: 400 },
    );
  }
}
