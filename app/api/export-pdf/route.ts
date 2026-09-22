import { NextResponse } from "next/server";
import { genererDossierSanitaire } from "@/lib/server/pdf";
import { prisma, writeAudit } from "@/lib/db";
import { etablissementDeLaSession } from "@/lib/server/etab";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const etab = await etablissementDeLaSession(request, searchParams.get("etablissementId"));
  if (!etab) return NextResponse.json({ error: "Établissement introuvable" }, { status: 404 });

  const mois = searchParams.get("mois");
  let depuis: Date;
  let jusqua = new Date();
  if (mois && /^\d{4}-\d{2}$/.test(mois)) {
    const [y, m] = mois.split("-").map((n) => Number.parseInt(n, 10));
    depuis = new Date(y, m - 1, 1, 0, 0, 0, 0);
    jusqua = new Date(y, m, 0, 23, 59, 59, 999);
  } else {
    const jours = Number.parseInt(searchParams.get("jours") ?? "7", 10);
    depuis = new Date();
    depuis.setDate(depuis.getDate() - (Number.isFinite(jours) ? jours : 7));
  }

  const types = (searchParams.get("types") ?? "")
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
  const membreId = searchParams.get("employeId") || searchParams.get("membreId") || undefined;

  const bytes = await genererDossierSanitaire(etab.id, depuis, jusqua, { membreId, types });
  const filename = `dossier-${etab.slug ?? etab.id}-${depuis.toISOString().slice(0, 10)}.pdf`;
  const fichierUrl = `data:application/pdf;base64,${Buffer.from(bytes).toString("base64")}`;

  await prisma.documentPms.create({
    data: {
      etablissementId: etab.id,
      titre: `Dossier sanitaire ${depuis.toLocaleDateString("fr-FR")}`,
      categorie: "export_ddpp",
      version: new Date().toISOString().slice(0, 10),
      fichierUrl,
    },
  });
  await writeAudit({
    etablissementId: etab.id,
    acteur: "export",
    action: "export_dossier_pdf",
    cible: filename,
    payload: { mois, types, membreId, filename },
  });

  return new NextResponse(Buffer.from(bytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
