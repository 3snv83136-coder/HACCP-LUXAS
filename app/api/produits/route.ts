import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { DLC_NON_APPLICABLE, dlcEstAffichee } from "@/lib/dlc";
import { plageHygiene, type PeriodeHygiene } from "@/lib/hygiene";
import { listEtablissements, etablissementDeLaSession } from "@/lib/server/etab";

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
  const { start, end } = plageHygiene(periode, ref);
  const etab = await etablissementDeLaSession(request, searchParams.get("etablissementId"));
  if (!etab) return NextResponse.json({ error: "Établissement introuvable" }, { status: 404 });

  const range = { gte: start, lte: end };
  const [receptions, lots, nettoyage, etablissements] = await Promise.all([
    prisma.reception.findMany({
      where: { etablissementId: etab.id, createdAt: range },
      include: { codeOperateur: { include: { membre: { include: { utilisateur: true } } } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.lotProduit.findMany({
      where: {
        etablissementId: etab.id,
        createdAt: range,
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.produitNettoyage.findMany({
      where: { etablissementId: etab.id },
      orderBy: { nom: "asc" },
    }),
    listEtablissements(etab.organisationId),
  ]);

  return NextResponse.json({
    etablissement: { id: etab.id, nom: etab.nom },
    etablissements: etablissements.map((e) => ({ id: e.id, nom: e.nom })),
    periode,
    debut: start.toISOString(),
    fin: end.toISOString(),
    receptions: receptions.map((r) => ({
      id: r.id,
      kind: "reception" as const,
      at: r.createdAt.toISOString(),
      produit: r.produit,
      fournisseur: r.fournisseur,
      lot: r.lot,
      dlc: r.dlc,
      temperature: r.temperature,
      conforme: r.conforme,
      auteur: r.codeOperateur
        ? `${r.codeOperateur.membre.utilisateur.prenom} ${r.codeOperateur.membre.utilisateur.nom}`
        : "—",
    })),
    lots: lots.map((l) => ({
      id: l.id,
      kind: "lot" as const,
      at: l.createdAt.toISOString(),
      produit: l.produit,
      type: l.type,
      lot: l.lotSource,
      dlc: dlcEstAffichee(l.dlcSecondaire) ? l.dlcSecondaire.toISOString() : null,
      qrToken: l.qrToken,
    })),
    nettoyage: nettoyage.map((p) => ({
      id: p.id,
      nom: p.nom,
      dosage: p.dosage,
      tempsContact: p.tempsContact,
      dangers: p.dangers,
    })),
  });
}

export async function POST(request: Request) {
  const body = (await request.json()) as {
    produit?: string;
    type?: string;
    lotSource?: string;
    dlcSecondaire?: string;
    etablissementId?: string;
  };
  const produit = (body.produit ?? "").trim();
  if (!produit) return NextResponse.json({ error: "Produit requis" }, { status: 400 });
  const etab = await etablissementDeLaSession(request, body.etablissementId ?? null);
  if (!etab) return NextResponse.json({ error: "Établissement introuvable" }, { status: 404 });

  const type = body.type?.trim() || "ouverture";
  const saisie = body.dlcSecondaire ? new Date(body.dlcSecondaire) : null;
  const dlc = saisie && !Number.isNaN(saisie.getTime()) ? saisie : DLC_NON_APPLICABLE;
  const lot = await prisma.lotProduit.create({
    data: {
      etablissementId: etab.id,
      type,
      produit,
      lotSource: body.lotSource?.trim() || null,
      dateDebut: new Date(),
      dlcSecondaire: dlc,
      qrToken: `lot-${randomUUID()}`,
      createdBy: "backoffice",
    },
  });
  return NextResponse.json({ ok: true, id: lot.id });
}
