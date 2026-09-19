import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { hashCode, verifyCode } from "@/lib/crypto";
import { listEtablissements, resolveEtablissement } from "@/lib/server/etab";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const ROLES = new Set(["operateur", "responsable", "gerant"]);

async function codeDejaUtilise(code: string, exceptMembreId?: string) {
  const rows = await prisma.codeOperateur.findMany({
    where: { actif: true },
    select: { codeHash: true, membreEtablissementId: true },
  });
  for (const row of rows) {
    if (exceptMembreId && row.membreEtablissementId === exceptMembreId) continue;
    if (await verifyCode(code, row.codeHash)) return true;
  }
  return false;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const etab = await resolveEtablissement(searchParams.get("etablissementId"));
  if (!etab) return NextResponse.json({ items: [] });

  const [membres, etablissements] = await Promise.all([
    prisma.membreEtablissement.findMany({
      where: { etablissementId: etab.id },
      include: {
        utilisateur: true,
        codes: { where: { actif: true }, take: 1 },
      },
      orderBy: [{ role: "asc" }, { utilisateur: { nom: "asc" } }],
    }),
    listEtablissements(),
  ]);

  return NextResponse.json({
    etablissement: { id: etab.id, nom: etab.nom },
    etablissements: etablissements.map((e) => ({ id: e.id, nom: e.nom })),
    items: membres.map((m) => ({
      id: m.id,
      utilisateurId: m.utilisateurId,
      prenom: m.utilisateur.prenom,
      nom: m.utilisateur.nom,
      email: m.utilisateur.email,
      role: m.role,
      actif: m.actif && m.utilisateur.actif,
      accesBackoffice: m.role === "responsable" || m.role === "gerant",
      aUnCode: m.codes.length > 0,
    })),
  });
}

export async function POST(request: Request) {
  const body = (await request.json()) as {
    prenom?: string;
    nom?: string;
    email?: string;
    role?: string;
    code?: string;
    etablissementId?: string;
  };
  const prenom = (body.prenom ?? "").trim();
  const nom = (body.nom ?? "").trim();
  const role = body.role ?? "operateur";
  const code = (body.code ?? "").replace(/\D/g, "").slice(0, 4);

  if (!prenom || !nom) {
    return NextResponse.json({ error: "Prénom et nom requis" }, { status: 400 });
  }
  if (!ROLES.has(role)) {
    return NextResponse.json({ error: "Rôle invalide" }, { status: 400 });
  }
  if (!/^\d{4}$/.test(code)) {
    return NextResponse.json({ error: "Code à 4 chiffres requis" }, { status: 400 });
  }

  const etab = await resolveEtablissement(body.etablissementId ?? null);
  if (!etab) return NextResponse.json({ error: "Établissement introuvable" }, { status: 404 });
  if (await codeDejaUtilise(code)) {
    return NextResponse.json({ error: "Ce code est déjà attribué" }, { status: 409 });
  }

  const utilisateur = await prisma.utilisateur.create({
    data: {
      organisationId: etab.organisationId,
      prenom,
      nom,
      email: body.email?.trim() || null,
    },
  });
  const membre = await prisma.membreEtablissement.create({
    data: {
      utilisateurId: utilisateur.id,
      etablissementId: etab.id,
      role,
    },
  });
  await prisma.codeOperateur.create({
    data: {
      membreEtablissementId: membre.id,
      codeHash: await hashCode(code),
    },
  });

  return NextResponse.json({ ok: true, id: membre.id });
}

export async function PATCH(request: Request) {
  const body = (await request.json()) as {
    id?: string;
    prenom?: string;
    nom?: string;
    email?: string | null;
    role?: string;
    actif?: boolean;
    code?: string;
  };
  if (!body.id) return NextResponse.json({ error: "id requis" }, { status: 400 });

  const membre = await prisma.membreEtablissement.findUnique({
    where: { id: body.id },
    include: { utilisateur: true, codes: true },
  });
  if (!membre) return NextResponse.json({ error: "Salarié introuvable" }, { status: 404 });

  if (body.role && !ROLES.has(body.role)) {
    return NextResponse.json({ error: "Rôle invalide" }, { status: 400 });
  }

  const code = body.code ? body.code.replace(/\D/g, "").slice(0, 4) : "";
  if (body.code) {
    if (!/^\d{4}$/.test(code)) {
      return NextResponse.json({ error: "Code à 4 chiffres requis" }, { status: 400 });
    }
    if (await codeDejaUtilise(code, membre.id)) {
      return NextResponse.json({ error: "Ce code est déjà attribué" }, { status: 409 });
    }
  }

  await prisma.$transaction(async (tx) => {
    await tx.utilisateur.update({
      where: { id: membre.utilisateurId },
      data: {
        prenom: body.prenom?.trim() || undefined,
        nom: body.nom?.trim() || undefined,
        email: body.email === undefined ? undefined : body.email?.trim() || null,
        actif: body.actif,
      },
    });
    await tx.membreEtablissement.update({
      where: { id: membre.id },
      data: {
        role: body.role,
        actif: body.actif,
      },
    });
    if (body.actif === false) {
      await tx.codeOperateur.updateMany({
        where: { membreEtablissementId: membre.id },
        data: { actif: false },
      });
    }
    if (body.actif === true && membre.codes.length > 0 && !code) {
      const dernier = membre.codes[membre.codes.length - 1];
      await tx.codeOperateur.update({
        where: { id: dernier.id },
        data: { actif: true },
      });
    }
    if (code) {
      const hash = await hashCode(code);
      const existing = membre.codes.find((c) => c.actif) ?? membre.codes[0];
      if (existing) {
        await tx.codeOperateur.update({
          where: { id: existing.id },
          data: { codeHash: hash, actif: true },
        });
      } else {
        await tx.codeOperateur.create({
          data: { membreEtablissementId: membre.id, codeHash: hash },
        });
      }
    }
  });

  return NextResponse.json({ ok: true });
}
