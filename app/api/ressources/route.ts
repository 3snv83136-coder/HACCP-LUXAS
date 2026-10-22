import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { etablissementDeLaSession } from "@/lib/server/etab";
import { PARAM_KEYS, SEED_PARAMETRES } from "@/lib/params";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: Request) {
  const etab = await etablissementDeLaSession(request);
  if (!etab) return NextResponse.json({ error: "Établissement introuvable" }, { status: 404 });

  const [frigos, friteuses, surfaces] = await Promise.all([
    prisma.equipement.findMany({
      where: { etablissementId: etab.id, actif: true },
      orderBy: { nom: "asc" },
    }),
    prisma.huileFriture.findMany({
      where: { etablissementId: etab.id, actif: true },
      orderBy: { bac: "asc" },
    }),
    prisma.tacheNettoyage.findMany({
      where: { etablissementId: etab.id, actif: true },
      orderBy: { zone: "asc" },
    }),
  ]);

  return NextResponse.json({
    etablissement: { id: etab.id, nom: etab.nom, slug: etab.slug, email: etab.email },
    frigos,
    friteuses,
    surfaces,
  });
}

export async function POST(request: Request) {
  const etab = await etablissementDeLaSession(request);
  if (!etab) return NextResponse.json({ error: "Établissement introuvable" }, { status: 404 });
  const body = (await request.json()) as {
    kind?: string;
    nom?: string;
    type?: string;
    seuilMax?: number;
    frequence?: string;
  };
  const nom = (body.nom ?? "").trim();
  if (!nom) return NextResponse.json({ error: "Nom requis" }, { status: 400 });

  if (body.kind === "frigo") {
    const type = body.type === "froid_negatif" ? "froid_negatif" : "froid_positif";
    const params = await prisma.parametre.findMany({ where: { organisationId: etab.organisationId } });
    const map = Object.fromEntries(params.map((p) => [p.cle, p.valeur]));
    const seuilPositif = Number(map[PARAM_KEYS.TEMP_FROID_POSITIF] ?? SEED_PARAMETRES.TEMP_FROID_POSITIF);
    const seuilNegatif = Number(map[PARAM_KEYS.TEMP_CONGELATION] ?? SEED_PARAMETRES.TEMP_CONGELATION);
    const item = await prisma.equipement.create({
      data: {
        etablissementId: etab.id,
        nom,
        type,
        qrToken: `eq-${Date.now().toString(36)}`,
        seuilMax: type === "froid_negatif" ? seuilNegatif : (body.seuilMax ?? seuilPositif),
      },
    });
    await prisma.planFrequence.create({
      data: {
        etablissementId: etab.id,
        cibleType: "equipement",
        cibleId: item.id,
        frequence: "2x_jour",
        horaires: `${map[PARAM_KEYS.RELEVE_MATIN_LIMITE] ?? "11:00"},${map[PARAM_KEYS.RELEVE_SOIR_LIMITE] ?? "18:00"}`,
      },
    });
    return NextResponse.json({ ok: true, item });
  }
  if (body.kind === "friteuse") {
    const item = await prisma.huileFriture.create({
      data: { etablissementId: etab.id, bac: nom },
    });
    return NextResponse.json({ ok: true, item });
  }
  if (body.kind === "surface") {
    const item = await prisma.tacheNettoyage.create({
      data: {
        etablissementId: etab.id,
        zone: nom,
        frequence: body.frequence?.trim() || "quotidien",
        methodeTact: "T.A.C.T. — nettoyer, rincer, désinfecter, sécher",
        roleResponsable: "operateur",
      },
    });
    return NextResponse.json({ ok: true, item });
  }
  return NextResponse.json({ error: "Type inconnu" }, { status: 400 });
}

export async function PATCH(request: Request) {
  const etab = await etablissementDeLaSession(request);
  if (!etab) return NextResponse.json({ error: "Établissement introuvable" }, { status: 404 });
  const body = (await request.json()) as { kind?: string; id?: string; nom?: string };
  const kind = body.kind ?? "";
  const id = body.id ?? "";
  const nom = (body.nom ?? "").trim();
  if (!kind || !id || !nom) {
    return NextResponse.json({ error: "kind, id et nom requis" }, { status: 400 });
  }

  if (kind === "frigo") {
    await prisma.equipement.updateMany({
      where: { id, etablissementId: etab.id },
      data: { nom },
    });
  } else if (kind === "friteuse") {
    await prisma.huileFriture.updateMany({
      where: { id, etablissementId: etab.id },
      data: { bac: nom },
    });
  } else if (kind === "surface") {
    await prisma.tacheNettoyage.updateMany({
      where: { id, etablissementId: etab.id },
      data: { zone: nom },
    });
  } else {
    return NextResponse.json({ error: "Type inconnu" }, { status: 400 });
  }
  return NextResponse.json({ ok: true });
}

export async function DELETE(request: Request) {
  const etab = await etablissementDeLaSession(request);
  if (!etab) return NextResponse.json({ error: "Établissement introuvable" }, { status: 404 });
  const { searchParams } = new URL(request.url);
  const kind = searchParams.get("kind");
  const id = searchParams.get("id");
  if (!kind || !id) return NextResponse.json({ error: "kind et id requis" }, { status: 400 });

  if (kind === "frigo") {
    await prisma.equipement.updateMany({
      where: { id, etablissementId: etab.id },
      data: {
        actif: false,
        qrToken: `supprime-${id.slice(-8)}-${Date.now().toString(36)}`,
      },
    });
    await prisma.planFrequence.updateMany({
      where: { etablissementId: etab.id, cibleType: "equipement", cibleId: id },
      data: { actif: false },
    });
  } else if (kind === "friteuse") {
    await prisma.huileFriture.updateMany({
      where: { id, etablissementId: etab.id },
      data: { actif: false },
    });
  } else if (kind === "surface") {
    await prisma.tacheNettoyage.updateMany({
      where: { id, etablissementId: etab.id },
      data: { actif: false },
    });
  } else {
    return NextResponse.json({ error: "Type inconnu" }, { status: 400 });
  }
  return NextResponse.json({ ok: true });
}
