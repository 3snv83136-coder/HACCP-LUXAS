import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { prisma } from "@/lib/db";
import { formatDateHeure, formatTemp } from "@/lib/utils";

export type FiltreDossier = {
  membreId?: string;
  types?: string[];
};

export async function genererDossierSanitaire(
  etablissementId: string,
  depuis: Date,
  jusqua = new Date(),
  filtre: FiltreDossier = {},
) {
  const etab = await prisma.etablissement.findUnique({ where: { id: etablissementId } });
  if (!etab) throw new Error("Établissement introuvable");

  const types = new Set(filtre.types?.length ? filtre.types : ["releves", "receptions", "menage", "nc", "plats", "huiles"]);
  const auteur = filtre.membreId
    ? { codeOperateur: { membreEtablissementId: filtre.membreId } }
    : {};

  const [releves, receptions, menages, ncs, plats, huiles, membre] = await Promise.all([
    types.has("releves")
      ? prisma.releveTemperature.findMany({
          where: { etablissementId, createdAt: { gte: depuis, lte: jusqua }, ...auteur },
          include: {
            equipement: true,
            pointControle: true,
            codeOperateur: { include: { membre: { include: { utilisateur: true } } } },
          },
          orderBy: { createdAt: "asc" },
        })
      : Promise.resolve([]),
    types.has("receptions")
      ? prisma.reception.findMany({
          where: { etablissementId, createdAt: { gte: depuis, lte: jusqua }, ...auteur },
          orderBy: { createdAt: "asc" },
        })
      : Promise.resolve([]),
    types.has("menage")
      ? prisma.executionNettoyage.findMany({
          where: { etablissementId, faitAt: { gte: depuis, lte: jusqua }, ...auteur },
          include: { tache: true },
          orderBy: { faitAt: "asc" },
        })
      : Promise.resolve([]),
    types.has("nc")
      ? prisma.nonConformite.findMany({
          where: { etablissementId, createdAt: { gte: depuis, lte: jusqua } },
          orderBy: { createdAt: "asc" },
        })
      : Promise.resolve([]),
    types.has("plats")
      ? prisma.platTemoin.findMany({
          where: { etablissementId, createdAt: { gte: depuis, lte: jusqua }, ...auteur },
        })
      : Promise.resolve([]),
    types.has("huiles")
      ? prisma.releveHuile.findMany({
          where: {
            createdAt: { gte: depuis, lte: jusqua },
            huile: { etablissementId },
            ...(filtre.membreId ? { codeOperateur: { membreEtablissementId: filtre.membreId } } : {}),
          },
          include: { huile: true },
        })
      : Promise.resolve([]),
    filtre.membreId
      ? prisma.membreEtablissement.findUnique({
          where: { id: filtre.membreId },
          include: { utilisateur: true },
        })
      : Promise.resolve(null),
  ]);

  const pdf = await PDFDocument.create();
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  let page = pdf.addPage([595, 842]);
  let y = 800;

  const ensure = () => {
    if (y < 60) {
      page = pdf.addPage([595, 842]);
      y = 800;
    }
  };

  const line = (text: string, size = 10, useBold = false) => {
    ensure();
    page.drawText(text.slice(0, 110), {
      x: 40,
      y,
      size,
      font: useBold ? bold : font,
      color: rgb(0.07, 0.09, 0.12),
    });
    y -= size + 6;
  };

  line("SANITRACE — Dossier sanitaire", 16, true);
  line(etab.nom, 12, true);
  line(`Periode : ${depuis.toLocaleDateString("fr-FR")} - ${jusqua.toLocaleDateString("fr-FR")}`);
  if (membre) line(`Employe : ${membre.utilisateur.prenom} ${membre.utilisateur.nom}`);
  line(`Filtres : ${Array.from(types).join(", ")}`);
  line(`Document inalterable genere le ${new Date().toLocaleString("fr-FR")}`);
  line("Ce document n'est pas un conseil juridique. Seuils issus du PMS parametre.", 8);
  y -= 8;

  if (types.has("releves")) {
    line("1. Releves de temperatures", 12, true);
    if (releves.length === 0) line("Aucun releve.");
    for (const r of releves) {
      const nom = `${r.codeOperateur.membre.utilisateur.prenom} ${r.codeOperateur.membre.utilisateur.nom}`;
      const cible = r.equipement?.nom ?? r.pointControle?.libelle ?? "-";
      line(`${formatDateHeure(r.createdAt)} | ${cible} | ${formatTemp(r.valeur)} | ${r.conforme ? "OK" : "NOK"} | ${nom}`);
    }
    y -= 8;
  }

  if (types.has("receptions")) {
    line("2. Receptions marchandises", 12, true);
    if (receptions.length === 0) line("Aucune reception.");
    for (const r of receptions) {
      line(`${formatDateHeure(r.createdAt)} | ${r.fournisseur} | ${r.produit} | ${r.conforme ? "OK" : "REFUS"}`);
    }
    y -= 8;
  }

  if (types.has("menage")) {
    line("3. Plan de nettoyage — executions", 12, true);
    if (menages.length === 0) line("Aucune execution.");
    for (const m of menages) {
      line(`${formatDateHeure(m.faitAt)} | ${m.tache.zone}`);
    }
    y -= 8;
  }

  if (types.has("nc")) {
    line("4. Non-conformites", 12, true);
    if (ncs.length === 0) line("Aucune non-conformite.");
    for (const nc of ncs) {
      line(`${formatDateHeure(nc.createdAt)} | ${nc.statut} | ${nc.gravite} | ${nc.constat}`);
    }
    y -= 8;
  }

  if (types.has("plats")) {
    line("5. Plats temoins", 12, true);
    if (plats.length === 0) line("Aucun plat temoin.");
    for (const p of plats) {
      line(`${p.plat} | service ${p.serviceDate.toLocaleDateString("fr-FR")} | destruction ${p.destructionPrevue.toLocaleDateString("fr-FR")} | ${p.detruitAt ? "detruit" : "en cours"}`);
    }
    y -= 8;
  }

  if (types.has("huiles")) {
    line("6. Huiles de friture", 12, true);
    if (huiles.length === 0) line("Aucun releve huile.");
    for (const h of huiles) {
      line(`${formatDateHeure(h.createdAt)} | ${h.huile.bac} | ${h.composesPolaires} % | ${h.action}`);
    }
  }

  y -= 16;
  line("Journal append-only : les releves ne sont ni modifies ni supprimes.", 8);
  return pdf.save();
}
