import { prisma } from "@/lib/db";
import { pieceValide, type PieceSaisie } from "@/lib/fichiers";
import type { MessageVue } from "@/lib/types";

export type { MessageVue };

export function vueMessage(m: {
  id: string;
  canal: string;
  etablissementId: string;
  auteurType: string;
  auteurNom: string;
  texte: string;
  createdAt: Date;
  pieces: { id: string; nom: string; mime: string; contenu: string }[];
}): MessageVue {
  return {
    id: m.id,
    canal: m.canal,
    etablissementId: m.etablissementId,
    auteurType: m.auteurType,
    auteurNom: m.auteurNom,
    texte: m.texte,
    createdAt: m.createdAt.toISOString(),
    pieces: m.pieces.map((p) => ({
      id: p.id,
      nom: p.nom,
      mime: p.mime,
      contenu: p.contenu,
    })),
  };
}

export async function listerMessages(etablissementId: string, canal: string) {
  const rows = await prisma.message.findMany({
    where: { etablissementId, canal },
    include: { pieces: true },
    orderBy: { createdAt: "desc" },
    take: 80,
  });
  return rows.map(vueMessage);
}

export async function creerMessage(input: {
  canal: "equipe" | "qg";
  etablissementId: string;
  auteurType: "gerant" | "createur";
  auteurNom: string;
  texte: string;
  pieces?: PieceSaisie[];
}) {
  const texte = input.texte.trim();
  const pieces = (input.pieces ?? []).filter(pieceValide).slice(0, 4);
  if (!texte && pieces.length === 0) {
    throw new Error("Écris un message ou joins un fichier");
  }
  const created = await prisma.message.create({
    data: {
      canal: input.canal,
      etablissementId: input.etablissementId,
      auteurType: input.auteurType,
      auteurNom: input.auteurNom,
      texte: texte || "(pièce jointe)",
      pieces: {
        create: pieces.map((p) => ({
          nom: p.nom.trim().slice(0, 120),
          mime: p.mime.slice(0, 80),
          contenu: p.contenu,
        })),
      },
    },
    include: { pieces: true },
  });
  return vueMessage(created);
}
