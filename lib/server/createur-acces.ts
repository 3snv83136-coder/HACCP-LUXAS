import { prisma } from "@/lib/db";
import { hashCode, verifyCode } from "@/lib/crypto";

export const EMAIL_TEST_DASHBOARD = "l@gmail.com";
export const CODE_TEST_DASHBOARD = "2580";

function normaliserEmail(email: string) {
  return email.trim().toLowerCase();
}

export async function assurerCompteDashboard() {
  const existant = await prisma.comptePlateforme.findUnique({
    where: { email: EMAIL_TEST_DASHBOARD },
  });
  if (existant) return existant;

  return prisma.comptePlateforme.create({
    data: {
      email: EMAIL_TEST_DASHBOARD,
      motDePasseHash: await hashCode(CODE_TEST_DASHBOARD),
      prenom: "Admin",
      nom: "Dashboard",
    },
  });
}

export async function verifierAccesDashboard(emailBrut: string, codeBrut: string) {
  await assurerCompteDashboard();
  const email = normaliserEmail(emailBrut);
  const code = codeBrut.trim();
  if (!email || !code) return null;

  const compte = await prisma.comptePlateforme.findFirst({
    where: { email, actif: true },
  });
  if (!compte) return null;
  if (!(await verifyCode(code, compte.motDePasseHash))) return null;
  return compte;
}

export async function compteDashboardCourant() {
  await assurerCompteDashboard();
  return prisma.comptePlateforme.findFirst({
    where: { actif: true },
    orderBy: { createdAt: "asc" },
  });
}

export async function mettreAJourAccesDashboard(opts: {
  email?: string;
  code?: string;
  compteId?: string;
}) {
  const courant = opts.compteId
    ? await prisma.comptePlateforme.findUnique({ where: { id: opts.compteId } })
    : await compteDashboardCourant();
  if (!courant) throw new Error("Aucun compte admin");

  const email = opts.email ? normaliserEmail(opts.email) : courant.email;
  if (!email.includes("@")) throw new Error("E-mail invalide");

  const autre = await prisma.comptePlateforme.findUnique({ where: { email } });
  if (autre && autre.id !== courant.id) throw new Error("Cet e-mail est déjà utilisé");

  const code = opts.code?.trim() ?? "";
  if (code && code.length < 4) throw new Error("Le code doit avoir au moins 4 caractères");

  return prisma.comptePlateforme.update({
    where: { id: courant.id },
    data: {
      email,
      ...(code ? { motDePasseHash: await hashCode(code) } : {}),
    },
  });
}
