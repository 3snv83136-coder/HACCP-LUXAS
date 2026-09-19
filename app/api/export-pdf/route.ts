import { NextResponse } from "next/server";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { genererDossierSanitaire } from "@/lib/server/pdf";
import { prisma, writeAudit } from "@/lib/db";
import { resolveEtablissement } from "@/lib/server/etab";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const etab = await resolveEtablissement(searchParams.get("etablissementId"));
  if (!etab) return NextResponse.json({ error: "Établissement introuvable" }, { status: 404 });
  const jours = Number.parseInt(searchParams.get("jours") ?? "7", 10);
  const depuis = new Date();
  depuis.setDate(depuis.getDate() - (Number.isFinite(jours) ? jours : 7));
  const bytes = await genererDossierSanitaire(etab.id, depuis);

  const dir = path.join(process.cwd(), "public", "archives");
  await mkdir(dir, { recursive: true });
  const filename = `dossier-${etab.id}-${depuis.toISOString().slice(0, 10)}.pdf`;
  await writeFile(path.join(dir, filename), bytes);

  await prisma.documentPms.create({
    data: {
      etablissementId: etab.id,
      titre: `Dossier sanitaire ${depuis.toLocaleDateString("fr-FR")}`,
      categorie: "export_ddpp",
      version: new Date().toISOString().slice(0, 10),
      fichierUrl: `/archives/${filename}`,
    },
  });
  await writeAudit({
    etablissementId: etab.id,
    acteur: "export",
    action: "export_dossier_pdf",
    cible: filename,
    payload: { jours, filename },
  });

  return new NextResponse(Buffer.from(bytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
