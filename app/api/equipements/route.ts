import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import QRCode from "qrcode";

export async function GET() {
  const etab = await prisma.etablissement.findFirst();
  if (!etab) return NextResponse.json({ equipements: [] });

  const equipements = await prisma.equipement.findMany({
    where: { etablissementId: etab.id },
    orderBy: { nom: "asc" },
  });

  const base = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const withQr = await Promise.all(
    equipements.map(async (e) => ({
      ...e,
      qrDataUrl: await QRCode.toDataURL(`${base}/terrain/releve/${e.qrToken}`, {
        margin: 1,
        width: 280,
        color: { dark: "#042f2e", light: "#ffffff" },
      }),
    })),
  );

  return NextResponse.json({ etablissement: etab, equipements: withQr });
}
