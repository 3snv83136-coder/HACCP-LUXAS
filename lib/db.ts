import { existsSync, copyFileSync } from "node:fs";
import path from "node:path";
import { PrismaClient } from "@prisma/client";

const BUNDLED_DB = path.join(process.cwd(), "prisma", "dev.db");
const VERCEL_DB = "/tmp/sanitrace.db";

function resolveDatabaseUrl(): string {
  const current = process.env.DATABASE_URL?.trim();
  if (current) return current;
  if (process.env.VERCEL) return `file:${VERCEL_DB}`;
  return "file:./prisma/dev.db";
}

function prepareDatabaseFile() {
  if (!process.env.VERCEL) return;
  if (existsSync(VERCEL_DB)) return;
  if (existsSync(BUNDLED_DB)) {
    copyFileSync(BUNDLED_DB, VERCEL_DB);
  }
}

process.env.DATABASE_URL = resolveDatabaseUrl();
prepareDatabaseFile();

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
    datasources: {
      db: { url: process.env.DATABASE_URL },
    },
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
