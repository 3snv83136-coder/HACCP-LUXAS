import { prisma } from "@/lib/db";
import { hashCode } from "@/lib/crypto";
import { EMAIL_RESTO_DEMO, MDP_RESTO_DEMO } from "@/lib/server/auth-resto";
import { EMAIL_TEST_DASHBOARD, CODE_TEST_DASHBOARD } from "@/lib/server/createur-acces";

export const PIN_BACKOFFICE_ZINC = "1304";
export const PINS_TERRAIN_ZINC = {
  "karim@luxas.local": "2580",
  "sophie@luxas.local": "1470",
  "gerant@luxas.local": "3690",
} as const;

async function remplacerPinMembre(membreId: string, pin: string) {
  const hash = await hashCode(pin);
  const existant = await prisma.codeOperateur.findFirst({
    where: { membreEtablissementId: membreId, actif: true },
  });
  if (existant) {
    await prisma.codeOperateur.update({ where: { id: existant.id }, data: { codeHash: hash } });
    return;
  }
  await prisma.codeOperateur.create({
    data: { membreEtablissementId: membreId, codeHash: hash },
  });
}

export async function assurerCodesDemo() {
  const qg = await prisma.comptePlateforme.findUnique({
    where: { email: EMAIL_TEST_DASHBOARD },
  });
  if (qg) {
    await prisma.comptePlateforme.update({
      where: { id: qg.id },
      data: { motDePasseHash: await hashCode(CODE_TEST_DASHBOARD), actif: true },
    });
  } else {
    await prisma.comptePlateforme.create({
      data: {
        email: EMAIL_TEST_DASHBOARD,
        motDePasseHash: await hashCode(CODE_TEST_DASHBOARD),
        prenom: "Admin",
        nom: "Dashboard",
      },
    });
  }

  const zinc = await prisma.etablissement.findFirst({
    where: {
      OR: [
        { slug: "luxas" },
        { email: { equals: EMAIL_RESTO_DEMO, mode: "insensitive" } },
        { nom: { contains: "Zinc Bouillon", mode: "insensitive" } },
      ],
    },
  });
  if (!zinc) return;

  await prisma.etablissement.update({
    where: { id: zinc.id },
    data: { codeBackofficeHash: await hashCode(PIN_BACKOFFICE_ZINC) },
  });

  const mdp = await hashCode(MDP_RESTO_DEMO);
  const gerants = await prisma.membreEtablissement.findMany({
    where: { etablissementId: zinc.id, role: "gerant", actif: true },
    include: { utilisateur: true },
  });
  for (const membre of gerants) {
    if (membre.utilisateur.email) {
      await prisma.utilisateur.update({
        where: { id: membre.utilisateur.id },
        data: { motDePasseHash: mdp, actif: true },
      });
    }
  }

  let demo = await prisma.utilisateur.findFirst({
    where: { email: { equals: EMAIL_RESTO_DEMO, mode: "insensitive" } },
  });
  if (!demo) {
    demo = await prisma.utilisateur.create({
      data: {
        organisationId: zinc.organisationId,
        email: EMAIL_RESTO_DEMO,
        prenom: "Gérant",
        nom: "Luxas",
        motDePasseHash: mdp,
      },
    });
  } else {
    await prisma.utilisateur.update({
      where: { id: demo.id },
      data: { motDePasseHash: mdp, actif: true },
    });
  }
  let membreDemo = await prisma.membreEtablissement.findFirst({
    where: { utilisateurId: demo.id, etablissementId: zinc.id },
  });
  if (!membreDemo) {
    membreDemo = await prisma.membreEtablissement.create({
      data: { utilisateurId: demo.id, etablissementId: zinc.id, role: "gerant" },
    });
  }
  await remplacerPinMembre(membreDemo.id, PINS_TERRAIN_ZINC[EMAIL_RESTO_DEMO]);

  for (const [email, pin] of Object.entries(PINS_TERRAIN_ZINC)) {
    if (email === EMAIL_RESTO_DEMO) continue;
    const user = await prisma.utilisateur.findFirst({
      where: { email: { equals: email, mode: "insensitive" } },
    });
    if (!user) continue;
    const membre = await prisma.membreEtablissement.findFirst({
      where: { utilisateurId: user.id, etablissementId: zinc.id, actif: true },
    });
    if (!membre) continue;
    await remplacerPinMembre(membre.id, pin);
  }
}
