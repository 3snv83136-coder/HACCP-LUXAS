import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  const doc = await prisma.documentPms.findUnique({ where: { id: params.id } });
  if (!doc?.fichierUrl) {
    return NextResponse.json({ error: "Document introuvable" }, { status: 404 });
  }
  if (doc.fichierUrl.startsWith("data:application/pdf;base64,")) {
    const bytes = Buffer.from(doc.fichierUrl.split(",")[1] ?? "", "base64");
    return new NextResponse(bytes, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${doc.titre.replaceAll(" ", "-")}.pdf"`,
      },
    });
  }
  return NextResponse.redirect(doc.fichierUrl);
}
