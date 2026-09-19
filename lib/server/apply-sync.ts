import { prisma, writeAudit } from "@/lib/db";
import { isTemperatureConforme } from "@/lib/conformity";
import type { QueueItem } from "@/lib/types";
import { nanoid } from "nanoid";

async function ensureCode(codeOperateurId: string, etablissementId: string) {
  const code = await prisma.codeOperateur.findFirst({
    where: {
      id: codeOperateurId,
      actif: true,
      membre: { etablissementId, actif: true },
    },
    include: { membre: { include: { utilisateur: true } } },
  });
  if (!code) throw new Error("Code opérateur invalide pour cet établissement");
  return code;
}

async function applyReleve(item: QueueItem) {
  const p = item.payload;
  const clientUuid = String(p.clientUuid ?? item.id);
  const existing = await prisma.releveTemperature.findUnique({ where: { clientUuid } });
  if (existing) return;

  const etablissementId = String(p.etablissementId);
  const code = await ensureCode(String(p.codeOperateurId), etablissementId);
  const equipementId = p.equipementId ? String(p.equipementId) : null;
  const pointControleId = p.pointControleId ? String(p.pointControleId) : null;
  const valeur = Number(p.valeur);
  if (!Number.isFinite(valeur)) throw new Error("Température invalide");

  let seuilMin: number | null = null;
  let seuilMax: number | null = null;
  let cibleNom = "point de contrôle";

  if (equipementId) {
    const eq = await prisma.equipement.findFirst({
      where: { id: equipementId, etablissementId, actif: true },
    });
    if (!eq) throw new Error("Équipement introuvable");
    seuilMin = eq.seuilMin;
    seuilMax = eq.seuilMax;
    cibleNom = eq.nom;
  } else if (pointControleId) {
    const pt = await prisma.pointControle.findFirst({
      where: { id: pointControleId, etablissementId, actif: true },
    });
    if (!pt) throw new Error("Point de contrôle introuvable");
    seuilMin = pt.seuilMin;
    seuilMax = pt.seuilMax;
    cibleNom = pt.libelle;
  } else {
    throw new Error("Relevé sans cible");
  }

  const conforme = isTemperatureConforme(valeur, { seuilMin, seuilMax });

  const releve = await prisma.releveTemperature.create({
    data: {
      clientUuid,
      etablissementId,
      equipementId,
      pointControleId,
      valeur,
      conforme,
      methode: String(p.methode ?? "sonde_manuelle"),
      codeOperateurId: code.id,
      note: p.note ? String(p.note) : null,
      corrigeParId: p.corrigeParId ? String(p.corrigeParId) : null,
    },
  });

  if (!conforme) {
    await prisma.nonConformite.create({
      data: {
        etablissementId,
        source: "releve",
        sourceId: releve.id,
        constat: `Température hors seuil sur ${cibleNom} : ${valeur} °C (min ${seuilMin ?? "—"} / max ${seuilMax ?? "—"}).`,
        gravite: "haute",
        statut: "ouvert",
      },
    });
  }

  await writeAudit({
    etablissementId,
    acteur: `${code.membre.utilisateur.prenom} ${code.membre.utilisateur.nom}`,
    action: "insert_releve_temperature",
    cible: releve.id,
    payload: { clientUuid, valeur, conforme, cibleNom },
  });
}

async function applyReception(item: QueueItem) {
  const p = item.payload;
  const clientUuid = String(p.clientUuid ?? item.id);
  const existing = await prisma.reception.findUnique({ where: { clientUuid } });
  if (existing) return;

  const etablissementId = String(p.etablissementId);
  const code = await ensureCode(String(p.codeOperateurId), etablissementId);
  const conforme = Boolean(p.conforme);

  const reception = await prisma.reception.create({
    data: {
      clientUuid,
      etablissementId,
      fournisseur: String(p.fournisseur ?? ""),
      blRef: p.blRef ? String(p.blRef) : null,
      produit: String(p.produit ?? ""),
      lot: p.lot ? String(p.lot) : null,
      dlc: p.dlc ? String(p.dlc) : null,
      temperature: p.temperature == null ? null : Number(p.temperature),
      emballageOk: Boolean(p.emballageOk),
      estampilleOk: Boolean(p.estampilleOk),
      conforme,
      photoUrl: p.photoUrl ? String(p.photoUrl) : null,
      codeOperateurId: code.id,
    },
  });

  if (!conforme) {
    await prisma.nonConformite.create({
      data: {
        etablissementId,
        source: "reception",
        sourceId: reception.id,
        constat: `Réception refusée — ${reception.produit} / ${reception.fournisseur}`,
        gravite: "haute",
        statut: "ouvert",
      },
    });
  }

  await writeAudit({
    etablissementId,
    acteur: `${code.membre.utilisateur.prenom} ${code.membre.utilisateur.nom}`,
    action: "insert_reception",
    cible: reception.id,
    payload: { clientUuid, conforme },
  });
}

async function applyMenage(item: QueueItem) {
  const p = item.payload;
  const clientUuid = String(p.clientUuid ?? item.id);
  const existing = await prisma.executionNettoyage.findUnique({ where: { clientUuid } });
  if (existing) return;
  const etablissementId = String(p.etablissementId);
  const code = await ensureCode(String(p.codeOperateurId), etablissementId);

  const exec = await prisma.executionNettoyage.create({
    data: {
      clientUuid,
      tacheNettoyageId: String(p.tacheNettoyageId),
      etablissementId,
      codeOperateurId: code.id,
      faitAt: p.faitAt ? new Date(String(p.faitAt)) : new Date(),
      note: p.note ? String(p.note) : null,
      photoUrl: p.photoUrl ? String(p.photoUrl) : null,
    },
  });

  await writeAudit({
    etablissementId,
    acteur: `${code.membre.utilisateur.prenom} ${code.membre.utilisateur.nom}`,
    action: "insert_execution_nettoyage",
    cible: exec.id,
    payload: { clientUuid },
  });
}

async function applyNc(item: QueueItem) {
  const p = item.payload;
  const etablissementId = String(p.etablissementId);
  await prisma.nonConformite.create({
    data: {
      id: nanoid(),
      etablissementId,
      source: "manuel",
      constat: String(p.constat ?? ""),
      gravite: String(p.gravite ?? "moyenne"),
      actionImmediate: p.actionImmediate ? String(p.actionImmediate) : null,
      statut: "ouvert",
      preuveUrl: p.preuveUrl ? String(p.preuveUrl) : null,
    },
  });
}

async function applyChecklist(item: QueueItem) {
  const p = item.payload;
  const clientUuid = String(p.clientUuid ?? item.id);
  const existing = await prisma.checklistExecution.findUnique({ where: { clientUuid } });
  if (existing) return;
  const etablissementId = String(p.etablissementId);
  const code = await ensureCode(String(p.codeOperateurId), etablissementId);
  await prisma.checklistExecution.create({
    data: {
      clientUuid,
      checklistId: String(p.checklistId),
      codeOperateurId: code.id,
      itemsJson: JSON.stringify(p.items ?? []),
    },
  });
  await writeAudit({
    etablissementId,
    acteur: `${code.membre.utilisateur.prenom} ${code.membre.utilisateur.nom}`,
    action: "insert_checklist_execution",
    cible: String(p.checklistId),
    payload: { clientUuid },
  });
}

async function applyHuile(item: QueueItem) {
  const p = item.payload;
  const clientUuid = String(p.clientUuid ?? item.id);
  const existing = await prisma.releveHuile.findUnique({ where: { clientUuid } });
  if (existing) return;
  const etablissementId = String(p.etablissementId);
  const code = await ensureCode(String(p.codeOperateurId), etablissementId);
  const polaires = Number(p.composesPolaires);
  const action = String(p.action ?? "ok");
  const releve = await prisma.releveHuile.create({
    data: {
      clientUuid,
      huileId: String(p.huileId),
      composesPolaires: polaires,
      action,
      codeOperateurId: code.id,
    },
  });
  if (action === "vidange" || Boolean(p.horsSeuil)) {
    await prisma.nonConformite.create({
      data: {
        etablissementId,
        source: "huile",
        sourceId: releve.id,
        constat: `Huile hors seuil — ${polaires} % de composés polaires.`,
        gravite: "haute",
        statut: "ouvert",
      },
    });
  }
}

async function applyPlatTemoin(item: QueueItem) {
  const p = item.payload;
  const clientUuid = String(p.clientUuid ?? item.id);
  const existing = await prisma.platTemoin.findUnique({ where: { clientUuid } });
  if (existing) return;
  const etablissementId = String(p.etablissementId);
  const code = await ensureCode(String(p.codeOperateurId), etablissementId);
  await prisma.platTemoin.create({
    data: {
      clientUuid,
      etablissementId,
      plat: String(p.plat ?? ""),
      serviceDate: new Date(String(p.serviceDate ?? Date.now())),
      codeOperateurId: code.id,
      destructionPrevue: new Date(String(p.destructionPrevue)),
    },
  });
}

async function applyDestructionPlat(item: QueueItem) {
  const id = String(item.payload.id ?? "");
  if (!id) throw new Error("Plat témoin manquant");
  await prisma.platTemoin.updateMany({
    where: { OR: [{ id }, { clientUuid: id }] },
    data: { detruitAt: new Date() },
  });
}

async function applyLot(item: QueueItem) {
  const p = item.payload;
  await prisma.lotProduit.create({
    data: {
      etablissementId: String(p.etablissementId),
      type: String(p.type),
      produit: String(p.produit),
      lotSource: p.lotSource ? String(p.lotSource) : null,
      dateDebut: new Date(String(p.dateDebut ?? Date.now())),
      dlcSecondaire: new Date(String(p.dlcSecondaire)),
      qrToken: String(p.qrToken ?? nanoid()),
      createdBy: String(p.createdBy ?? p.codeOperateurId ?? "terrain"),
    },
  });
}

export async function applyQueueItem(item: QueueItem) {
  switch (item.kind) {
    case "releve_temperature":
      return applyReleve(item);
    case "reception":
      return applyReception(item);
    case "execution_nettoyage":
      return applyMenage(item);
    case "non_conformite":
      return applyNc(item);
    case "plat_temoin":
      return applyPlatTemoin(item);
    case "plat_temoin_destruction":
      return applyDestructionPlat(item);
    case "lot_produit":
      return applyLot(item);
    case "checklist_execution":
      return applyChecklist(item);
    case "releve_huile":
      return applyHuile(item);
    default:
      throw new Error(`Type de synchro inconnu: ${item.kind}`);
  }
}
