import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export async function writeAudit(input: {
  etablissementId: string;
  acteur: string;
  action: string;
  cible: string;
  payload: unknown;
}) {
  await prisma.auditLog.create({
    data: {
      etablissementId: input.etablissementId,
      acteur: input.acteur,
      action: input.action,
      cible: input.cible,
      payloadJson: JSON.stringify(input.payload),
    },
  });
}
