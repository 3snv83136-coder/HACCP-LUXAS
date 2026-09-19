import { prisma } from "@/lib/db";

export async function pousserAlerte(input: {
  etablissementId: string;
  type: string;
  message: string;
}) {
  const alerte = await prisma.alerte.create({
    data: {
      etablissementId: input.etablissementId,
      type: input.type,
      message: input.message,
      canal: process.env.RESEND_API_KEY ? "email" : "in_app",
    },
  });

  const key = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM;
  if (!key || !from) return alerte;

  const etab = await prisma.etablissement.findUnique({
    where: { id: input.etablissementId },
    include: { organisation: { include: { parametres: true } } },
  });
  const email = etab?.organisation.parametres.find((p) => p.cle === "EMAIL_ALERTES")?.valeur;
  if (!email) return alerte;

  await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [email],
      subject: `[Sanitrace] ${input.type}`,
      text: `${etab?.nom ?? "Établissement"}\n\n${input.message}`,
    }),
  }).catch(() => undefined);

  return alerte;
}
