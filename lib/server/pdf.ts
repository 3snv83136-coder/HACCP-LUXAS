import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib";
import { prisma } from "@/lib/db";
import { libelleEtatHuile } from "@/lib/huile-etat";
import { formatDateHeure, formatTemp } from "@/lib/utils";

export type FiltreDossier = {
  membreId?: string;
  types?: string[];
};

const PAGE_W = 595;
const PAGE_H = 842;
const MARGIN_X = 40;
const MARGIN_BOTTOM = 48;
const HEADER_H = 52;
const TEAL = rgb(0.059, 0.463, 0.431);
const SLATE = rgb(0.07, 0.09, 0.12);
const MUTED = rgb(0.39, 0.45, 0.52);
const LINE = rgb(0.86, 0.89, 0.91);
const ROW_ALT = rgb(0.96, 0.98, 0.98);
const WHITE = rgb(1, 1, 1);

function win(text: string): string {
  return text
    .replace(/[’‘]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/[–—]/g, "-")
    .replace(/€/g, "EUR")
    .replace(/œ/g, "oe")
    .replace(/Œ/g, "OE")
    .replace(/æ/g, "ae")
    .replace(/Æ/g, "AE")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\x09\x0A\x0D\x20-\x7E]/g, " ");
}

function wrap(text: string, font: PDFFont, size: number, maxWidth: number): string[] {
  const raw = win(text).trim() || "-";
  const words = raw.split(/\s+/);
  const lines: string[] = [];
  let cur = "";
  for (const word of words) {
    const next = cur ? `${cur} ${word}` : word;
    if (font.widthOfTextAtSize(next, size) <= maxWidth) {
      cur = next;
      continue;
    }
    if (cur) lines.push(cur);
    if (font.widthOfTextAtSize(word, size) <= maxWidth) {
      cur = word;
    } else {
      let chunk = "";
      for (const ch of word) {
        const trial = chunk + ch;
        if (font.widthOfTextAtSize(trial, size) <= maxWidth) chunk = trial;
        else {
          if (chunk) lines.push(chunk);
          chunk = ch;
        }
      }
      cur = chunk;
    }
  }
  if (cur) lines.push(cur);
  return lines.length ? lines : ["-"];
}

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
  let page!: PDFPage;
  let y = 0;
  let pageNum = 0;

  const footer = (target: PDFPage, n: number) => {
    target.drawLine({
      start: { x: MARGIN_X, y: 34 },
      end: { x: PAGE_W - MARGIN_X, y: 34 },
      thickness: 0.5,
      color: LINE,
    });
    target.drawText(win("Document inalterable - les releves ne sont ni modifies ni supprimes."), {
      x: MARGIN_X,
      y: 20,
      size: 7.5,
      font,
      color: MUTED,
    });
    const label = `Page ${n}`;
    target.drawText(label, {
      x: PAGE_W - MARGIN_X - font.widthOfTextAtSize(label, 8),
      y: 20,
      size: 8,
      font,
      color: MUTED,
    });
  };

  const addPage = () => {
    if (pageNum > 0) footer(page, pageNum);
    page = pdf.addPage([PAGE_W, PAGE_H]);
    pageNum += 1;
    page.drawRectangle({
      x: 0,
      y: PAGE_H - HEADER_H,
      width: PAGE_W,
      height: HEADER_H,
      color: TEAL,
    });
    page.drawText(win("SANITRACE"), {
      x: MARGIN_X,
      y: PAGE_H - 22,
      size: 9,
      font: bold,
      color: WHITE,
    });
    page.drawText(win("Dossier sanitaire HACCP"), {
      x: MARGIN_X,
      y: PAGE_H - 38,
      size: 12,
      font: bold,
      color: WHITE,
    });
    const nom = win(etab.nom);
    const nomW = font.widthOfTextAtSize(nom, 9);
    page.drawText(nom, {
      x: PAGE_W - MARGIN_X - nomW,
      y: PAGE_H - 30,
      size: 9,
      font,
      color: WHITE,
    });
    y = PAGE_H - HEADER_H - 22;
  };

  const ensure = (need = 24) => {
    if (y < MARGIN_BOTTOM + need) addPage();
  };

  const title = (text: string) => {
    ensure(36);
    y -= 6;
    page.drawRectangle({
      x: MARGIN_X,
      y: y - 4,
      width: 4,
      height: 16,
      color: TEAL,
    });
    page.drawText(win(text), {
      x: MARGIN_X + 12,
      y,
      size: 12,
      font: bold,
      color: SLATE,
    });
    y -= 20;
  };

  const para = (text: string, size = 9, useBold = false, color = MUTED) => {
    const f = useBold ? bold : font;
    const lines = wrap(text, f, size, PAGE_W - MARGIN_X * 2);
    for (const line of lines) {
      ensure(size + 6);
      page.drawText(line, { x: MARGIN_X, y, size, font: f, color });
      y -= size + 5;
    }
  };

  const table = (headers: string[], rows: string[][], widths: number[]) => {
    const size = 8;
    const cellPad = 4;
    const drawHeader = () => {
      const h = 18;
      ensure(h + 8);
      page.drawRectangle({
        x: MARGIN_X,
        y: y - 4,
        width: PAGE_W - MARGIN_X * 2,
        height: h,
        color: TEAL,
      });
      let x = MARGIN_X + cellPad;
      headers.forEach((hText, i) => {
        page.drawText(win(hText), {
          x,
          y: y + 2,
          size,
          font: bold,
          color: WHITE,
        });
        x += widths[i] ?? 80;
      });
      y -= h + 2;
    };

    drawHeader();
    if (rows.length === 0) {
      para("Aucun enregistrement sur la periode.");
      y -= 6;
      return;
    }

    rows.forEach((row, rowIndex) => {
      const cellLines = row.map((cell, i) => wrap(cell, font, size, (widths[i] ?? 80) - cellPad * 2));
      const lineCount = Math.max(...cellLines.map((l) => l.length), 1);
      const rowH = lineCount * (size + 3) + 8;
      if (y - rowH < MARGIN_BOTTOM) {
        addPage();
        drawHeader();
      }
      if (rowIndex % 2 === 0) {
        page.drawRectangle({
          x: MARGIN_X,
          y: y - rowH + 10,
          width: PAGE_W - MARGIN_X * 2,
          height: rowH,
          color: ROW_ALT,
        });
      }
      let x = MARGIN_X + cellPad;
      cellLines.forEach((lines, i) => {
        lines.forEach((line, li) => {
          page.drawText(line, {
            x,
            y: y - li * (size + 3),
            size,
            font,
            color: SLATE,
          });
        });
        x += widths[i] ?? 80;
      });
      y -= rowH;
    });
    y -= 10;
  };

  addPage();
  para(etab.nom, 14, true, SLATE);
  para(
    `Periode : ${depuis.toLocaleDateString("fr-FR")} - ${jusqua.toLocaleDateString("fr-FR")}`,
    10,
    false,
    SLATE,
  );
  if (membre) {
    para(`Employe : ${membre.utilisateur.prenom} ${membre.utilisateur.nom}`, 10, false, SLATE);
  }
  para(`Rubriques : ${Array.from(types).join(" · ")}`, 9);
  para(`Genere le ${new Date().toLocaleString("fr-FR")} - seuils issus du PMS parametre.`, 8);
  y -= 8;

  if (types.has("releves")) {
    title("1. Releves de temperatures");
    table(
      ["Date", "Cible", "T°", "Resultat", "Operateur"],
      releves.map((r) => {
        const nom = `${r.codeOperateur.membre.utilisateur.prenom} ${r.codeOperateur.membre.utilisateur.nom}`;
        const cible = r.equipement?.nom ?? r.pointControle?.libelle ?? "-";
        return [formatDateHeure(r.createdAt), cible, formatTemp(r.valeur), r.conforme ? "OK" : "NOK", nom];
      }),
      [95, 145, 60, 60, 155],
    );
  }

  if (types.has("receptions")) {
    title("2. Receptions marchandises");
    table(
      ["Date", "Fournisseur", "Produit", "Resultat"],
      receptions.map((r) => [
        formatDateHeure(r.createdAt),
        r.fournisseur,
        r.produit,
        r.conforme ? "OK" : "REFUS",
      ]),
      [95, 150, 180, 90],
    );
  }

  if (types.has("menage")) {
    title("3. Plan de nettoyage");
    table(
      ["Date", "Zone"],
      menages.map((m) => [formatDateHeure(m.faitAt), m.tache.zone]),
      [120, 395],
    );
  }

  if (types.has("nc")) {
    title("4. Non-conformites");
    table(
      ["Date", "Statut", "Gravite", "Constat"],
      ncs.map((nc) => [formatDateHeure(nc.createdAt), nc.statut, nc.gravite, nc.constat]),
      [90, 70, 70, 285],
    );
  }

  if (types.has("plats")) {
    title("5. Plats temoins");
    table(
      ["Plat", "Service", "Destruction", "Etat"],
      plats.map((p) => [
        p.plat,
        p.serviceDate.toLocaleDateString("fr-FR"),
        p.destructionPrevue.toLocaleDateString("fr-FR"),
        p.detruitAt ? "Detruit" : "En cours",
      ]),
      [175, 100, 110, 130],
    );
  }

  if (types.has("huiles")) {
    title("6. Huiles de friture");
    table(
      ["Date", "Bac", "Etat"],
      huiles.map((h) => [
        formatDateHeure(h.createdAt),
        h.huile.bac,
        libelleEtatHuile(h.action, h.composesPolaires),
      ]),
      [120, 180, 215],
    );
  }

  y -= 4;
  para("Ce document n'est pas un conseil juridique.", 8);

  footer(page, pageNum);
  return pdf.save();
}
